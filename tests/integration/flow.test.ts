import { describe, expect, it } from "vitest";
import { OrderStatus, WalletTxType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/http";
import {
  completeOrder,
  createOrder,
  deliverOrder,
  disputeOrder,
  getOrderForUser,
  payOrder,
  setPrice,
  startOrder,
} from "@/lib/orders/service";
import { orderStatus } from "./helpers";
import {
  createPricedOrder,
  createUnpricedOrder,
  createUser,
  driverBalance,
  expectAppError,
  itemImageUrl,
  payPricedOrder,
  proofImageUrl,
} from "./helpers";

// Harga fixture: barang 55.000 + jasa 25.000, fee platform 500 bps dari jasa.
// platformFee = floor(25.000 * 500 / 10.000) = 1.250; total = 81.250; payout = 80.000.
const PLATFORM_FEE = 1_250;
const TOTAL_AMOUNT = 81_250;
const DRIVER_PAYOUT = 80_000;

const TRANSISI_PENUH = [
  "DRAFT->WAITING_DRIVER_PRICING",
  "WAITING_DRIVER_PRICING->WAITING_CUSTOMER_PAYMENT",
  "WAITING_CUSTOMER_PAYMENT->PAID_HELD_IN_ESCROW",
  "PAID_HELD_IN_ESCROW->IN_TRANSIT",
  "IN_TRANSIT->DELIVERED_PENDING_CONFIRMATION",
  "DELIVERED_PENDING_CONFIRMATION->COMPLETED",
];

async function createDeliveredOrder(opts: { pricedAt?: Date } = {}) {
  const fixture = await createPricedOrder(opts);
  await payPricedOrder(fixture);
  await startOrder(fixture.driver.id, fixture.orderId);
  await deliverOrder(fixture.driver.id, fixture.orderId, {
    imageUrl: proofImageUrl(fixture.driver.id),
  });
  return fixture;
}

function alasanAppError(hasil: PromiseSettledResult<unknown>[]): AppError {
  const gagal = hasil.filter((r) => r.status === "rejected");
  const reason = gagal[0]?.reason;
  expect(reason).toBeInstanceOf(AppError);
  return reason as AppError;
}

describe("Alur order", () => {
  it("I-01 alur penuh sampai COMPLETED dengan escrow rilis ke dompet driver", async () => {
    const fixture = await createPricedOrder();
    expect(fixture.itemPrices).toEqual([55_000]);

    const priced = await getOrderForUser(fixture.customer.id, fixture.orderId);
    expect(priced.status).toBe(OrderStatus.WAITING_CUSTOMER_PAYMENT);
    expect(priced.itemSubtotal).toBe(55_000);
    expect(priced.serviceFee).toBe(25_000);
    expect(priced.platformFee).toBe(PLATFORM_FEE);
    expect(priced.totalAmount).toBe(TOTAL_AMOUNT);

    const dibayar = await payPricedOrder(fixture);
    expect(dibayar.status).toBe(OrderStatus.PAID_HELD_IN_ESCROW);
    expect(dibayar.payment?.status).toBe("PAID");
    expect(dibayar.payment?.amount).toBe(TOTAL_AMOUNT);
    expect(dibayar.escrow?.status).toBe("HELD");

    await startOrder(fixture.driver.id, fixture.orderId);
    const dikirim = await deliverOrder(fixture.driver.id, fixture.orderId, {
      imageUrl: proofImageUrl(fixture.driver.id),
    });
    expect(dikirim.status).toBe(OrderStatus.DELIVERED_PENDING_CONFIRMATION);
    expect(dikirim.deliveryProof).not.toBeNull();

    const selesai = await completeOrder(fixture.customer.id, fixture.orderId);
    expect(selesai.status).toBe(OrderStatus.COMPLETED);
    expect(selesai.driverPayout).toBe(DRIVER_PAYOUT);
    expect(selesai.escrow?.status).toBe("RELEASED");

    expect(await driverBalance(fixture.driver.id)).toBe(DRIVER_PAYOUT);

    const wallet = await prisma.wallet.findUniqueOrThrow({
      where: { userId: fixture.driver.id },
    });
    const txs = await prisma.walletTransaction.findMany({ where: { walletId: wallet.id } });
    expect(txs).toHaveLength(1);
    expect(txs[0]?.type).toBe(WalletTxType.ESCROW_RELEASE);
    expect(txs[0]?.amount).toBe(DRIVER_PAYOUT);
    expect(txs[0]?.balanceAfter).toBe(DRIVER_PAYOUT);
    expect(txs[0]?.orderId).toBe(fixture.orderId);

    const logs = await prisma.orderStatusLog.findMany({
      where: { orderId: fixture.orderId },
    });
    const transisi = logs.map((log) => `${log.fromStatus ?? "NULL"}->${log.toStatus}`).sort();
    expect(transisi).toEqual([...TRANSISI_PENUH].sort());
    expect(logs).toHaveLength(6);
  });

  it("I-02 paymentDeadline tepat pricedAt + 300 detik", async () => {
    const pricedAt = new Date("2026-11-01T08:00:00.000Z");
    const fixture = await createPricedOrder({ pricedAt });
    expect(fixture.deadline.getTime() - pricedAt.getTime()).toBe(300_000);
  });

  it("I-05 complete kedua kali berurutan ditolak dan saldo hanya naik sekali", async () => {
    const fixture = await createDeliveredOrder();
    await completeOrder(fixture.customer.id, fixture.orderId);
    await expectAppError(completeOrder(fixture.customer.id, fixture.orderId), 409, "ORDER_STATE_CONFLICT");
    expect(await driverBalance(fixture.driver.id)).toBe(DRIVER_PAYOUT);
  });

  it("I-06 complete paralel: tepat satu sukses dan saldo naik sekali", async () => {
    const fixture = await createDeliveredOrder();
    const hasil = await Promise.allSettled([
      completeOrder(fixture.customer.id, fixture.orderId),
      completeOrder(fixture.customer.id, fixture.orderId),
    ]);
    expect(hasil.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(alasanAppError(hasil).code).toBe("ORDER_STATE_CONFLICT");
    expect(await driverBalance(fixture.driver.id)).toBe(DRIVER_PAYOUT);
    const wallet = await prisma.wallet.findUniqueOrThrow({
      where: { userId: fixture.driver.id },
    });
    expect(await prisma.walletTransaction.count({ where: { walletId: wallet.id } })).toBe(1);
  });

  it("I-07 pay paralel dengan idempotencyKey berbeda: satu Payment dan satu Escrow", async () => {
    const fixture = await createPricedOrder();
    const input = () => ({
      method: "QRIS" as const,
      idempotencyKey: crypto.randomUUID(),
    });
    const hasil = await Promise.allSettled([
      payOrder(fixture.customer.id, fixture.orderId, input()),
      payOrder(fixture.customer.id, fixture.orderId, input()),
    ]);
    expect(hasil.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(alasanAppError(hasil).code).toBe("ORDER_STATE_CONFLICT");
    expect(await prisma.payment.count({ where: { orderId: fixture.orderId } })).toBe(1);
    expect(await prisma.escrowTransaction.count({ where: { orderId: fixture.orderId } })).toBe(1);
  });

  it("I-08 pay ulang dengan idempotencyKey sama memberi respons identik", async () => {
    const fixture = await createPricedOrder();
    const input = { method: "QRIS" as const, idempotencyKey: crypto.randomUUID() };
    const pertama = await payOrder(fixture.customer.id, fixture.orderId, input);
    const kedua = await payOrder(fixture.customer.id, fixture.orderId, input);
    expect(kedua).toEqual(pertama);
    expect(await prisma.payment.count({ where: { orderId: fixture.orderId } })).toBe(1);
  });

  it("E-01 bayar pada deadline - 1 ms diterima", async () => {
    const fixture = await createPricedOrder();
    const hasil = await payOrder(
      fixture.customer.id,
      fixture.orderId,
      { method: "QRIS", idempotencyKey: crypto.randomUUID() },
      new Date(fixture.deadline.getTime() - 1)
    );
    expect(hasil.status).toBe(OrderStatus.PAID_HELD_IN_ESCROW);
  });

  it("E-02 bayar tepat pada deadline ditolak 410", async () => {
    const fixture = await createPricedOrder();
    await expectAppError(
      payOrder(
        fixture.customer.id,
        fixture.orderId,
        { method: "QRIS", idempotencyKey: crypto.randomUUID() },
        fixture.deadline
      ),
      410,
      "PAYMENT_DEADLINE_PASSED"
    );
    expect(await orderStatus(fixture.orderId)).toBe(OrderStatus.CANCELLED_EXPIRED);
    expect(await prisma.payment.count({ where: { orderId: fixture.orderId } })).toBe(0);
  });

  it("E-03 bayar pada detik ke-301 ditolak 410 dan order hangus", async () => {
    const fixture = await createPricedOrder();
    await expectAppError(
      payOrder(
        fixture.customer.id,
        fixture.orderId,
        { method: "QRIS", idempotencyKey: crypto.randomUUID() },
        new Date(fixture.pricedAt.getTime() + 301_000)
      ),
      410,
      "PAYMENT_DEADLINE_PASSED"
    );
    expect(await orderStatus(fixture.orderId)).toBe(OrderStatus.CANCELLED_EXPIRED);
    expect(await prisma.payment.count({ where: { orderId: fixture.orderId } })).toBe(0);
    const notif = await prisma.notification.count({
      where: { orderId: fixture.orderId, type: "ORDER_EXPIRED" },
    });
    expect(notif).toBe(2);
  });

  it("E-04 driver tidak bisa menyelesaikan order dan escrow tetap HELD", async () => {
    const fixture = await createPricedOrder();
    await payPricedOrder(fixture);
    await expectAppError(completeOrder(fixture.driver.id, fixture.orderId), 404, "NOT_FOUND");
    const escrow = await prisma.escrowTransaction.findUniqueOrThrow({
      where: { orderId: fixture.orderId },
    });
    expect(escrow.status).toBe("HELD");
    expect(await driverBalance(fixture.driver.id)).toBe(0);
  });

  it("E-06 customer lain tidak bisa membaca atau membayar order", async () => {
    const fixture = await createPricedOrder();
    const customerLain = await createUser("CUSTOMER");
    await expectAppError(getOrderForUser(customerLain.id, fixture.orderId), 404, "NOT_FOUND");
    await expectAppError(
      payOrder(customerLain.id, fixture.orderId, {
        method: "QRIS",
        idempotencyKey: crypto.randomUUID(),
      }),
      404,
      "NOT_FOUND"
    );
    expect(await orderStatus(fixture.orderId)).toBe(OrderStatus.WAITING_CUSTOMER_PAYMENT);
  });

  it("E-07 driver lain tidak bisa menetapkan harga", async () => {
    const fixture = await createUnpricedOrder();
    const driverLain = await createUser("DRIVER");
    await expectAppError(
      setPrice(driverLain.id, fixture.orderId, {
        items: fixture.itemIds.map((id) => ({ id, finalPrice: 50_000 })),
        serviceFee: 25_000,
      }),
      404,
      "NOT_FOUND"
    );
    expect(await orderStatus(fixture.orderId)).toBe(OrderStatus.WAITING_DRIVER_PRICING);
  });

  it("E-14 deliver sebelum start ditolak INVALID_TRANSITION", async () => {
    const fixture = await createPricedOrder();
    await payPricedOrder(fixture);
    await expectAppError(
      deliverOrder(fixture.driver.id, fixture.orderId, { imageUrl: proofImageUrl(fixture.driver.id) }),
      409,
      "INVALID_TRANSITION"
    );
    expect(await orderStatus(fixture.orderId)).toBe(OrderStatus.PAID_HELD_IN_ESCROW);
  });

  it("idempotencyKey yang dipakai untuk order lain ditolak", async () => {
    const orderA = await createPricedOrder();
    const orderB = await createPricedOrder();
    const key = crypto.randomUUID();
    await payOrder(orderA.customer.id, orderA.orderId, { method: "QRIS", idempotencyKey: key });
    await expectAppError(
      payOrder(orderB.customer.id, orderB.orderId, { method: "QRIS", idempotencyKey: key }),
      409,
      "IDEMPOTENCY_KEY_REUSE"
    );
    expect(await orderStatus(orderB.orderId)).toBe(OrderStatus.WAITING_CUSTOMER_PAYMENT);
  });

  it("pay setelah order selesai ditolak", async () => {
    const fixture = await createDeliveredOrder();
    await completeOrder(fixture.customer.id, fixture.orderId);
    await expectAppError(
      payOrder(fixture.customer.id, fixture.orderId, {
        method: "QRIS",
        idempotencyKey: crypto.randomUUID(),
      }),
      409,
      "ORDER_STATE_CONFLICT"
    );
  });

  it("set-price dengan daftar item tidak sesuai ditolak", async () => {
    const fixture = await createUnpricedOrder();
    await expectAppError(
      setPrice(fixture.driver.id, fixture.orderId, {
        items: [{ id: "id-item-tidak-ada", finalPrice: 50_000 }],
        serviceFee: 25_000,
      }),
      422,
      "VALIDATION_ERROR"
    );
    expect(await orderStatus(fixture.orderId)).toBe(OrderStatus.WAITING_DRIVER_PRICING);
  });

  it("create order dengan trip tidak dikenal ditolak", async () => {
    const customer = await createUser("CUSTOMER");
    await expectAppError(
      createOrder(customer.id, {
        tripId: "id-trip-tak-ada",
        items: [{ name: "Barang", imageUrl: itemImageUrl(customer.id), quantity: 1 }],
      }),
      404,
      "NOT_FOUND"
    );
  });

  it("create order menolak imageUrl dari host lain", async () => {
    const fixture = await createUnpricedOrder();
    const customer = await createUser("CUSTOMER");
    await expectAppError(
      createOrder(customer.id, {
        tripId: fixture.tripId,
        items: [
          {
            name: "Barang",
            imageUrl: `https://host-lain.example.com/uploads/order-items/${customer.id}/2026/11/barang.webp`,
            quantity: 1,
          },
        ],
      }),
      422,
      "INVALID_IMAGE_URL"
    );
  });

  it("create order menolak imageUrl milik pengguna lain", async () => {
    const fixture = await createUnpricedOrder();
    const customer = await createUser("CUSTOMER");
    await expectAppError(
      createOrder(customer.id, {
        tripId: fixture.tripId,
        items: [
          {
            name: "Barang",
            imageUrl: itemImageUrl(fixture.customer.id, "milik-orang-lain.webp"),
            quantity: 1,
          },
        ],
      }),
      422,
      "INVALID_IMAGE_OWNER"
    );
  });

  it("create order menolak imageUrl dari bucket yang salah", async () => {
    const fixture = await createUnpricedOrder();
    const customer = await createUser("CUSTOMER");
    await expectAppError(
      createOrder(customer.id, {
        tripId: fixture.tripId,
        items: [
          {
            name: "Barang",
            imageUrl: proofImageUrl(customer.id, "bucket-salah.webp"),
            quantity: 1,
          },
        ],
      }),
      422,
      "INVALID_IMAGE_BUCKET"
    );
  });

  it("customer dapat membuka sengketa setelah pembayaran", async () => {
    const fixture = await createPricedOrder();
    await payPricedOrder(fixture);
    const order = await disputeOrder(fixture.customer.id, fixture.orderId, {
      reason: "Barang tidak sesuai pesanan",
    });
    expect(order.status).toBe(OrderStatus.DISPUTED);
    const notif = await prisma.notification.count({
      where: { orderId: fixture.orderId, type: "ORDER_DISPUTED" },
    });
    expect(notif).toBe(2);
  });

  it("driver dapat membuka sengketa saat barang dalam perjalanan", async () => {
    const fixture = await createPricedOrder();
    await payPricedOrder(fixture);
    await startOrder(fixture.driver.id, fixture.orderId);
    const order = await disputeOrder(fixture.driver.id, fixture.orderId, {
      reason: "Customer tidak bisa dihubungi",
    });
    expect(order.status).toBe(OrderStatus.DISPUTED);
  });

  it("driver tidak bisa membuka sengketa setelah barang diserahkan", async () => {
    const fixture = await createDeliveredOrder();
    await expectAppError(
      disputeOrder(fixture.driver.id, fixture.orderId, { reason: "Barang sudah diterima penerima" }),
      409,
      "INVALID_TRANSITION"
    );
  });
});
