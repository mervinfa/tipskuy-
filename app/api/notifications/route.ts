import { apiHandler, ok, serverNow } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { listNotifications } from "@/lib/notifications";
import { expireOrdersForUser } from "@/lib/orders/service";
import { notificationListQuerySchema } from "@/types/schemas/upload";

export const GET = apiHandler(async (req) => {
  const user = await requireUser();
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const query = notificationListQuerySchema.parse(params);
  // Lazy expiry lapis 2: status order akurat saat notifikasi dibaca.
  await expireOrdersForUser(user.id);
  const result = await listNotifications(user.id, query);
  return ok({ ...result, serverTime: serverNow() });
});
