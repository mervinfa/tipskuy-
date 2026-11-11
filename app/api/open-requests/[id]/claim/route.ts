import { apiHandler, ok, serverNow } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { claimOpenRequest } from "@/lib/orders/service";
import { idParamSchema } from "@/types/schemas/common";

export const POST = apiHandler<{ id: string }>(async (_req, ctx) => {
  const user = await requireRole("DRIVER");
  const { id } = idParamSchema.parse(await ctx.params);
  const order = await claimOpenRequest(user.id, id);
  return ok({ ...order, serverTime: serverNow() }, { status: 201 });
});
