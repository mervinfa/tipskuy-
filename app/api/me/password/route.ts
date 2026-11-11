import { AppError, apiHandler, ok, parseJsonBody } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { hashPassword, verifyPassword } from "@/lib/password";
import { changePasswordSchema } from "@/types/schemas/auth";

export const POST = apiHandler(async (req) => {
  const sessionUser = await requireUser();
  enforceRateLimit(
    `change-password:${sessionUser.id}`,
    5,
    60_000,
    "Terlalu banyak percobaan ganti kata sandi. Coba lagi dalam semenit."
  );

  const body = changePasswordSchema.parse(await parseJsonBody(req));

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    throw new AppError(404, "NOT_FOUND", "Pengguna tidak ditemukan");
  }

  const valid = await verifyPassword(body.currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError(400, "INVALID_PASSWORD", "Kata sandi saat ini salah");
  }

  const samePassword = await verifyPassword(body.newPassword, user.passwordHash);
  if (samePassword) {
    throw new AppError(400, "SAME_PASSWORD", "Kata sandi baru tidak boleh sama dengan kata sandi saat ini");
  }

  const newHash = await hashPassword(body.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return ok({ message: "Kata sandi berhasil diubah" });
});

