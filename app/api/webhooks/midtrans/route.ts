import { createHash, timingSafeEqual } from "node:crypto";
import {
  ActorType,
  EscrowStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMidtransConfig } from "@/lib/env";
import { notifyPaymentReceived } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const order_id = String(body.order_id ?? "");
    const status_code = String(body.status_code ?? "");
    const gross_amount = String(body.gross_amount ?? "");
    const signature_key = String(body.signature_key ?? "");
    const transaction_status = String(body.transaction_status ?? "");
    const fraud_status = body.fraud_status ? String(body.fraud_status) : undefined;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verifikasi signature_key Midtrans
    const { serverKey } = getMidtransConfig();
    const rawSignature = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const expectedSignature = createHash("sha512").update(rawSignature).digest("hex");

    if (
      expectedSignature.length !== signature_key.length ||
      !timingSafeEqual(Buffer.from(expectedSignature, "utf8"), Buffer.from(signature_key, "utf8"))
    ) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Tangkap orderId murni dari format `${orderId}-${timestamp}`
    const realOrderId = order_id.split("-")[0];

    // 3. Cari data order
    let order = await prisma.order.findUnique({
      where: { id: realOrderId },
      include: {
        driver: { select: { userId: true } },
      },
    });

    if (!order) {
      const paymentRecord = await prisma.payment.findUnique({
        where: { gatewayRef: order_id },
        include: {
          order: {
            include: { driver: { select: { userId: true } } },
          },
        },
      });
      if (paymentRecord?.order) {
        order = paymentRecord.order;
      }
    }

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const isSuccess =
      transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept");

    const isFailure =
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "expire";

    const now = new Date();

    if (isSuccess) {
      // Jalankan prisma.order.update secara langsung tanpa $transaction rumit
      if (order.status !== OrderStatus.PAID_HELD_IN_ESCROW) {
        await prisma.order.update({
          where: { id: realOrderId },
          data: {
            status: OrderStatus.PAID_HELD_IN_ESCROW,
            paidAt: now,
          },
        });

        const payment = await prisma.payment.upsert({
          where: { orderId: realOrderId },
          create: {
            orderId: realOrderId,
            method: PaymentMethod.QRIS,
            status: PaymentStatus.PAID,
            amount: order.totalAmount ?? Math.round(Number(gross_amount)),
            gatewayRef: order_id,
            idempotencyKey: crypto.randomUUID(),
            expiresAt: order.paymentDeadline ?? new Date(Date.now() + 5 * 60 * 1000),
            paidAt: now,
            rawPayload: body as Prisma.InputJsonValue,
          },
          update: {
            status: PaymentStatus.PAID,
            paidAt: now,
            rawPayload: body as Prisma.InputJsonValue,
          },
        });

        await prisma.escrowTransaction.upsert({
          where: { orderId: realOrderId },
          create: {
            orderId: realOrderId,
            paymentId: payment.id,
            amount: order.totalAmount ?? Math.round(Number(gross_amount)),
            platformFee: order.platformFee ?? 0,
            status: EscrowStatus.HELD,
            heldAt: now,
          },
          update: {
            status: EscrowStatus.HELD,
          },
        });

        await prisma.orderStatusLog.create({
          data: {
            orderId: realOrderId,
            fromStatus: order.status,
            toStatus: OrderStatus.PAID_HELD_IN_ESCROW,
            actorType: ActorType.SYSTEM,
            reason: `Midtrans Webhook: ${transaction_status}`,
          },
        });

        await notifyPaymentReceived(prisma, {
          customerId: order.customerId,
          driverUserId: order.driver.userId,
          orderId: realOrderId,
          amount: order.totalAmount ?? Math.round(Number(gross_amount)),
        });
      }
    } else if (isFailure) {
      await prisma.payment.updateMany({
        where: { OR: [{ orderId: realOrderId }, { gatewayRef: order_id }] },
        data: {
          status: PaymentStatus.FAILED,
          rawPayload: body as Prisma.InputJsonValue,
        },
      });
    }

    return Response.json({ status: "OK" }, { status: 200 });
  } catch (err) {
    console.error("Error processing Midtrans webhook:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
