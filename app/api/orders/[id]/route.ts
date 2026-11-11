import { apiHandler, ok, serverNow } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { getOrderForUser } from "@/lib/orders/service";
import { idParamSchema } from "@/types/schemas/common";

export const GET = apiHandler<{ id: string }>(async (_req, ctx) => {
  const user = await requireUser();
  const { id } = idParamSchema.parse(await ctx.params);
  const order = await getOrderForUser(user.id, id);
  return ok({ ...order, serverTime: serverNow() });
});
