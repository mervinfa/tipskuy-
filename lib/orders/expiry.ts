import { prisma, TX_OPTIONS } from "@/lib/prisma";
import { AppError } from "@/lib/http";
import { transition } from "./state-machine";
import { notifyExpired } from "@/lib/notifications";
import type { Prisma } from "@prisma/client";

// Idempoten: aman dipanggil berulang. Bila status sudah berubah atau belum waktunya,
// transisi updateMany menghasilkan count 0 dan fungsi mengembalikan false.
export async function expireOrder(orderId: string, clock: Date = new Date()): Promise<boolean> {
  const performExpire = async (tx: Prisma.TransactionClient): Promise<boolean> => {
    try {
      await transition(tx, {
        orderId,
        from: "WAITING_CUSTOMER_PAYMENT",
        to: "CANCELLED_EXPIRED",
        actor: { type: "SYSTEM" },
        data: { closedAt: clock, closeReason: "PAYMENT_TIMEOUT" },
        extraWhere: { paymentDeadline: { lte: clock } },
      });
    } catch (e) {
      if (e instanceof AppError && e.code === "ORDER_STATE_CONFLICT") return false; // sudah dibayar/dibatalkan/belum waktunya
      throw e;
    }
    await tx.payment.updateMany({ where: { orderId, status: "PENDING" }, data: { status: "EXPIRED" } });
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { customerId: true, driver: { select: { userId: true } } },
    });
    if (order) {
      await notifyExpired(tx, {
        customerId: order.customerId,
        driverUserId: order.driver.userId,
        orderId,
      });
    }
    return true;
  };

  try {
    return await prisma.$transaction(performExpire, TX_OPTIONS);
  } catch (err: any) {
    if (
      err?.code === "P2028" ||
      (typeof err?.message === "string" && err.message.includes("Transaction API error"))
    ) {
      console.warn("Prisma P2028 in expireOrder, falling back to direct execution");
      return await performExpire(prisma);
    }
    throw err;
  }
}

export async function expireIfNeeded(orderId: string): Promise<boolean> {
  return expireOrder(orderId); // aman dipanggil berulang: no-op bila tidak perlu
}

export async function sweepExpiredOrders(limit = 200): Promise<number> {
  const rows = await prisma.order.findMany({
    where: { status: "WAITING_CUSTOMER_PAYMENT", paymentDeadline: { lte: new Date() } },
    select: { id: true },
    take: limit,
  });
  let expired = 0;
  for (const r of rows) if (await expireOrder(r.id)) expired++;
  return expired;
}
