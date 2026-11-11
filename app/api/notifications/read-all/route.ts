import { apiHandler, ok, serverNow } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { markAllNotificationsRead } from "@/lib/notifications";

export const PATCH = apiHandler(async () => {
  const user = await requireUser();
  const result = await markAllNotificationsRead(user.id);
  return ok({ ...result, serverTime: serverNow() });
});
