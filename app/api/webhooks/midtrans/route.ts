import { z } from "zod";
import { apiHandler, AppError, ok, parseJsonBody } from "@/lib/http";
import { verifyMidtransSignature } from "@/lib/payments/midtrans";
import { processPaymentWebhook } from "@/lib/orders/service";

const midtransWebhookSchema = z.object({
  order_id: z.string(),
  status_code: z.string(),
  gross_amount: z.string(),
  signature_key: z.string(),
  transaction_status: z.string(),
  fraud_status: z.string().optional(),
  payment_type: z.string().optional(),
});

export const POST = apiHandler(async (req) => {
  const rawBody = await parseJsonBody(req);
  const parsed = midtransWebhookSchema.safeParse(rawBody);

  if (!parsed.success) {
    throw new AppError(422, "VALIDATION_ERROR", "Payload webhook Midtrans tidak valid");
  }

  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
    fraud_status,
  } = parsed.data;

  const isValidSignature = verifyMidtransSignature(
    order_id,
    status_code,
    gross_amount,
    signature_key
  );

  if (!isValidSignature) {
    throw new AppError(401, "UNAUTHORIZED", "Signature Midtrans tidak valid");
  }

  let finalStatus: "PAID" | "FAILED" | null = null;

  if (transaction_status === "settlement") {
    finalStatus = "PAID";
  } else if (transaction_status === "capture") {
    if (fraud_status === "accept") {
      finalStatus = "PAID";
    }
  } else if (
    transaction_status === "deny" ||
    transaction_status === "cancel" ||
    transaction_status === "expire"
  ) {
    finalStatus = "FAILED";
  }

  if (finalStatus !== null) {
    const result = await processPaymentWebhook({
      gatewayRef: order_id,
      status: finalStatus,
    });
    return ok({ status: "ok", result });
  }

  return ok({ status: "ok", ignored: true, transaction_status });
});
