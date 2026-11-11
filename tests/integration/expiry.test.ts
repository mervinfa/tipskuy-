import { afterEach, describe, expect, it, vi } from "vitest";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { expireOrder, sweepExpiredOrders } from "@/lib/orders/expiry";
import {
  expireOrdersForUser,
  getOrderForUser,
  listOrders,
  payOrder,
  processPaymentWebhook,
} from "@/lib/orders/service";
import { orderStatus } from "./helpers";
import { createPricedOrder, expectAppError, payPricedOrder } from "./helpers";

// I-09 sampai I-11 dan E-17: empat lapis pengaman auto-cancel dan webhook gateway.
const LAMBAT_MS = 400_000; // pricedAt lebih tua dari jendela pembayaran 5 menit

async function totalAmountOrder(orderId: string): Promise<number> {
  const row = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { totalAmount: true },
  });
  if (row.totalAmount === null) {
    throw new Error("Fixture order tidak memiliki totalAmount");
  }
  return row.totalAmount;
}

async function insertPendingPayment(orderId: string, amount: number, expiresAt: Date) {
  const payment = await prisma.payment.create({
    data: {
      orderId,
      method: "QRIS",
      status: "PENDING",
      amount,
      gatewayRef: `gw-${crypto.randomUUID()}`,
      idempotencyKey: crypto.randomUUID(),
      expiresAt,
    },
  });
  if (!payment.gatewayRef) {
    throw new Error("Fixture payment tidak memiliki gatewayRef");
  }
  return { id: payment.id, gatewayRef: payment.gatewayRef };
}

let konsolErrorSpy: ReturnType<typeof vi.spyOn> | null = null;

afterEach(() => {
  if (konsolErrorSpy) {
    konsolErrorSpy.mockRestore();
    konsolErrorSpy = null;
  }
});

