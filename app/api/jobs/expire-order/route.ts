import { AppError, apiHandler, ok, parseJsonText } from "@/lib/http";
import { verifyJobOrWebhookSignature } from "@/lib/jobs";
import { expireOrder } from "@/lib/orders/expiry";
import { expireOrderJobSchema } from "@/types/schemas/upload";

// Dipanggil QStash dengan delay PAYMENT_WINDOW_SECONDS. Idempoten.
export const POST = apiHandler(async (req) => {
  const body = await req.text();
  const verified = await verifyJobOrWebhookSignature(req, body);
  if (!verified) {
    throw new AppError(401, "UNAUTHORIZED", "Signature job tidak valid");
  }
  const payload = expireOrderJobSchema.parse(parseJsonText(body));
  const expired = await expireOrder(payload.orderId);
  return ok({ orderId: payload.orderId, expired });
});
