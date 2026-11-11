import {
  ActorType,
  EscrowStatus,
  OpenRequestStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
  WalletTxType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError, decodeCursor, encodeCursor, isPrismaErrorCode } from "@/lib/http";
import { env } from "@/lib/env";
import { paymentDeadlineFrom } from "@/lib/time";
import { paymentGateway } from "@/lib/payments";
import { parseStorageUrl, bucketName } from "@/lib/storage/url";
import { getStorageProvider } from "@/lib/storage/provider";
import { publishExpireOrderJob } from "@/lib/jobs";
import { transition, assertTransition } from "./state-machine";
import { calcTotals } from "./pricing";
import { expireIfNeeded, expireOrder } from "./expiry";
import {
  notifyOrderRequested,
  notifyPriceSet,
  notifyPaymentReceived,
  notifyExpired,
  notifyOrderRejected,
  notifyOrderStarted,
  notifyOrderDelivered,
  notifyOrderCompleted,
  notifyFundsReleased,
  notifyOrderDisputed,
  notifyOpenRequestClaimed,
} from "@/lib/notifications";
import type {
  CreateOrderInput,
  DeliverOrderInput,
  DisputeOrderInput,
  PayOrderInput,
  RejectOrderInput,
  SetPriceInput,
} from "@/types/schemas/order";

const PROOF_SIGNED_URL_SECONDS = 3600; // 60 menit, lihat TDD 6.1.5.

const DETAIL_INCLUDE = {
  items: true,
  trip: {
    select: {
      id: true,
      serviceType: true,
      originCity: true,
      destCity: true,
      baseFee: true,
      departureAt: true,
      notes: true,
    },
  },
  payment: {
    select: { status: true, amount: true, method: true, paidAt: true },
  },
  escrow: {
    select: { status: true, amount: true, platformFee: true, releasedAt: true },
  },
  deliveryProof: true,
  driver: {
    select: { id: true, user: { select: { id: true, name: true } } },
  },
  customer: {
    select: { id: true, name: true },
  },
} satisfies Prisma.OrderInclude;

type OrderDetailRow = Prisma.OrderGetPayload<{ include: typeof DETAIL_INCLUDE }>;

async function proofUrl(key: string): Promise<string> {
  return getStorageProvider().signedUrl(bucketName("proofs"), key, PROOF_SIGNED_URL_SECONDS);
}

function serializeOrder(order: OrderDetailRow, signedProofUrl: string | null) {
  return {
    id: order.id,
    status: order.status,
    tripId: order.tripId,
    openRequestId: order.openRequestId,
    customerNote: order.customerNote,
    itemSubtotal: order.itemSubtotal,
    serviceFee: order.serviceFee,
    platformFee: order.platformFee,
    totalAmount: order.totalAmount,
    pricedAt: order.pricedAt,
    paymentDeadline: order.paymentDeadline,
    paidAt: order.paidAt,
    startedAt: order.startedAt,
    deliveredAt: order.deliveredAt,
    completedAt: order.completedAt,
    closedAt: order.closedAt,
    closeReason: order.closeReason,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
      estimatedPrice: item.estimatedPrice,
      finalPrice: item.finalPrice,
    })),
    trip: order.trip,
    payment: order.payment,
    escrow: order.escrow,
    deliveryProof: order.deliveryProof
      ? {
          imageUrl: signedProofUrl ?? order.deliveryProof.imageUrl,
          note: order.deliveryProof.note,
          deliveredAt: order.deliveryProof.deliveredAt,
        }
      : null,
    driver: order.driver,
    customer: order.customer,
  };
}

async function fetchOrderDetail(orderId: string): Promise<OrderDetailRow | null> {
  return prisma.order.findUnique({ where: { id: orderId }, include: DETAIL_INCLUDE });
}

async function fetchOrderDetailOrThrow(orderId: string) {
  const order = await fetchOrderDetail(orderId);
  if (!order) {
    throw new AppError(404, "NOT_FOUND", "Order tidak ditemukan");
  }
  const signedProofUrl = order.deliveryProof ? await proofUrl(order.deliveryProof.imageUrl) : null;
  return serializeOrder(order, signedProofUrl);
}

