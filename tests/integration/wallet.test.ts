import { describe, expect, it } from "vitest";
import { WalletTxType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getWallet, withdrawFunds } from "@/lib/wallet";
import { completeOrder, deliverOrder, startOrder } from "@/lib/orders/service";
import { uniqueEmail } from "./helpers";
import {
  createPricedOrder,
  createUser,
  driverBalance,
  expectAppError,
  payPricedOrder,
  proofImageUrl,
} from "./helpers";

// I-12, I-13, I-14: pengaman dompet pada level layanan dan constraint basis data.
describe("Dompet driver", () => {
  it("I-12 menolak penarikan melebihi saldo dan tidak mengubah saldo", async () => {
    const driver = await createUser("DRIVER");
    await expectAppError(
      withdrawFunds(driver.id, { amount: 1_000, bankCode: "BCA", accountNumber: "12345678" }),
      409,
      "INSUFFICIENT_BALANCE"
    );
    expect(await driverBalance(driver.id)).toBe(0);
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: driver.id } });
    expect(await prisma.walletTransaction.count({ where: { walletId: wallet.id } })).toBe(0);
  });

  it("menarik dana dengan mengurangi saldo dan mencatat transaksi", async () => {
    const driver = await createUser("DRIVER");
    await prisma.wallet.update({ where: { userId: driver.id }, data: { balance: 100_000 } });
    const result = await withdrawFunds(driver.id, {
      amount: 40_000,
      bankCode: "BCA",
      accountNumber: "12345678",
    });
    expect(result.balance).toBe(60_000);
    expect(await driverBalance(driver.id)).toBe(60_000);

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: driver.id } });
    const txs = await prisma.walletTransaction.findMany({ where: { walletId: wallet.id } });
    expect(txs).toHaveLength(1);
    expect(txs[0]?.type).toBe(WalletTxType.WITHDRAWAL);
    expect(txs[0]?.amount).toBe(-40_000);
    expect(txs[0]?.balanceAfter).toBe(60_000);
  });

  it("penarikan paralel hanya satu yang berhasil (pengurangan atomik)", async () => {
    const driver = await createUser("DRIVER");
    await prisma.wallet.update({ where: { userId: driver.id }, data: { balance: 80_000 } });
    const input = { amount: 50_000, bankCode: "BCA", accountNumber: "12345678" };
    const results = await Promise.allSettled([
      withdrawFunds(driver.id, input),
      withdrawFunds(driver.id, input),
    ]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(await driverBalance(driver.id)).toBe(30_000);
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: driver.id } });
    expect(await prisma.walletTransaction.count({ where: { walletId: wallet.id } })).toBe(1);
  });

  it("penarikan paralel yang sama-sama berhasil mencatat balanceAfter berurutan", async () => {
    const driver = await createUser("DRIVER");
    await prisma.wallet.update({ where: { userId: driver.id }, data: { balance: 100_000 } });
    const input = { amount: 40_000, bankCode: "BCA", accountNumber: "12345678" };
    const results = await Promise.allSettled([
      withdrawFunds(driver.id, input),
      withdrawFunds(driver.id, input),
    ]);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    expect(await driverBalance(driver.id)).toBe(20_000);

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: driver.id } });
    const txs = await prisma.walletTransaction.findMany({ where: { walletId: wallet.id } });
    expect(txs.map((tx) => tx.balanceAfter).sort((a, b) => a - b)).toEqual([20_000, 60_000]);
  });

  it("I-13 menolak update saldo negatif lewat CHECK constraint basis data", async () => {
    const driver = await createUser("DRIVER");
    await expect(
      prisma.wallet.update({ where: { userId: driver.id }, data: { balance: -1 } })
    ).rejects.toThrow(/wallet_balance_non_negative/i);
    expect(await driverBalance(driver.id)).toBe(0);
  });

  it("I-14 menolak WalletTransaction kedua dengan escrowId sama (unique constraint)", async () => {
    const fixture = await createPricedOrder();
    await payPricedOrder(fixture);
    await startOrder(fixture.driver.id, fixture.orderId);
    await deliverOrder(fixture.driver.id, fixture.orderId, { imageUrl: proofImageUrl(fixture.driver.id) });
    await completeOrder(fixture.customer.id, fixture.orderId);

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: fixture.driver.id } });
    const releaseTx = await prisma.walletTransaction.findFirstOrThrow({
      where: { walletId: wallet.id, type: WalletTxType.ESCROW_RELEASE },
    });
    expect(releaseTx.escrowId).not.toBeNull();

    await expect(
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTxType.WITHDRAWAL,
          amount: 0,
          balanceAfter: 0,
          escrowId: releaseTx.escrowId,
        },
      })
    ).rejects.toThrow();
    expect(
      await prisma.walletTransaction.count({ where: { walletId: wallet.id } })
    ).toBe(1);
  });

  it("getWallet mengembalikan saldo dan riwayat transaksi", async () => {
    const driver = await createUser("DRIVER");
    const result = await getWallet(driver.id, { page: 1, pageSize: 10 });
    expect(result.balance).toBe(0);
    expect(result.transactions.total).toBe(0);
    expect(result.transactions.items).toHaveLength(0);
  });

  it("getWallet menolak pengguna tanpa dompet", async () => {
    const email = uniqueEmail("tanpa-dompet");
    const user = await prisma.user.create({
      data: {
        name: "Pengguna Tanpa Dompet",
        email,
        passwordHash: "hash-uji",
        phone: "081234567890",
        role: "CUSTOMER",
      },
    });
    await expectAppError(getWallet(user.id, { page: 1, pageSize: 10 }), 404, "WALLET_NOT_FOUND");
  });
});
