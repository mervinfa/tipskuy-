"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Banknote, LayoutDashboard, Loader2, RefreshCw } from "lucide-react";
import { apiErrorMessage, apiGet, apiSend } from "@/components/app/api";
import { formatDateTime } from "@/components/app/format";
import { useMe } from "@/components/app/useMe";
import type { Wallet } from "@/components/app/types";
import { formatRupiah } from "@/lib/format";

const cardClass =
  "rounded-xl border-[3px] border-black bg-white p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] md:p-5";
const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#B7FF8E] px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-60";
const buttonNeutral =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-60";
const inputClass =
  "h-10 rounded-md border-2 border-black bg-white px-3 text-sm font-medium text-black outline-none placeholder:text-gray-500";

export function WalletApp() {
  const { me, loading: loadingMe } = useMe();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBank, setWithdrawBank] = useState("BCA");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    setLoadingWallet(true);
    setWalletError(null);
    try {
      const data = await apiGet<Wallet>("/api/wallet?page=1&pageSize=20");
      setWallet(data);
    } catch (error) {
      setWalletError(apiErrorMessage(error));
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  useEffect(() => {
    if (me?.role !== "DRIVER") return;
    void loadWallet();
  }, [me, loadWallet]);

  async function handleWithdraw(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWalletError(null);
    setWithdrawMessage(null);
    const amount = Number(withdrawAmount);
    if (!Number.isInteger(amount) || amount < 1) {
      setWalletError("Jumlah penarikan harus bilangan bulat Rupiah");
      return;
    }
    setWithdrawBusy(true);
    try {
      await apiSend("/api/wallet/withdraw", "POST", {
        amount,
        bankCode: withdrawBank,
        accountNumber: withdrawAccount,
      });
      setWithdrawAmount("");
      setWithdrawAccount("");
      setWithdrawMessage("Penarikan berhasil diproses.");
      await loadWallet();
    } catch (error) {
      setWalletError(apiErrorMessage(error));
    } finally {
      setWithdrawBusy(false);
    }
  }

  if (loadingMe) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-black" size={32} />
      </div>
    );
  }

  if (!me) {
    return (
      <div className={cardClass}>
        <h2 className="text-xl font-extrabold text-black md:text-2xl">Masuk sebagai driver</h2>
        <p className="mt-2 text-sm font-medium text-gray-600">
          Dompet driver memerlukan akun driver yang sudah terdaftar.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/auth/login" className={buttonPrimary}>
            Login
          </Link>
          <Link href="/auth/register" className={buttonNeutral}>
            Register driver
          </Link>
        </div>
      </div>
    );
  }

  if (me.role !== "DRIVER") {
    return (
      <div className={cardClass}>
        <h2 className="text-xl font-extrabold text-black md:text-2xl">
          Dompet hanya untuk akun driver
        </h2>
        <p className="mt-2 text-sm font-medium text-gray-600">
          Akun customer tidak memiliki saldo dompet.
        </p>
        <Link href="/caridriver" className={`${buttonPrimary} mt-4`}>
          Buka Cari Driver
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border-[3px] border-black bg-[#FEF08A] p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-black md:text-3xl">Dompet driver</h1>
            <p className="mt-1 text-sm font-medium text-gray-700">
              Halo {me.name}. Saldo masuk setelah order selesai.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/driver" className={buttonNeutral}>
              <LayoutDashboard size={15} />
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => void loadWallet()}
              className={buttonNeutral}
              disabled={loadingWallet}
            >
              <RefreshCw size={15} className={loadingWallet ? "animate-spin" : ""} />
              Muat ulang
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className={cardClass}>
          <div className="rounded-lg border-2 border-black bg-[#DCFCE7] p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Saldo tersedia</p>
            <p className="text-3xl font-extrabold text-black">
              {wallet ? formatRupiah(wallet.balance) : "-"}
            </p>
          </div>

          <form className="mt-4 space-y-2" onSubmit={handleWithdraw}>
            <label className="flex flex-col gap-1 text-xs font-bold text-black">
              Jumlah penarikan
              <input
                required
                type="number"
                min={1}
                placeholder="Contoh: 50000"
                value={withdrawAmount}
                onChange={(event) => setWithdrawAmount(event.target.value)}
                className={`${inputClass} w-full`}
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-bold text-black">
                Bank
                <select
                  value={withdrawBank}
                  onChange={(event) => setWithdrawBank(event.target.value)}
                  className={inputClass}
                >
                  <option value="BCA">BCA</option>
                  <option value="BRI">BRI</option>
                  <option value="BNI">BNI</option>
                  <option value="MANDIRI">Mandiri</option>
                  <option value="BSI">BSI</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-black">
                Nomor rekening
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{5,20}"
                  placeholder="Nomor rekening"
                  value={withdrawAccount}
                  onChange={(event) => setWithdrawAccount(event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <button type="submit" disabled={withdrawBusy} className={`${buttonPrimary} w-full`}>
              {withdrawBusy ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Banknote size={16} />
              )}
              Tarik saldo
            </button>
          </form>

          {withdrawMessage ? (
            <p className="mt-2 rounded-md border-2 border-green-700 bg-green-50 p-2 text-xs font-bold text-green-800">
              {withdrawMessage}
            </p>
          ) : null}
          {walletError ? (
            <p className="mt-2 rounded-md border-2 border-red-500 bg-red-50 p-2 text-xs font-bold text-red-700">
              {walletError}
            </p>
          ) : null}
        </div>

        <div className={cardClass}>
          <h2 className="text-xl font-extrabold text-black md:text-2xl">Riwayat transaksi</h2>
          <div className="mt-3 space-y-2">
            {(wallet?.transactions.items ?? []).map((tx) => (
              <div key={tx.id} className="rounded-md border-2 border-black bg-white p-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-black">
                    {tx.type === "WITHDRAWAL" ? "Penarikan" : "Dana order"}
                  </span>
                  <span
                    className={`font-extrabold ${tx.amount < 0 ? "text-red-700" : "text-green-700"}`}
                  >
                    {formatRupiah(tx.amount)}
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-medium text-gray-500">
                  {formatDateTime(tx.createdAt)}
                </p>
              </div>
            ))}
            {wallet && wallet.transactions.items.length === 0 ? (
              <p className="text-sm font-medium text-gray-500">Belum ada transaksi.</p>
            ) : null}
            {!wallet && loadingWallet ? (
              <p className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Loader2 size={15} className="animate-spin" /> Memuat riwayat...
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
