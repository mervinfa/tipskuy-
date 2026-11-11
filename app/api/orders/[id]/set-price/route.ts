import { apiHandler, ok, parseJsonBody, serverNow } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { setPrice } from "@/lib/orders/service";
import { setPriceSchema } from "@/types/schemas/order";
import { idParamSchema } from "@/types/schemas/common";

export const PATCH = apiHandler<{ id: string }>(async (req, ctx) => {
  const user = await requireRole("DRIVER");
  const { id } = idParamSchema.parse(await ctx.params);
  const input = setPriceSchema.parse(await parseJsonBody(req));
  const order = await setPrice(user.id, id, input);
  return ok({ ...order, serverTime: serverNow() });
});