// ---------- Create ----------

export async function createOrder(userId: string, input: CreateOrderInput) {
  const orderId = await prisma.$transaction(async (tx) => {
    const trip = await tx.tripListing.findFirst({
      where: { id: input.tripId, isActive: true },
      include: { driver: { select: { userId: true } } },
    });
    if (!trip) {
      throw new AppError(404, "NOT_FOUND", "Trip tidak ditemukan atau tidak aktif");
    }
    for (const item of input.items) {
      parseStorageUrl(item.imageUrl, "items", userId);
    }
    const created = await tx.order.create({
      data: {
        customerId: userId,
        driverId: trip.driverId,
        tripId: trip.id,
        customerNote: input.customerNote,
        status: OrderStatus.DRAFT,
      },
    });
    await tx.orderItem.createMany({
      data: input.items.map((item) => ({
        orderId: created.id,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        estimatedPrice: item.estimatedPrice,
      })),
    });
    await transition(tx, {
      orderId: created.id,
      from: OrderStatus.DRAFT,
      to: OrderStatus.WAITING_DRIVER_PRICING,
      actor: { type: ActorType.CUSTOMER, id: userId },
    });
    await notifyOrderRequested(tx, trip.driver.userId, created.id);
    return created.id;
  });
  return fetchOrderDetailOrThrow(orderId);
}

// Order dari postingan terbuka lahir langsung di WAITING_DRIVER_PRICING,
// bukan dari DRAFT, sehingga log baris pertama dicatat dengan fromStatus null.
export async function claimOpenRequest(userId: string, requestId: string, clock: Date = new Date()) {
  const orderId = await prisma.$transaction(async (tx) => {
    const request = await tx.openRequest.findUnique({
      where: { id: requestId },
      select: { customerId: true },
    });
    if (!request) {
      throw new AppError(404, "NOT_FOUND", "Postingan terbuka tidak ditemukan");
    }
    const claimed = await tx.openRequest.updateMany({
      where: { id: requestId, status: OpenRequestStatus.OPEN, expiresAt: { gt: clock } },
      data: { status: OpenRequestStatus.CLAIMED },
    });
    if (claimed.count !== 1) {
      throw new AppError(409, "OPEN_REQUEST_UNAVAILABLE", "Postingan sudah diklaim atau sudah kedaluwarsa");
    }
    const driverProfile = await tx.driverProfile.findUnique({ where: { userId } });
    if (!driverProfile) {
      throw new AppError(409, "DRIVER_PROFILE_MISSING", "Profil driver tidak ditemukan");
    }
    const created = await tx.order.create({
      data: {
        customerId: request.customerId,
        driverId: driverProfile.id,
        openRequestId: requestId,
        status: OrderStatus.WAITING_DRIVER_PRICING,
      },
    });
    await tx.orderStatusLog.create({
      data: {
        orderId: created.id,
        fromStatus: null,
        toStatus: OrderStatus.WAITING_DRIVER_PRICING,
        actorType: ActorType.DRIVER,
        actorId: userId,
      },
    });
    await notifyOpenRequestClaimed(tx, request.customerId, created.id);
    return created.id;
  });
  return fetchOrderDetailOrThrow(orderId);
}

// ---------- Set price ----------

