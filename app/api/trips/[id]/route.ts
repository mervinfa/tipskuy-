import { apiHandler, ok, parseJsonBody } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { toggleTrip } from "@/lib/trips";
import { idParamSchema } from "@/types/schemas/common";
import { tripPatchSchema } from "@/types/schemas/trip";

export const PATCH = apiHandler<{ id: string }>(async (req, ctx) => {
  const user = await requireRole("DRIVER");
  const { id } = idParamSchema.parse(await ctx.params);
  const input = tripPatchSchema.parse(await parseJsonBody(req));
  const result = await toggleTrip(user.id, id, input.isActive);
  return ok(result);
});
