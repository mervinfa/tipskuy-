import { apiHandler, ok, parseJsonBody, serverNow } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { payOrder } from "@/lib/orders/service";
import { payOrderSchema } from "@/types/schemas/order";
import { idParamSchema } from "@/types/schemas/common";

export const POST = apiHandler<{ id: string }>(async (req, ctx) => {
  const user = await requireRole("CUSTOMER");
  const { id } = idParamSchema.parse(await ctx.params);
  const input = payOrderSchema.parse(await parseJsonBody(req));
  const result = await payOrder(user.id, id, input);
  return ok({ ...result, serverTime: serverNow() });
});