export async function setPrice(userId: string, orderId: string, input: SetPriceInput, clock: Date = new Date()) {
  const pricedAt = clock;
  const paymentDeadline = paymentDeadlineFrom(pricedAt);
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, driver: { userId } },
      include: { items: { select: { id: true } }, trip: { select: { baseFee: true } } },
    });
    if (!order) {
      throw new AppError(404, "NOT_FOUND", "Order tidak ditemukan");
    }
    assertTransition(order.status, OrderStatus.WAITING_CUSTOMER_PAYMENT, ActorType.DRIVER);
    const orderItemIds = new Set(order.items.map((item) => item.id));
    const inputIds = new Set(input.items.map((item) => item.id));
    if (orderItemIds.size !== inputIds.size || [...orderItemIds].some((id) => !inputIds.has(id))) {
      throw new AppError(422, "VALIDATION_ERROR", "Daftar item harga tidak sesuai dengan item order");
    }
    if (order.trip && input.serviceFee < order.trip.baseFee) {
      throw new AppError(422, "FEE_BELOW_BASE", "Ongkos jasa tidak boleh di bawah tarif minimum trip");
    }
    const totals = calcTotals({
      itemPrices: input.items.map((item) => item.finalPrice),
      serviceFee: input.serviceFee,
      feeBps: env.PLATFORM_FEE_BPS,
    });
    await Promise.all(
      input.items.map((item) =>
        tx.orderItem.update({ where: { id: item.id }, data: { finalPrice: item.finalPrice } })
      )
    );
    await transition(tx, {
      orderId,
      from: OrderStatus.WAITING_DRIVER_PRICING,
      to: OrderStatus.WAITING_CUSTOMER_PAYMENT,
      actor: { type: ActorType.DRIVER, id: userId },
      data: {
        itemSubtotal: totals.itemSubtotal,
        serviceFee: totals.serviceFee,
        platformFee: totals.platformFee,
        totalAmount: totals.totalAmount,
        pricedAt,
        paymentDeadline,
      },
    });
    await notifyPriceSet(tx, order.customerId, orderId, totals.totalAmount, paymentDeadline);
  });
  // Efek eksternal setelah commit; kegagalan publish tidak menggagalkan set-price (lihat lib/jobs.ts).
  await publishExpireOrderJob(orderId);
  return fetchOrderDetailOrThrow(orderId);
}

// ---------- Pay ----------

export async function payOrder(userId: string, orderId: string, input: PayOrderInput, clock: Date = new Date()) {
  const outcome = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, customerId: userId },
      include: { driver: { select: { userId: true } } },
    });
    if (!order) {
      throw new AppError(404, "NOT_FOUND", "Order tidak ditemukan");
    }

    const existing = await tx.payment.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing && existing.orderId === order.id) return { kind: "ok" as const };
    if (existing) {
      throw new AppError(409, "IDEMPOTENCY_KEY_REUSE", "Idempotency key sudah dipakai untuk order lain");
    }

    if (order.status !== OrderStatus.WAITING_CUSTOMER_PAYMENT) {
      throw new AppError(409, "ORDER_STATE_CONFLICT", "Order tidak menunggu pembayaran");
    }
    if (order.paymentDeadline && order.paymentDeadline <= clock) {
      // Hasil "kadaluarsa" dikembalikan sebagai nilai; galat 410 dilempar setelah commit.
      await transition(tx, {
        orderId,
        from: OrderStatus.WAITING_CUSTOMER_PAYMENT,
        to: OrderStatus.CANCELLED_EXPIRED,
        actor: { type: ActorType.SYSTEM },
        data: { closedAt: clock, closeReason: "PAYMENT_TIMEOUT" },
        extraWhere: { paymentDeadline: { lte: clock } },
      });
      await tx.payment.updateMany({
        where: { orderId, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.EXPIRED },
      });
      await notifyExpired(tx, {
        customerId: order.customerId,
        driverUserId: order.driver.userId,
        orderId,
      });
      return { kind: "expired" as const };
    }

    const amount = order.totalAmount;
    const platformFee = order.platformFee;
    if (amount === null || platformFee === null || order.paymentDeadline === null) {
      throw new AppError(409, "ORDER_STATE_CONFLICT", "Order belum memiliki total harga");
    }

    const gatewayResult = await paymentGateway.charge({ orderId, amount, method: input.method });
    let payment;
    try {
      payment = await tx.payment.create({
        data: {
          orderId,
          method: input.method,
          status: PaymentStatus.PAID,
          amount,
          gatewayRef: gatewayResult.ref,
          idempotencyKey: input.idempotencyKey,
          expiresAt: order.paymentDeadline,
          paidAt: clock,
        },
      });
      await tx.escrowTransaction.create({
        data: {
          orderId,
          paymentId: payment.id,
          amount,
          platformFee,
          status: EscrowStatus.HELD,
        },
      });
    } catch (e) {
      // Dua pembayaran paralel: unik Payment.orderId dipicu sebelum transisi status.
      if (isPrismaErrorCode(e, "P2002")) {
        throw new AppError(409, "ORDER_STATE_CONFLICT", "Order sudah dibayar atau sedang diproses");
      }
      throw e;
    }
    await transition(tx, {
      orderId,
      from: OrderStatus.WAITING_CUSTOMER_PAYMENT,
      to: OrderStatus.PAID_HELD_IN_ESCROW,
      actor: { type: ActorType.SYSTEM, id: userId },
      data: { paidAt: clock },
      extraWhere: { paymentDeadline: { gt: clock } },
    });
    await notifyPaymentReceived(tx, {
      customerId: order.customerId,
      driverUserId: order.driver.userId,
      orderId,
      amount,
    });
    return { kind: "ok" as const };
  });

  if (outcome.kind === "expired") {
    throw new AppError(410, "PAYMENT_DEADLINE_PASSED", "Waktu pembayaran 5 menit telah habis");
  }
  const detail = await fetchOrderDetailOrThrow(orderId);
  return {
    status: detail.status,
    payment: detail.payment,
    escrow: detail.escrow ? { status: detail.escrow.status } : null,
    paymentDeadline: detail.paymentDeadline,
  };
}

