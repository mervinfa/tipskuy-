import { apiHandler, ok, serverNow } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { markNotificationRead } from "@/lib/notifications";
import { idParamSchema } from "@/types/schemas/common";

export const PATCH = apiHandler<{ id: string }>(async (_req, ctx) => {
  const user = await requireUser();
  const { id } = idParamSchema.parse(await ctx.params);
  const result = await markNotificationRead(user.id, id);
  return ok({ ...result, serverTime: serverNow() });
});
