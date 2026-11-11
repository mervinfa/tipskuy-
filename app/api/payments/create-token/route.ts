import { z } from "zod";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiHandler, AppError, ok, parseJsonBody } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { createMidtransSnapTransaction, MidtransItemDetail } from "@/lib/payments/midtrans";

const createTokenSchema = z.strictObject({
  orderId: z.string().min(1, "orderId wajib diisi"),
});

export const POST = apiHandler(async (req) => {
  const user = await requireRole("CUSTOMER");
  const { orderId } = createTokenSchema.parse(await parseJsonBody(req));

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: user.id },
    include: {
      items: true,
      customer: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!order) {
    throw new AppError(404, "NOT_FOUND", "Pesanan tidak ditemukan");
  }

  if (order.status !== OrderStatus.WAITING_CUSTOMER_PAYMENT) {
    throw new AppError(409, "ORDER_STATE_CONFLICT", "Pesanan tidak sedang menunggu pembayaran");
  }

  if (order.totalAmount === null || order.totalAmount <= 0) {
    throw new AppError(409, "ORDER_STATE_CONFLICT", "Total harga pesanan belum ditentukan");
  }

  const now = new Date();
  if (order.paymentDeadline && order.paymentDeadline <= now) {
    throw new AppError(410, "PAYMENT_DEADLINE_PASSED", "Batas waktu pembayaran telah berakhir");
  }

  const midtransOrderId = `${order.id}-${Date.now()}`;

  const itemDetails: MidtransItemDetail[] = order.items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.finalPrice ?? item.estimatedPrice ?? 0,
    quantity: item.quantity,
  }));

  if (order.serviceFee && order.serviceFee > 0) {
    itemDetails.push({
      id: "service_fee",
      name: "Ongkos Jasa Driver",
      price: order.serviceFee,
      quantity: 1,
    });
  }

  if (order.platformFee && order.platformFee > 0) {
    itemDetails.push({
      id: "platform_fee",
      name: "Biaya Layanan Platform",
      price: order.platformFee,
      quantity: 1,
    });
  }

  const calculatedSum = itemDetails.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const diff = order.totalAmount - calculatedSum;
  if (diff !== 0) {
    itemDetails.push({
      id: "adjustment",
      name: "Penyesuaian Biaya",
      price: diff,
      quantity: 1,
    });
  }

  await prisma.payment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      method: PaymentMethod.QRIS,
      status: PaymentStatus.PENDING,
      amount: order.totalAmount,
      gatewayRef: midtransOrderId,
      idempotencyKey: crypto.randomUUID(),
      expiresAt: order.paymentDeadline ?? new Date(Date.now() + 5 * 60 * 1000),
    },
    update: {
      gatewayRef: midtransOrderId,
      status: PaymentStatus.PENDING,
      amount: order.totalAmount,
    },
  });

  const snapResult = await createMidtransSnapTransaction({
    orderId: midtransOrderId,
    grossAmount: order.totalAmount,
    items: itemDetails,
    customer: {
      first_name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone ?? undefined,
    },
  });

  return ok({
    token: snapResult.token,
    redirect_url: snapResult.redirect_url,
    midtransOrderId,
  });
});
