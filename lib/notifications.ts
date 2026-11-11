import type { Prisma, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError, decodeCursor, encodeCursor } from "@/lib/http";
import { formatRupiah } from "@/lib/format";

type Tx = Prisma.TransactionClient;

export type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  orderId?: string;
};

export async function notify(tx: Tx, input: NotifyInput): Promise<void> {
  await tx.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      orderId: input.orderId,
    },
  });
}

function deadlineText(deadline: Date): string {
  return deadline.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}

export async function notifyOrderRequested(tx: Tx, driverUserId: string, orderId: string) {
  await notify(tx, {
    userId: driverUserId,
    type: "ORDER_REQUESTED",
    title: "Permintaan titipan baru",
    body: "Ada permintaan titipan baru yang menunggu penawaran harga Anda.",
    orderId,
  });
}

export async function notifyPriceSet(tx: Tx, customerUserId: string, orderId: string, totalAmount: number, paymentDeadline: Date) {
  await notify(tx, {
    userId: customerUserId,
    type: "PRICE_SET",
    title: "Harga sudah ditentukan",
    body: `Total ${formatRupiah(totalAmount)}. Bayar sebelum ${deadlineText(paymentDeadline)} WIB.`,
    orderId,
  });
}

export async function notifyPaymentReceived(tx: Tx, input: { customerId: string; driverUserId: string; orderId: string; amount: number }) {
  await notify(tx, {
    userId: input.customerId,
    type: "PAYMENT_RECEIVED",
    title: "Pembayaran diterima",
    body: `Pembayaran ${formatRupiah(input.amount)} sudah kami terima dan dana ditahan sampai pesanan selesai.`,
    orderId: input.orderId,
  });
  await notify(tx, {
    userId: input.driverUserId,
    type: "PAYMENT_RECEIVED",
    title: "Pesanan sudah dibayar",
    body: `Customer sudah membayar ${formatRupiah(input.amount)}. Anda bisa mulai perjalanan.`,
    orderId: input.orderId,
  });
}

export async function notifyExpired(tx: Tx, input: { customerId: string; driverUserId: string; orderId: string }) {
  const body = "Batas waktu pembayaran 5 menit sudah terlampaui. Pesanan dibatalkan otomatis.";
  await notify(tx, { userId: input.customerId, type: "ORDER_EXPIRED", title: "Pesanan hangus", body, orderId: input.orderId });
  await notify(tx, { userId: input.driverUserId, type: "ORDER_EXPIRED", title: "Pesanan hangus", body, orderId: input.orderId });
}

export async function notifyOrderRejected(tx: Tx, input: { toUserId: string; by: "CUSTOMER" | "DRIVER"; orderId: string; reason?: string }) {
  const byText = input.by === "CUSTOMER" ? "customer" : "driver";
  await notify(tx, {
    userId: input.toUserId,
    type: "ORDER_REJECTED",
    title: "Pesanan ditolak",
    body: `Pesanan ditolak oleh ${byText}${input.reason ? ` dengan alasan: ${input.reason}` : ""}.`,
    orderId: input.orderId,
  });
}

export async function notifyOrderStarted(tx: Tx, customerUserId: string, orderId: string) {
  await notify(tx, {
    userId: customerUserId,
    type: "ORDER_STARTED",
    title: "Perjalanan dimulai",
    body: "Driver sudah mulai perjalanan mengantar barang Anda.",
    orderId,
  });
}

export async function notifyOrderDelivered(tx: Tx, customerUserId: string, orderId: string) {
  await notify(tx, {
    userId: customerUserId,
    type: "ORDER_DELIVERED",
    title: "Barang sudah diserahkan",
    body: "Driver sudah menyerahkan barang. Silakan konfirmasi jika pesanan selesai.",
    orderId,
  });
}

export async function notifyOrderCompleted(tx: Tx, customerUserId: string, orderId: string) {
  await notify(tx, {
    userId: customerUserId,
    type: "ORDER_COMPLETED",
    title: "Pesanan selesai",
    body: "Terima kasih sudah menggunakan Tipskuy.",
    orderId,
  });
}

export async function notifyFundsReleased(tx: Tx, driverUserId: string, orderId: string, payout: number) {
  await notify(tx, {
    userId: driverUserId,
    type: "FUNDS_RELEASED",
    title: "Dana masuk ke dompet",
    body: `Dana pesanan ${formatRupiah(payout)} sudah dirilis ke dompet Anda.`,
    orderId,
  });
}

export async function notifyOrderDisputed(tx: Tx, input: { customerId: string; driverUserId: string; orderId: string; reason: string }) {
  const body = `Pesanan dalam sengketa: ${input.reason}. Dana tetap ditahan sampai sengketa selesai.`;
  await notify(tx, { userId: input.customerId, type: "ORDER_DISPUTED", title: "Pesanan disengketakan", body, orderId: input.orderId });
  await notify(tx, { userId: input.driverUserId, type: "ORDER_DISPUTED", title: "Pesanan disengketakan", body, orderId: input.orderId });
}

export async function notifyOpenRequestClaimed(tx: Tx, customerUserId: string, orderId: string) {
  await notify(tx, {
    userId: customerUserId,
    type: "OPEN_REQUEST_CLAIMED",
    title: "Postingan terbuka diklaim",
    body: "Driver sudah mengklaim postingan terbuka Anda dan akan memberi penawaran harga.",
    orderId,
  });
}

// ---------- Baca notifikasi ----------

export async function listNotifications(
  userId: string,
  query: { unread?: boolean; limit: number; cursor?: string }
) {
  let cursorFilter: Prisma.NotificationWhereInput | undefined;
  if (query.cursor) {
    const cursor = decodeCursor(query.cursor);
    if (cursor) {
      cursorFilter = {
        OR: [{ createdAt: { lt: new Date(cursor.c) } }, { createdAt: new Date(cursor.c), id: { lt: cursor.id } }],
      };
    }
  }
  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(query.unread === undefined ? {} : { readAt: query.unread ? null : { not: null } }),
    ...(cursorFilter ?? {}),
  };
  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  const hasMore = rows.length > query.limit;
  const items = hasMore ? rows.slice(0, query.limit) : rows;
  const last = items[items.length - 1];
  const nextCursor = hasMore && last ? encodeCursor({ c: last.createdAt.toISOString(), id: last.id }) : null;
  return { items, unreadCount, nextCursor };
}

export async function markNotificationRead(userId: string, notificationId: string, clock: Date = new Date()) {
  // Idempoten: notifikasi yang sudah terbaca tidak boleh mengubah readAt lagi.
  const updated = await prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: clock },
  });
  if (updated.count === 1) {
    return { id: notificationId, readAt: clock };
  }
  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true, readAt: true },
  });
  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Notifikasi tidak ditemukan");
  }
  return { id: existing.id, readAt: existing.readAt };
}

export async function markAllNotificationsRead(userId: string, clock: Date = new Date()) {
  const updated = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: clock },
  });
  return { updatedCount: updated.count };
}
