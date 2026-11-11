import { apiHandler, ok, parseJsonBody, serverNow } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { deliverOrder } from "@/lib/orders/service";
import { deliverOrderSchema } from "@/types/schemas/order";
import { idParamSchema } from "@/types/schemas/common";

export const POST = apiHandler<{ id: string }>(async (req, ctx) => {
  const user = await requireRole("DRIVER");
  const { id } = idParamSchema.parse(await ctx.params);
  const input = deliverOrderSchema.parse(await parseJsonBody(req));
  const order = await deliverOrder(user.id, id, input);
  return ok({ ...order, serverTime: serverNow() });
});
