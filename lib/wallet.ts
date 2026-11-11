import { WalletTxType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/http";
import type { WithdrawInput } from "@/types/schemas/upload";

export async function getWallet(userId: string, query: { page: number; pageSize: number }) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    throw new AppError(404, "WALLET_NOT_FOUND", "Dompet tidak ditemukan");
  }
  const where = { walletId: wallet.id };
  const [rows, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.walletTransaction.count({ where }),
  ]);
  const items = rows.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    balanceAfter: tx.balanceAfter,
    orderId: tx.orderId,
    note: tx.note,
    createdAt: tx.createdAt,
  }));
  return {
    balance: wallet.balance,
    transactions: { items, page: query.page, pageSize: query.pageSize, total },
  };
}

export async function withdrawFunds(userId: string, input: WithdrawInput, clock: Date = new Date()) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new AppError(404, "WALLET_NOT_FOUND", "Dompet tidak ditemukan");
    }
    // Pengurangan atomik: hanya berhasil bila saldo cukup.
    const debited = await tx.wallet.updateMany({
      where: { id: wallet.id, balance: { gte: input.amount } },
      data: { balance: { decrement: input.amount } },
    });
    if (debited.count !== 1) {
      throw new AppError(409, "INSUFFICIENT_BALANCE", "Saldo tidak cukup untuk penarikan");
    }
    // Baca ulang setelah update agar balanceAfter benar walau ada penarikan paralel.
    const updated = await tx.wallet.findUniqueOrThrow({
      where: { id: wallet.id },
      select: { balance: true },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: WalletTxType.WITHDRAWAL,
        amount: -input.amount,
        balanceAfter: updated.balance,
        note: `Penarikan ke bank ${input.bankCode}`,
      },
    });
    return { balance: updated.balance, withdrawnAt: clock };
  });
}