describe("Auto-cancel order", () => {
  it("I-09 sweep hanya membatalkan order WCP yang melewati deadline", async () => {
    // Database tidak di-reset antar berkas uji; hitung order hangus yang sudah
    // ada dari berkas lain agar jumlah sweep tetap dapat dipastikan.
    const batasAwal = await prisma.order.count({
      where: { status: OrderStatus.WAITING_CUSTOMER_PAYMENT, paymentDeadline: { lte: new Date() } },
    });
    const hangus = await createPricedOrder({ pricedAt: new Date(Date.now() - LAMBAT_MS) });
    const aktif = await createPricedOrder();
    const dibayar = await createPricedOrder({ pricedAt: new Date(Date.now() - LAMBAT_MS) });
    await payPricedOrder(dibayar);

    const jumlah = await sweepExpiredOrders();
    expect(jumlah).toBe(batasAwal + 1);
    expect(await orderStatus(hangus.orderId)).toBe(OrderStatus.CANCELLED_EXPIRED);
    expect(await orderStatus(aktif.orderId)).toBe(OrderStatus.WAITING_CUSTOMER_PAYMENT);
    expect(await orderStatus(dibayar.orderId)).toBe(OrderStatus.PAID_HELD_IN_ESCROW);
  });

  it("I-10 expireOrder dua kali aman dan notifikasi hanya sekali", async () => {
    const fixture = await createPricedOrder({ pricedAt: new Date(Date.now() - LAMBAT_MS) });
    expect(await expireOrder(fixture.orderId)).toBe(true);
    expect(await orderStatus(fixture.orderId)).toBe(OrderStatus.CANCELLED_EXPIRED);
    expect(await expireOrder(fixture.orderId)).toBe(false);

    // Notifikasi tepat satu putaran: satu untuk customer dan satu untuk driver.
    expect(
      await prisma.notification.count({
        where: { orderId: fixture.orderId, type: "ORDER_EXPIRED" },
      })
    ).toBe(2);
  });

  it("I-11 lazy expiry lewat getOrderForUser", async () => {
    const fixture = await createPricedOrder({ pricedAt: new Date(Date.now() - LAMBAT_MS) });
    const order = await getOrderForUser(fixture.customer.id, fixture.orderId);
    expect(order.status).toBe(OrderStatus.CANCELLED_EXPIRED);
  });

  it("I-11 lazy expiry lewat listOrders", async () => {
    const fixture = await createPricedOrder({ pricedAt: new Date(Date.now() - LAMBAT_MS) });
    const hasil = await listOrders(fixture.customer.id, { role: "customer", limit: 10 });
    const item = hasil.items.find((row) => row.id === fixture.orderId);
    expect(item?.status).toBe(OrderStatus.CANCELLED_EXPIRED);
  });

  it("I-11 lazy expiry lewat expireOrdersForUser", async () => {
    const fixture = await createPricedOrder({ pricedAt: new Date(Date.now() - LAMBAT_MS) });
    await expireOrdersForUser(fixture.customer.id);
    expect(await orderStatus(fixture.orderId)).toBe(OrderStatus.CANCELLED_EXPIRED);
  });

  it("E-17 webhook PAID setelah order hangus memicu refund, order tetap CANCELLED_EXPIRED", async () => {
    const fixture = await createPricedOrder({ pricedAt: new Date(Date.now() - LAMBAT_MS) });
    const amount = await totalAmountOrder(fixture.orderId);
    const payment = await insertPendingPayment(fixture.orderId, amount, fixture.deadline);
    await expireOrder(fixture.orderId);

    konsolErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const hasil = await processPaymentWebhook({ gatewayRef: payment.gatewayRef, status: "PAID" });
    expect(hasil.outcome).toBe("refunded");

    const row = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(row.status).toBe(PaymentStatus.REFUNDED);
    expect(await orderStatus(fixture.orderId)).toBe(OrderStatus.CANCELLED_EXPIRED);
    expect(await prisma.escrowTransaction.count({ where: { orderId: fixture.orderId } })).toBe(0);
    expect(konsolErrorSpy).toHaveBeenCalledTimes(1);
  });

  it("webhook PAID sebelum deadline membayar order dan idempoten", async () => {
    const fixture = await createPricedOrder();
    const amount = await totalAmountOrder(fixture.orderId);
    const payment = await insertPendingPayment(fixture.orderId, amount, fixture.deadline);

    const hasil = await processPaymentWebhook({ gatewayRef: payment.gatewayRef, status: "PAID" });
    expect(hasil.outcome).toBe("paid");
    expect(await orderStatus(fixture.orderId)).toBe(OrderStatus.PAID_HELD_IN_ESCROW);
    const escrow = await prisma.escrowTransaction.findUniqueOrThrow({
      where: { orderId: fixture.orderId },
    });
    expect(escrow.status).toBe("HELD");
    expect(escrow.amount).toBe(amount);

    const ulang = await processPaymentWebhook({ gatewayRef: payment.gatewayRef, status: "PAID" });
    expect(ulang.outcome).toBe("noop");
    expect(await prisma.escrowTransaction.count({ where: { orderId: fixture.orderId } })).toBe(1);
    expect(await orderStatus(fixture.orderId)).toBe(OrderStatus.PAID_HELD_IN_ESCROW);
  });

  it("webhook FAILED menandai payment gagal tanpa mengubah order", async () => {
    const fixture = await createPricedOrder();
    const amount = await totalAmountOrder(fixture.orderId);
    const payment = await insertPendingPayment(fixture.orderId, amount, fixture.deadline);

    const hasil = await processPaymentWebhook({ gatewayRef: payment.gatewayRef, status: "FAILED" });
    expect(hasil.outcome).toBe("failed");
    const row = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(row.status).toBe(PaymentStatus.FAILED);
    expect(await orderStatus(fixture.orderId)).toBe(OrderStatus.WAITING_CUSTOMER_PAYMENT);
  });

  it("webhook FAILED pada payment yang sudah EXPIRED tidak mengubah apa pun", async () => {
    const fixture = await createPricedOrder({ pricedAt: new Date(Date.now() - LAMBAT_MS) });
    const amount = await totalAmountOrder(fixture.orderId);
    const payment = await insertPendingPayment(fixture.orderId, amount, fixture.deadline);
    await expireOrder(fixture.orderId);

    const hasil = await processPaymentWebhook({ gatewayRef: payment.gatewayRef, status: "FAILED" });
    expect(hasil.outcome).toBe("failed");
    const row = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(row.status).toBe(PaymentStatus.EXPIRED);
    expect(await orderStatus(fixture.orderId)).toBe(OrderStatus.CANCELLED_EXPIRED);
  });

  it("webhook dengan gatewayRef tak dikenal ditolak 404", async () => {
    await expectAppError(
      processPaymentWebhook({ gatewayRef: "gw-tak-ada", status: "PAID" }),
      404,
      "NOT_FOUND"
    );
  });

  it("payOrder pada order hangus menolak tanpa membuat Payment", async () => {
    const fixture = await createPricedOrder({ pricedAt: new Date(Date.now() - LAMBAT_MS) });
    await expireOrder(fixture.orderId);
    await expectAppError(
      payOrder(fixture.customer.id, fixture.orderId, {
        method: "QRIS",
        idempotencyKey: crypto.randomUUID(),
      }),
      409,
      "ORDER_STATE_CONFLICT"
    );
    expect(await prisma.payment.count({ where: { orderId: fixture.orderId } })).toBe(0);
    expect(await orderStatus(fixture.orderId)).toBe(OrderStatus.CANCELLED_EXPIRED);
  });
});
