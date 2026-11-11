import { AppError, apiHandler, ok, parseJsonText } from "@/lib/http";
import { verifyJobOrWebhookSignature } from "@/lib/jobs";
import { processPaymentWebhook } from "@/lib/orders/service";
import { webhookSchema } from "@/types/schemas/upload";

// Webhook gateway pembayaran. Idempoten. Webhook PAID setelah deadline
// tidak menghidupkan kembali order (lihat processPaymentWebhook).
export const POST = apiHandler(async (req) => {
  const body = await req.text();
  const verified = await verifyJobOrWebhookSignature(req, body);
  if (!verified) {
    throw new AppError(401, "UNAUTHORIZED", "Signature webhook tidak valid");
  }
  const payload = webhookSchema.parse(parseJsonText(body));
  const result = await processPaymentWebhook(payload);
  return ok(result);
});