// ---------- Reject ----------

export async function rejectOrder(userId: string, orderId: string, input: RejectOrderInput, clock: Date = new Date()) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, OR: [{ customerId: userId }, { driver: { userId } }] },
      include: { driver: { select: { userId: true } } },
    });
    if (!order) {
      throw new AppError(404, "NOT_FOUND", "Order tidak ditemukan");
    }
    const isCustomer = order.customerId === userId;
    const to = isCustomer ? OrderStatus.REJECTED_BY_CUSTOMER : OrderStatus.REJECTED_BY_DRIVER;
    const actorType = isCustomer ? ActorType.CUSTOMER : ActorType.DRIVER;
    assertTransition(order.status, to, actorType);
    await transition(tx, {
      orderId,
      from: order.status,
      to,
      actor: { type: actorType, id: userId },
      data: { closedAt: clock, closeReason: to },
      reason: input.reason,
    });
    await notifyOrderRejected(tx, {
      toUserId: isCustomer ? order.driver.userId : order.customerId,
      by: isCustomer ? "CUSTOMER" : "DRIVER",
      orderId,
      reason: input.reason,
    });
  });
  return fetchOrderDetailOrThrow(orderId);
}

// ---------- Start ----------

export async function startOrder(userId: string, orderId: string, clock: Date = new Date()) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, driver: { userId } },
      select: { customerId: true, status: true },
    });
    if (!order) {
      throw new AppError(404, "NOT_FOUND", "Order tidak ditemukan");
    }
    assertTransition(order.status, OrderStatus.IN_TRANSIT, ActorType.DRIVER);
    await transition(tx, {
      orderId,
      from: order.status,
      to: OrderStatus.IN_TRANSIT,
      actor: { type: ActorType.DRIVER, id: userId },
      data: { startedAt: clock },
    });
    await notifyOrderStarted(tx, order.customerId, orderId);
  });
  return fetchOrderDetailOrThrow(orderId);
}

// ---------- Deliver ----------

export async function deliverOrder(userId: string, orderId: string, input: DeliverOrderInput, clock: Date = new Date()) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, driver: { userId } },
      select: { customerId: true, status: true },
    });
    if (!order) {
      throw new AppError(404, "NOT_FOUND", "Order tidak ditemukan");
    }
    const parsed = parseStorageUrl(input.imageUrl, "proofs", userId);
    assertTransition(order.status, OrderStatus.DELIVERED_PENDING_CONFIRMATION, ActorType.DRIVER);
    await transition(tx, {
      orderId,
      from: order.status,
      to: OrderStatus.DELIVERED_PENDING_CONFIRMATION,
      actor: { type: ActorType.DRIVER, id: userId },
      data: { deliveredAt: clock },
    });
    // imageUrl menyimpan storage key; dibaca kembali sebagai signed URL di GET order detail.
    await tx.deliveryProof.create({
      data: { orderId, imageUrl: parsed.key, note: input.note, deliveredAt: clock },
    });
    await notifyOrderDelivered(tx, order.customerId, orderId);
  });
  return fetchOrderDetailOrThrow(orderId);
}

