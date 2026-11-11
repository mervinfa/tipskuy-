import { AppError, apiHandler, ok } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { getCurrentUser } from "@/lib/auth";

export const GET = apiHandler(async () => {
  const session = await requireUser();
  const user = await getCurrentUser(session.id);
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "Pengguna tidak ditemukan");
  }
  return ok(user);
});
