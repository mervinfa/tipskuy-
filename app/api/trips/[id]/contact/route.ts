import { apiHandler, ok } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getTripContact } from "@/lib/trips";
import { idParamSchema } from "@/types/schemas/common";

export const GET = apiHandler<{ id: string }>(async (req, ctx) => {
  const user = await requireRole("CUSTOMER");
  const { id } = idParamSchema.parse(await ctx.params);
  enforceRateLimit(`trip-contact:${user.id}`, 30, 60_000, "Terlalu banyak permintaan kontak. Coba lagi dalam semenit.");
  const result = await getTripContact(user.id, id);
  return ok(result);
});
