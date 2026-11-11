import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/lib/auth";
import { isPrismaErrorCode } from "@/lib/http";
import { uniqueEmail } from "./helpers";

// I-15: registrasi membentuk User, DriverProfile, dan Wallet secara atomik.
// Kegagalan di tengah transaksi tidak boleh menyisakan data parsial.
function driverInput(email: string) {
  return {
    name: "Driver Uji",
    email,
    password: "sandi12345",
    phone: "081234567890",
    role: "DRIVER" as const,
    driver: {
      vehicleType: "Motor",
      vehiclePlate: "B 9999 UJI",
      whatsappNumber: "6281234567890",
    },
  };
}

describe("I-15 registrasi", () => {
  it("membentuk User, DriverProfile, dan Wallet untuk driver dalam satu transaksi", async () => {
    const email = uniqueEmail("reg-driver");
    const result = await registerUser(driverInput(email));
    expect(result.role).toBe("DRIVER");
    expect(result.email).toBe(email);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { driverProfile: true, wallet: true },
    });
    expect(user).not.toBeNull();
    expect(user?.role).toBe("DRIVER");
    expect(user?.driverProfile?.vehicleType).toBe("Motor");
    expect(user?.driverProfile?.verificationStatus).toBe("PENDING");
    expect(user?.wallet?.balance).toBe(0);
  });

  it("membentuk User dan Wallet tanpa DriverProfile untuk customer", async () => {
    const email = uniqueEmail("reg-customer");
    const result = await registerUser({
      name: "Customer Uji",
      email,
      password: "sandi12345",
      phone: "081234567890",
      role: "CUSTOMER",
    });
    expect(result.role).toBe("CUSTOMER");

    const user = await prisma.user.findUnique({
      where: { email },
      include: { driverProfile: true, wallet: true },
    });
    expect(user).not.toBeNull();
    expect(user?.driverProfile).toBeNull();
    expect(user?.wallet).not.toBeNull();
  });

  it("mengembalikan seluruh perubahan saat email sudah terdaftar (rollback)", async () => {
    const email = uniqueEmail("reg-rollback");
    const first = await registerUser(driverInput(email));

    let duplicate = false;
    try {
      await registerUser(driverInput(email));
    } catch (e) {
      duplicate = true;
      expect(isPrismaErrorCode(e, "P2002")).toBe(true);
    }
    expect(duplicate).toBe(true);

    // Tidak ada data parsial yang tersisa dari percobaan kedua.
    expect(await prisma.user.count({ where: { email } })).toBe(1);
    expect(await prisma.driverProfile.count({ where: { userId: first.id } })).toBe(1);
    expect(await prisma.wallet.count({ where: { userId: first.id } })).toBe(1);
  });

  it("transaksi yang gagal di tengah jalan tidak menyimpan apa pun", async () => {
    const email = uniqueEmail("reg-tx-gagal");
    // Demonstrasi atomisitas $transaction: pembuatan user dan wallet dibatalkan
    // bersama saat transaksi melempar galat setelah keduanya dibuat.
    await expect(
      prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: "Pengguna Sementara",
            email,
            passwordHash: "hash-uji",
            phone: "081234567890",
            role: "CUSTOMER",
          },
        });
        await tx.wallet.create({ data: { userId: user.id } });
        throw new Error("Kegagalan sengaja untuk uji transaksi");
      })
    ).rejects.toThrow("Kegagalan sengaja untuk uji transaksi");

    expect(await prisma.user.count({ where: { email } })).toBe(0);
    expect(
      await prisma.wallet.count({ where: { user: { email } } })
    ).toBe(0);
  });
});
