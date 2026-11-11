import { auth } from "@/lib/auth";
import { AppError } from "@/lib/http";
import type { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
};

export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.role) {
    throw new AppError(401, "UNAUTHENTICATED", "Silakan masuk terlebih dahulu");
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== role) {
    throw new AppError(403, "FORBIDDEN", "Peran Anda tidak diizinkan melakukan aksi ini");
  }
  return user;
}
