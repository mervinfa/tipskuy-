"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MessageCircle, X } from "lucide-react";
import { apiErrorMessage, apiGet, apiSend } from "@/components/app/api";
import { formatDateTime, isClosedStatus } from "@/components/app/format";
import { StatusBadge } from "@/components/app/StatusBadge";
import type { OrderDetail } from "@/components/app/types";
import { useCountdown } from "@/hooks/useCountdown";
import { formatRupiah } from "@/lib/format";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

const cardClass =
  "rounded-xl border-[3px] border-black bg-white p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] md:p-5";
const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#B7FF8E] px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-60";
const buttonNeutral =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-60";
const buttonDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-red-400 px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-60";

export function CustomerOrderPanel({
  order,
  onClose,
  onRefresh,
  onError,
  onOpenChat,
}: {
  order: OrderDetail;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onError: (message: string | null) => void;
  onOpenChat: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [contact, setContact] = useState<{ driverName: string; whatsappNumber: string } | null>(null);
  const [actionMode, setActionMode] = useState<"reject" | "dispute" | "complete" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const countdown = useCountdown(order.paymentDeadline, order.serverTime ?? null, () => {
    void onRefresh();
  });

  useEffect(() => {
    setContact(null);
    setActionMode(null);
    setActionReason("");
  }, [order.id]);

  useEffect(() => {
    setActionMode(null);
    setActionReason("");
  }, [order.status]);

  async function run(action: () => Promise<unknown>): Promise<boolean> {
    setBusy(true);
    onError(null);
    try {
      await action();
      await onRefresh();
      return true;
    } catch (error) {
      onError(apiErrorMessage(error));
      return false;
    } finally {
      setBusy(false);
    }
  }

  function startAction(mode: "reject" | "dispute" | "complete") {
    setActionMode(mode);
    setActionReason("");
    onError(null);
  }

  async function triggerPollingRefresh() {
    try {
      await apiSend("/api/payments/verify-status", "POST", { orderId: order.id });
    } catch {
      // Abaikan jika network sesaat
    }
    await onRefresh();
    router.refresh();
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        await apiSend("/api/payments/verify-status", "POST", { orderId: order.id });
      } catch {
        // Abaikan
      }
      await onRefresh();
      router.refresh();
      if (attempts >= 5) {
        clearInterval(interval);
      }
    }, 2000);
  }

  async function payWithMidtrans() {
    await run(async () => {
      const data = await apiSend<{ token: string; redirect_url: string }>(
        "/api/payments/create-token",
        "POST",
        { orderId: order.id }
      );

      if (typeof window !== "undefined" && window.snap) {
        window.snap.pay(data.token, {
          onSuccess: async () => {
            await triggerPollingRefresh();
          },
          onPending: async () => {
            await triggerPollingRefresh();
          },
          onError: () => {
            onError("Pembayaran Midtrans dibatalkan atau gagal");
          },
          onClose: () => {
            void triggerPollingRefresh();
          },
        });
      } else if (data.redirect_url) {
        window.open(data.redirect_url, "_blank");
      } else {
        throw new Error("Pustaka Snap Midtrans belum siap dimuat");
      }
    });
  }

  async function submitReject() {
    const reason = actionReason.trim();
    const success = await run(() =>
      apiSend(`/api/orders/${order.id}/reject`, "POST", reason ? { reason } : {})
    );
    if (success) setActionMode(null);
  }

  async function submitDispute() {
    const reason = actionReason.trim();
    if (reason.length < 10) {
      onError("Alasan sengketa minimal 10 karakter.");
      return;
    }
    const success = await run(() => apiSend(`/api/orders/${order.id}/dispute`, "POST", { reason }));
    if (success) setActionMode(null);
  }

  async function submitComplete() {
    const success = await run(() => apiSend(`/api/orders/${order.id}/complete`, "POST"));
    if (success) setActionMode(null);
  }

  async function loadContact() {
    if (!order.tripId) return;
    try {
      const data = await apiGet<{ driverName: string; whatsappNumber: string }>(
        `/api/trips/${order.tripId}/contact`
      );
      setContact(data);
    } catch (error) {
      onError(apiErrorMessage(error));
    }
  }

  const canPay = order.status === "WAITING_CUSTOMER_PAYMENT" && countdown.remainingMs > 0;
  const canReject =
    order.status === "WAITING_DRIVER_PRICING" || order.status === "WAITING_CUSTOMER_PAYMENT";
  const canDispute = ["PAID_HELD_IN_ESCROW", "IN_TRANSIT", "DELIVERED_PENDING_CONFIRMATION"].includes(
    order.status
  );

  return (
    <div className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold text-black md:text-2xl">Detail pesanan</h2>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm font-medium text-gray-600">
            {order.trip ? `${order.trip.originCity} ke ${order.trip.destCity}` : "Order dari postingan terbuka"}
          </p>
          <p className="text-xs font-semibold text-gray-500">
            Driver: {order.driver?.user.name ?? "-"} - Dibuat {formatDateTime(order.createdAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border-2 border-black bg-white p-1.5"
          aria-label="Tutup detail"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3 rounded-lg border-2 border-black bg-[#FFF7D6] p-2.5">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-20 w-20 shrink-0 rounded-md border-2 border-black object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-black">{item.name}</p>
                <p className="text-xs font-medium text-gray-600">Jumlah {item.quantity}</p>
                {item.description ? <p className="text-xs text-gray-600">{item.description}</p> : null}
                <p className="mt-1 text-xs font-bold text-black">
                  Harga final: {item.finalPrice !== null ? formatRupiah(item.finalPrice) : "Menunggu driver"}
                </p>
              </div>
            </div>
          ))}
          {order.customerNote ? (
            <p className="rounded-md border-2 border-black bg-gray-50 p-2 text-xs font-medium text-gray-700">
              Catatan: {order.customerNote}
            </p>
          ) : null}
          {order.trip?.notes ? (
            <p className="rounded-md border-2 border-black bg-[#FEF9C3] p-2 text-sm font-semibold text-black">
              Catatan driver: {order.trip.notes}
            </p>
          ) : null}
        </div>

        <div className="rounded-lg border-2 border-black bg-[#F0FDF4] p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Ringkasan</p>
          <div className="mt-2 space-y-1 text-sm font-medium text-gray-700">
            <p>Subtotal barang: {order.itemSubtotal !== null ? formatRupiah(order.itemSubtotal) : "-"}</p>
            <p>Ongkos jasa: {order.serviceFee !== null ? formatRupiah(order.serviceFee) : "-"}</p>
            <p>Biaya platform: {order.platformFee !== null ? formatRupiah(order.platformFee) : "-"}</p>
            <p className="border-t-2 border-black pt-1 text-base font-extrabold text-black">
              Total: {order.totalAmount !== null ? formatRupiah(order.totalAmount) : "Menunggu harga"}
            </p>
          </div>

          {order.status === "WAITING_CUSTOMER_PAYMENT" ? (
            <div className="mt-3 rounded-md border-2 border-black bg-white p-2">
              <p className="text-xs font-bold text-gray-600">Sisa waktu pembayaran</p>
              <p className="text-2xl font-extrabold text-black">
                {String(countdown.mm).padStart(2, "0")}:{String(countdown.ss).padStart(2, "0")}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {order.status === "WAITING_DRIVER_PRICING" ? (
        <p className="mt-4 rounded-md border-2 border-black bg-amber-100 p-3 text-sm font-bold text-amber-900">
          Menunggu driver menentukan harga. Halaman ini akan diperbarui otomatis.
        </p>
      ) : null}

      {order.status === "WAITING_CUSTOMER_PAYMENT" ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border-2 border-black bg-orange-50 p-4">
          <div>
            <p className="text-sm font-extrabold text-black">Pembayaran Pesanan</p>
            <p className="mt-1 text-xs text-neutral-600">
              Selesaikan pembayaran menggunakan gateway Midtrans Sandbox (QRIS, GoPay, ShopeePay, Virtual Account demo).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void payWithMidtrans()}
              disabled={busy || !canPay}
              className={buttonPrimary}
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              Bayar Sekarang (Midtrans Snap)
            </button>
          </div>

          {!canPay ? (
            <p className="text-xs font-bold text-red-700">Waktu pembayaran habis. Muat ulang status.</p>
          ) : null}
        </div>
      ) : null}

      {order.status === "PAID_HELD_IN_ESCROW" ? (
        <div className="mt-4 rounded-lg border-2 border-black bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-700" />
            <p className="text-sm font-extrabold text-emerald-950">Pembayaran Berhasil (Lunas)</p>
          </div>
          <p className="mt-1 text-xs font-medium text-emerald-800">
            Pembayaran telah diverifikasi secara otomatis oleh sistem. Dana aman tertahan di rekening bersama Tipskuy dan driver sedang memproses pembelian atau pengiriman pesanan Anda.
          </p>
        </div>
      ) : null}

      {order.deliveryProof ? (
        <div className="mt-4 rounded-lg border-2 border-black bg-white p-3">
          <p className="text-sm font-extrabold text-black">Bukti serah terima</p>
          <img
            src={order.deliveryProof.imageUrl}
            alt="Bukti serah terima"
            className="mt-2 max-h-64 rounded-md border-2 border-black object-contain"
          />
          {order.deliveryProof.note ? (
            <p className="mt-2 text-xs font-medium text-gray-600">{order.deliveryProof.note}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onOpenChat} className={buttonNeutral}>
          <MessageCircle size={15} />
          Chat driver
        </button>
        {order.tripId ? (
          <button type="button" onClick={() => void loadContact()} className={buttonNeutral}>
            <MessageCircle size={15} />
            Kontak driver
          </button>
        ) : null}
        {canReject ? (
          <button type="button" onClick={() => startAction("reject")} disabled={busy} className={buttonDanger}>
            Tolak pesanan
          </button>
        ) : null}
        {canDispute ? (
          <button type="button" onClick={() => startAction("dispute")} disabled={busy} className={buttonNeutral}>
            Ajukan sengketa
          </button>
        ) : null}
        {order.status === "DELIVERED_PENDING_CONFIRMATION" ? (
          <button type="button" onClick={() => startAction("complete")} disabled={busy} className={buttonPrimary}>
            Pesanan selesai
          </button>
        ) : null}
      </div>

      {actionMode ? (
        <div className="mt-3 rounded-lg border-2 border-black bg-white p-3">
          {actionMode === "complete" ? (
            <p className="text-sm font-bold text-black">
              Konfirmasi bahwa pesanan sudah diterima dan selesai?
            </p>
          ) : (
            <label className="flex flex-col gap-1 text-xs font-bold text-black">
              {actionMode === "reject"
                ? "Alasan penolakan (opsional)"
                : "Alasan sengketa (minimal 10 karakter)"}
              <textarea
                value={actionReason}
                onChange={(event) => setActionReason(event.target.value)}
                rows={3}
                maxLength={500}
                className="rounded-md border-2 border-black bg-white p-3 text-sm font-medium text-black outline-none placeholder:text-gray-500"
                placeholder={
                  actionMode === "reject"
                    ? "Contoh: harga terlalu tinggi"
                    : "Jelaskan masalah pesanan secara singkat"
                }
              />
            </label>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (actionMode === "reject") void submitReject();
                else if (actionMode === "dispute") void submitDispute();
                else void submitComplete();
              }}
              disabled={busy}
              className={actionMode === "reject" ? buttonDanger : buttonPrimary}
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              {actionMode === "reject"
                ? "Kirim penolakan"
                : actionMode === "dispute"
                  ? "Kirim sengketa"
                  : "Ya, selesaikan"}
            </button>
            <button
              type="button"
              onClick={() => {
                setActionMode(null);
                setActionReason("");
              }}
              disabled={busy}
              className={buttonNeutral}
            >
              Batal
            </button>
          </div>
        </div>
      ) : null}

      {contact ? (
        <div className="mt-3 rounded-md border-2 border-black bg-[#DCFCE7] p-2 text-sm font-bold text-black">
          {contact.driverName}:{" "}
          <a
            href={`https://wa.me/${contact.whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {contact.whatsappNumber}
          </a>
        </div>
      ) : null}

      {isClosedStatus(order.status) ? (
        <p className="mt-3 text-xs font-semibold text-gray-500">
          Pesanan ditutup {formatDateTime(order.closedAt ?? order.updatedAt)}
          {order.closeReason ? ` - ${order.closeReason}` : ""}
        </p>
      ) : null}
    </div>
  );
}
