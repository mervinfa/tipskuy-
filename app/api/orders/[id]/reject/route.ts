import { apiHandler, ok, parseJsonBody, serverNow } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { rejectOrder } from "@/lib/orders/service";
import { rejectOrderSchema } from "@/types/schemas/order";
import { idParamSchema } from "@/types/schemas/common";

export const POST = apiHandler<{ id: string }>(async (req, ctx) => {
  const user = await requireUser();
  const { id } = idParamSchema.parse(await ctx.params);
  const input = rejectOrderSchema.parse(await parseJsonBody(req));
  const order = await rejectOrder(user.id, id, input);
  return ok({ ...order, serverTime: serverNow() });
});
