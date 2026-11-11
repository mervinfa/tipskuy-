import { describe, expect, it } from "vitest";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rejectOrder, setPrice } from "@/lib/orders/service";
import { orderStatus } from "./helpers";
import {
  createPricedOrder,
  createUnpricedOrder,
  expectAppError,
} from "./helpers";

// I-03, I-04, E-13, E-15: penolakan order dan pengaman set-price.
describe("Penolakan order", () => {
  it("I-03 customer menolak setelah harga ditetapkan", async () => {
    const fixture = await createPricedOrder();
    const order = await rejectOrder(fixture.customer.id, fixture.orderId, {
      reason: "Harga terlalu mahal",
    });
    expect(order.status).toBe(OrderStatus.REJECTED_BY_CUSTOMER);
    expect(order.closeReason).toBe("REJECTED_BY_CUSTOMER");
    expect(order.closedAt).not.toBeNull();
    expect(await prisma.payment.count({ where: { orderId: fixture.orderId } })).toBe(0);

    const notif = await prisma.notification.findFirst({
      where: { userId: fixture.driver.id, orderId: fixture.orderId, type: "ORDER_REJECTED" },
    });
    expect(notif).not.toBeNull();
  });

  it("I-04 driver menolak sebelum memberi harga", async () => {
    const fixture = await createUnpricedOrder();
    const order = await rejectOrder(fixture.driver.id, fixture.orderId, {
      reason: "Jadwal perjalanan bentrok",
    });
    expect(order.status).toBe(OrderStatus.REJECTED_BY_DRIVER);
    expect(order.closeReason).toBe("REJECTED_BY_DRIVER");

    const notif = await prisma.notification.findFirst({
      where: { userId: fixture.customer.id, orderId: fixture.orderId, type: "ORDER_REJECTED" },
    });
    expect(notif).not.toBeNull();
  });

  it("E-13 set-price di bawah tarif minimum trip ditolak", async () => {
    const fixture = await createUnpricedOrder({ baseFee: 20_000 });
    await expectAppError(
      setPrice(fixture.driver.id, fixture.orderId, {
        items: fixture.itemIds.map((id) => ({ id, finalPrice: 50_000 })),
        serviceFee: 19_999,
      }),
      422,
      "FEE_BELOW_BASE"
    );
    expect(await orderStatus(fixture.orderId)).toBe(OrderStatus.WAITING_DRIVER_PRICING);
  });

  it("set-price dengan ongkos sama dengan tarif minimum diizinkan", async () => {
    const fixture = await createUnpricedOrder({ baseFee: 20_000 });
    const priced = await setPrice(fixture.driver.id, fixture.orderId, {
      items: fixture.itemIds.map((id) => ({ id, finalPrice: 50_000 })),
      serviceFee: 20_000,
    });
    expect(priced.status).toBe(OrderStatus.WAITING_CUSTOMER_PAYMENT);
  });

  it("E-15 set-price kedua ditolak dan deadline tidak berubah", async () => {
    const fixture = await createUnpricedOrder();
    const pertama = await setPrice(fixture.driver.id, fixture.orderId, {
      items: fixture.itemIds.map((id) => ({ id, finalPrice: 50_000 })),
      serviceFee: 25_000,
    });
    const deadlinePertama = pertama.paymentDeadline;

    await expectAppError(
      setPrice(fixture.driver.id, fixture.orderId, {
        items: fixture.itemIds.map((id) => ({ id, finalPrice: 60_000 })),
        serviceFee: 30_000,
      }),
      409,
      "INVALID_TRANSITION"
    );

    const order = await prisma.order.findUniqueOrThrow({ where: { id: fixture.orderId } });
    expect(order.paymentDeadline?.getTime()).toBe(deadlinePertama?.getTime());
    expect(order.serviceFee).toBe(25_000);
    expect(order.totalAmount).toBe(pertama.totalAmount);
  });
});
