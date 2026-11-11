import { apiHandler, ok, parseJsonBody } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { withdrawFunds } from "@/lib/wallet";
import { withdrawSchema } from "@/types/schemas/upload";

export const POST = apiHandler(async (req) => {
  const user = await requireRole("DRIVER");
  const input = withdrawSchema.parse(await parseJsonBody(req));
  const result = await withdrawFunds(user.id, input);
  return ok(result);
});
