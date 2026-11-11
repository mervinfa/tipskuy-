import { apiHandler, ok, parseJsonText, serverNow } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { startOrder } from "@/lib/orders/service";
import { emptyBodySchema } from "@/types/schemas/order";
import { idParamSchema } from "@/types/schemas/common";

export const POST = apiHandler<{ id: string }>(async (req, ctx) => {
  const user = await requireRole("DRIVER");
  const { id } = idParamSchema.parse(await ctx.params);
  const text = await req.text();
  if (text.trim()) {
    // Endpoint tanpa body; body terisi hanya boleh objek kosong.
    emptyBodySchema.parse(parseJsonText(text));
  }
  const order = await startOrder(user.id, id);
  return ok({ ...order, serverTime: serverNow() });
});
