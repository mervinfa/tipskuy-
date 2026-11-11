import { apiHandler, ok, parseJsonBody, serverNow } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { disputeOrder } from "@/lib/orders/service";
import { disputeOrderSchema } from "@/types/schemas/order";
import { idParamSchema } from "@/types/schemas/common";

export const POST = apiHandler<{ id: string }>(async (req, ctx) => {
  const user = await requireUser();
  const { id } = idParamSchema.parse(await ctx.params);
  const input = disputeOrderSchema.parse(await parseJsonBody(req));
  const order = await disputeOrder(user.id, id, input);
  return ok({ ...order, serverTime: serverNow() });
});
