import { AppError, apiHandler, ok } from "@/lib/http";
import { verifyCronSecret } from "@/lib/jobs";
import { sweepExpiredOrders } from "@/lib/orders/expiry";

// Lapis 4 pengaman auto-cancel: menyapu order yang terlewat. Idempoten.
export const GET = apiHandler(async (req) => {
  if (!verifyCronSecret(req)) {
    throw new AppError(401, "UNAUTHORIZED", "Cron secret tidak valid");
  }
  const expired = await sweepExpiredOrders();
  return ok({ expired });
});
