import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { loginSchema } from "@/types/schemas/auth";
import type { RegisterInput } from "@/types/schemas/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Kata sandi", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user || user.deletedAt) {
          return null;
        }
        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) {
          return null;
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id;
      }
      if (token.role) {
        session.user.role = token.role;
      }
      return session;
    },
  },
});

// Registrasi user, profil driver, dan dompet dalam satu transaksi (TDD 4.2).
export async function registerUser(input: RegisterInput) {
  return prisma.$transaction(async (tx) => {
    const passwordHash = await hashPassword(input.password);
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        phone: input.phone,
        role: input.role,
      },
    });
    if (input.role === "DRIVER" && input.driver) {
      await tx.driverProfile.create({
        data: {
          userId: user.id,
          vehicleType: input.driver.vehicleType,
          vehiclePlate: input.driver.vehiclePlate,
          whatsappNumber: input.driver.whatsappNumber,
        },
      });
    }
    await tx.wallet.create({ data: { userId: user.id } });
    return { id: user.id, role: user.role, email: user.email };
  });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      driverProfile: {
        select: { id: true, verificationStatus: true, whatsappNumber: true },
      },
    },
  });
  if (!user) {
    return null;
  }
  return user;
}