// ---------- Complete ----------

export async function completeOrder(userId: string, orderId: string, clock: Date = new Date()) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, customerId: userId },
      include: { driver: { select: { userId: true } } },
    });
    if (!order) {
      throw new AppError(404, "NOT_FOUND", "Order tidak ditemukan");
    }

    await transition(tx, {
      orderId,
      from: OrderStatus.DELIVERED_PENDING_CONFIRMATION,
      to: OrderStatus.COMPLETED,
      actor: { type: ActorType.CUSTOMER, id: userId },
      data: { completedAt: clock },
    });

    const held = await tx.escrowTransaction.updateMany({
      where: { orderId, status: EscrowStatus.HELD },
      data: { status: EscrowStatus.RELEASED, releasedAt: clock },
    });
    if (held.count !== 1) {
      throw new AppError(409, "ESCROW_NOT_HELD", "Dana tidak berada dalam status ditahan");
    }

    const escrow = await tx.escrowTransaction.findUniqueOrThrow({ where: { orderId } });
    const payout = escrow.amount - escrow.platformFee;

    const wallet = await tx.wallet.update({
      where: { userId: order.driver.userId },
      data: { balance: { increment: payout } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: WalletTxType.ESCROW_RELEASE,
        amount: payout,
        balanceAfter: wallet.balance,
        orderId,
        escrowId: escrow.id,
      },
    });
    await notifyFundsReleased(tx, order.driver.userId, orderId, payout);
    await notifyOrderCompleted(tx, order.customerId, orderId);
    return {
      status: OrderStatus.COMPLETED,
      escrow: { status: EscrowStatus.RELEASED, releasedAt: escrow.releasedAt },
      driverPayout: payout,
    };
  });
}

// ---------- Dispute ----------

export async function disputeOrder(userId: string, orderId: string, input: DisputeOrderInput) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, OR: [{ customerId: userId }, { driver: { userId } }] },
      include: { driver: { select: { userId: true } } },
    });
    if (!order) {
      throw new AppError(404, "NOT_FOUND", "Order tidak ditemukan");
    }
    const isCustomer = order.customerId === userId;
    const actorType = isCustomer ? ActorType.CUSTOMER : ActorType.DRIVER;
    assertTransition(order.status, OrderStatus.DISPUTED, actorType);
    await transition(tx, {
      orderId,
      from: order.status,
      to: OrderStatus.DISPUTED,
      actor: { type: actorType, id: userId },
      reason: input.reason,
    });
    await notifyOrderDisputed(tx, {
      customerId: order.customerId,
      driverUserId: order.driver.userId,
      orderId,
      reason: input.reason,
    });
  });
  return fetchOrderDetailOrThrow(orderId);
}

// ---------- Webhook gateway ----------

