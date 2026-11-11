import { apiHandler, ok, serverNow } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { completeOrder } from "@/lib/orders/service";
import { idParamSchema } from "@/types/schemas/common";

export const POST = apiHandler<{ id: string }>(async (_req, ctx) => {
  const user = await requireRole("CUSTOMER");
  const { id } = idParamSchema.parse(await ctx.params);
  const result = await completeOrder(user.id, id);
  return ok({ ...result, serverTime: serverNow() });
});