// Dipakai oleh /api/payments/webhook. Idempoten: PAID dua kali tidak mengubah apa pun.
// Webhook PAID yang tiba setelah deadline tidak mengubah order menjadi PAID_HELD_IN_ESCROW:
// order tetap CANCELLED_EXPIRED dan pembayaran ditandai REFUNDED (TDD 5.6).
export async function processPaymentWebhook(
  payload: { gatewayRef: string; status: "PAID" | "FAILED" },
  clock: Date = new Date()
) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { gatewayRef: payload.gatewayRef },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            paymentDeadline: true,
            totalAmount: true,
            platformFee: true,
            customerId: true,
            driver: { select: { userId: true } },
          },
        },
      },
    });
    if (!payment) {
      throw new AppError(404, "NOT_FOUND", "Pembayaran tidak ditemukan");
    }
    if (payment.status === PaymentStatus.REFUNDED || payment.status === PaymentStatus.PAID) {
      return { outcome: "noop" as const };
    }

    if (payload.status === "FAILED") {
      if (payment.status === PaymentStatus.PENDING) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED, rawPayload: payload },
        });
      }
      return { outcome: "failed" as const };
    }

    const order = payment.order;
    const beforeDeadline =
      order.status === OrderStatus.WAITING_CUSTOMER_PAYMENT &&
      order.paymentDeadline !== null &&
      order.paymentDeadline > clock &&
      payment.amount === order.totalAmount &&
      order.platformFee !== null;

    if (beforeDeadline) {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.PAID, paidAt: clock, rawPayload: payload },
      });
      await tx.escrowTransaction.create({
        data: {
          orderId: order.id,
          paymentId: payment.id,
          amount: payment.amount,
          platformFee: order.platformFee ?? 0,
          status: EscrowStatus.HELD,
        },
      });
      await transition(tx, {
        orderId: order.id,
        from: OrderStatus.WAITING_CUSTOMER_PAYMENT,
        to: OrderStatus.PAID_HELD_IN_ESCROW,
        actor: { type: ActorType.SYSTEM },
        data: { paidAt: clock },
        extraWhere: { paymentDeadline: { gt: clock } },
      });
      await notifyPaymentReceived(tx, {
        customerId: order.customerId,
        driverUserId: order.driver.userId,
        orderId: order.id,
        amount: payment.amount,
      });
      return { outcome: "paid" as const };
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.REFUNDED, paidAt: clock, rawPayload: payload },
    });
    console.error(`Webhook pembayaran tiba setelah deadline untuk order ${order.id}: refund dipicu`);
    return { outcome: "refunded" as const };
  });
}

// ---------- Read ----------

export async function getOrderForUser(userId: string, orderId: string) {
  await expireIfNeeded(orderId);
  const order = await prisma.order.findFirst({
    where: { id: orderId, OR: [{ customerId: userId }, { driver: { userId } }] },
    include: DETAIL_INCLUDE,
  });
  if (!order) {
    throw new AppError(404, "NOT_FOUND", "Order tidak ditemukan");
  }
  const signedProofUrl = order.deliveryProof ? await proofUrl(order.deliveryProof.imageUrl) : null;
  return serializeOrder(order, signedProofUrl);
}

// Lazy expiry untuk daftar order milik user (lapis 2 pengaman auto-cancel).
export async function expireOrdersForUser(userId: string): Promise<void> {
  const rows = await prisma.order.findMany({
    where: {
      status: OrderStatus.WAITING_CUSTOMER_PAYMENT,
      paymentDeadline: { lte: new Date() },
      OR: [{ customerId: userId }, { driver: { userId } }],
    },
    select: { id: true },
  });
  for (const row of rows) {
    await expireOrder(row.id);
  }
}

export async function listOrders(
  userId: string,
  query: { role: "customer" | "driver"; status?: OrderStatus; cursor?: string; limit: number }
) {
  await expireOrdersForUser(userId);
  const ownership = query.role === "customer" ? { customerId: userId } : { driver: { userId } };
  let cursorFilter: Prisma.OrderWhereInput | undefined;
  if (query.cursor) {
    const cursor = decodeCursor(query.cursor);
    if (cursor) {
      cursorFilter = {
        OR: [{ createdAt: { lt: new Date(cursor.c) } }, { createdAt: new Date(cursor.c), id: { lt: cursor.id } }],
      };
    }
  }
  const rows = await prisma.order.findMany({
    where: { ...ownership, ...(query.status ? { status: query.status } : {}), ...(cursorFilter ?? {}) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    select: {
      id: true,
      status: true,
      tripId: true,
      openRequestId: true,
      itemSubtotal: true,
      serviceFee: true,
      platformFee: true,
      totalAmount: true,
      pricedAt: true,
      paymentDeadline: true,
      closedAt: true,
      closeReason: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { items: true } },
      customer: { select: { id: true, name: true } },
      driver: { select: { id: true, user: { select: { id: true, name: true } } } },
    },
  });
  const hasMore = rows.length > query.limit;
  const items = hasMore ? rows.slice(0, query.limit) : rows;
  const last = items[items.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor({ c: last.createdAt.toISOString(), id: last.id }) : null;
  return { items, nextCursor };
}
