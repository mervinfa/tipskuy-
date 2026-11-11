"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Truck,
  Wallet as WalletIcon,
  X,
} from "lucide-react";
import { apiErrorMessage, apiGet, apiSend } from "@/components/app/api";
import { formatDateTime, isClosedStatus, serviceLabel } from "@/components/app/format";
import { ImageUpload } from "@/components/app/ImageUpload";
import { EMPTY_CITY, isCityReady, RegionSelect } from "@/components/app/RegionSelect";
import { StatusBadge } from "@/components/app/StatusBadge";
import { MapView, toMapPoint } from "@/components/map/MapView";
import { useMe } from "@/components/app/useMe";
import type {
  CityValue,
  MyTrip,
  OpenRequest,
  OrderDetail,
  OrderListItem,
  ServiceType,
  Wallet,
} from "@/components/app/types";
import { formatRupiah } from "@/lib/format";

type ListPage<T> = { items: T[]; page?: number; pageSize?: number; total?: number };
type CursorOrderPage = { items: OrderListItem[]; nextCursor: string | null };

const cardClass = "rounded-xl border-[3px] border-black bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]";
const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#B7FF8E] px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-60";
const buttonNeutral =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-60";
const buttonDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-red-400 px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-60";
const inputClass = "h-10 rounded-md border-2 border-black bg-white px-3 text-sm font-medium text-black outline-none";

export function DriverApp() {
  const { me, loading: loadingMe } = useMe();
  const [trips, setTrips] = useState<MyTrip[]>([]);
  const [tripsError, setTripsError] = useState<string | null>(null);
  const [loadingTrips, setLoadingTrips] = useState(false);

  const [serviceType, setServiceType] = useState<ServiceType>("JASTIP");
  const [origin, setOrigin] = useState<CityValue>(EMPTY_CITY);
  const [destination, setDestination] = useState<CityValue>(EMPTY_CITY);
  const [baseFee, setBaseFee] = useState("25000");
  const [departureAt, setDepartureAt] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  const [serviceFee, setServiceFee] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [reasonAction, setReasonAction] = useState<"reject" | "dispute" | null>(null);
  const [actionReason, setActionReason] = useState("");

  const [openRequests, setOpenRequests] = useState<OpenRequest[]>([]);
  const [openRequestsError, setOpenRequestsError] = useState<string | null>(null);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBank, setWithdrawBank] = useState("BCA");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    setLoadingTrips(true);
    setTripsError(null);
    try {
      const data = await apiGet<ListPage<MyTrip>>("/api/trips/mine?page=1&pageSize=50");
      setTrips(data.items);
    } catch (error) {
      setTripsError(apiErrorMessage(error));
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const data = await apiGet<CursorOrderPage>("/api/orders?role=driver&limit=50");
      setOrders(data.items);
    } catch (error) {
      setOrdersError(apiErrorMessage(error));
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const loadOpenRequests = useCallback(async () => {
    setLoadingRequests(true);
    setOpenRequestsError(null);
    try {
      const data = await apiGet<ListPage<OpenRequest>>("/api/open-requests?page=1&pageSize=50");
      setOpenRequests(data.items);
    } catch (error) {
      setOpenRequestsError(apiErrorMessage(error));
    } finally {
      setLoadingRequests(false);
    }
  }, []);

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

  const loadOrder = useCallback(
    async (silent = false) => {
      if (!orderId) {
        setOrder(null);
        return;
      }
      if (!silent) setLoadingOrder(true);
      try {
        const data = await apiGet<OrderDetail>(`/api/orders/${orderId}`);
        setOrder(data);
        // Polling tidak boleh menimpa harga yang sedang diketik driver.
        if (!silent) {
          setPriceDraft(
            Object.fromEntries(
              data.items.map((item) => [item.id, String(item.finalPrice ?? item.estimatedPrice ?? 0)])
            )
          );
          setServiceFee(String(data.serviceFee ?? data.trip?.baseFee ?? 0));
        }
      } catch (error) {
        setOrderError(apiErrorMessage(error));
      } finally {
        if (!silent) setLoadingOrder(false);
      }
    },
    [orderId]
  );

  useEffect(() => {
    if (me?.role !== "DRIVER") return;
    void loadTrips();
    void loadOrders();
    void loadOpenRequests();
    void loadWallet();
    const timer = window.setInterval(() => {
      void loadOrders();
      void loadOpenRequests();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [me, loadTrips, loadOrders, loadOpenRequests, loadWallet]);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("order");
    if (fromUrl) setOrderId(fromUrl);
  }, []);

  useEffect(() => {
    if (!orderId) return;
    void loadOrder();
    const timer = window.setInterval(() => {
      void loadOrder(true);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [orderId, loadOrder]);

  useEffect(() => {
    setReasonAction(null);
    setActionReason("");
  }, [order?.id, order?.status]);

  function selectOrder(id: string) {
    setOrderId(id);
    setOrder(null);
    setOrderError(null);
    setProofUrl("");
    setProofNote("");
    setReasonAction(null);
    setActionReason("");
    window.history.replaceState(null, "", `/driver?order=${encodeURIComponent(id)}`);
    window.setTimeout(() => {
      document.getElementById("driver-order-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function closeOrder() {
    setOrderId(null);
    setOrder(null);
    setOrderError(null);
    setReasonAction(null);
    setActionReason("");
    window.history.replaceState(null, "", "/driver");
  }

  async function refreshAfterAction() {
    await Promise.all([loadOrder(true), loadOrders(), loadTrips(), loadWallet()]);
  }

  async function handleCreateTrip(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);
    setCreateMessage(null);
    if (!isCityReady(origin) || !isCityReady(destination)) {
      setCreateError("Pilih kota asal dan kota tujuan");
      return;
    }
    const fee = Number(baseFee);
    if (!Number.isInteger(fee) || fee < 0) {
      setCreateError("Tarif minimum harus bilangan bulat Rupiah");
      return;
    }
    setCreating(true);
    try {
      await apiSend("/api/trips", "POST", {
        serviceType,
        origin: { cityCode: origin.cityCode },
        destination: { cityCode: destination.cityCode },
        baseFee: fee,
        ...(departureAt ? { departureAt: new Date(departureAt).toISOString() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      setCreateMessage("Trip berhasil dibuka. Customer sekarang bisa menemukannya.");
      setDestination(EMPTY_CITY);
      setNotes("");
      setDepartureAt("");
      await loadTrips();
    } catch (error) {
      setCreateError(apiErrorMessage(error));
    } finally {
      setCreating(false);
    }
  }

  async function toggleTrip(trip: MyTrip) {
    try {
      await apiSend(`/api/trips/${trip.id}`, "PATCH", { isActive: !trip.isActive });
      await loadTrips();
    } catch (error) {
      setTripsError(apiErrorMessage(error));
    }
  }

  async function runOrderAction(action: () => Promise<unknown>): Promise<boolean> {
    setActionBusy(true);
    setOrderError(null);
    try {
      await action();
      await refreshAfterAction();
      return true;
    } catch (error) {
      setOrderError(apiErrorMessage(error));
      return false;
    } finally {
      setActionBusy(false);
    }
  }

  async function submitPrice() {
    if (!order) return;
    const items = order.items.map((item) => {
      const value = Number(priceDraft[item.id]);
      return { id: item.id, finalPrice: value };
    });
    const fee = Number(serviceFee);
    if (
      items.some((item) => !Number.isInteger(item.finalPrice) || item.finalPrice < 0) ||
      !Number.isInteger(fee) ||
      fee < 0
    ) {
      setOrderError("Harga barang dan ongkos jasa harus bilangan bulat Rupiah");
      return;
    }
    await runOrderAction(() =>
      apiSend(`/api/orders/${order.id}/set-price`, "PATCH", { items, serviceFee: fee })
    );
  }

  async function submitRejectOrderAction() {
    if (!order) return;
    const reason = actionReason.trim();
    const rejected = await runOrderAction(() =>
      apiSend(`/api/orders/${order.id}/reject`, "POST", reason ? { reason } : {})
    );
    if (rejected) {
      setReasonAction(null);
      setActionReason("");
    }
  }

  async function startOrderAction() {
    if (!order) return;
    await runOrderAction(() => apiSend(`/api/orders/${order.id}/start`, "POST"));
  }

  async function deliverOrderAction() {
    if (!order) return;
    if (!proofUrl) {
      setOrderError("Unggah foto bukti serah terima terlebih dahulu");
      return;
    }
    const delivered = await runOrderAction(() =>
      apiSend(`/api/orders/${order.id}/deliver`, "POST", {
        imageUrl: proofUrl,
        ...(proofNote.trim() ? { note: proofNote.trim() } : {}),
      })
    );
    if (delivered) {
      setProofUrl("");
      setProofNote("");
    }
  }

  async function submitDisputeOrderAction() {
    if (!order) return;
    const reason = actionReason.trim();
    if (reason.length < 10) {
      setOrderError("Alasan sengketa minimal 10 karakter.");
      return;
    }
    const disputed = await runOrderAction(() =>
      apiSend(`/api/orders/${order.id}/dispute`, "POST", { reason })
    );
    if (disputed) {
      setReasonAction(null);
      setActionReason("");
    }
  }

  function startReasonAction(mode: "reject" | "dispute") {
    setReasonAction(mode);
    setActionReason("");
    setOrderError(null);
  }

  async function claimRequest(request: OpenRequest) {
    setActionBusy(true);
    setOpenRequestsError(null);
    try {
      const created = await apiSend<OrderDetail>(`/api/open-requests/${request.id}/claim`, "POST");
      await Promise.all([loadOpenRequests(), loadOrders()]);
      selectOrder(created.id);
    } catch (error) {
      setOpenRequestsError(apiErrorMessage(error));
    } finally {
      setActionBusy(false);
    }
  }

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
        <h2 className="text-2xl font-extrabold text-black">Masuk sebagai driver</h2>
        <p className="mt-2 text-sm font-medium text-gray-600">
          Dashboard driver memerlukan akun driver yang sudah terdaftar.
        </p>
        <div className="mt-4 flex gap-3">
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
        <h2 className="text-2xl font-extrabold text-black">Akun ini terdaftar sebagai customer</h2>
        <p className="mt-2 text-sm font-medium text-gray-600">
          Gunakan halaman cari driver untuk membuat pesanan.
        </p>
        <Link href="/caridriver" className={`${buttonPrimary} mt-4`}>
          Buka Cari Driver
        </Link>
      </div>
    );
  }

  const sameCity = isCityReady(origin) && origin.cityCode === destination.cityCode;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border-[3px] border-black bg-[#FEF08A] p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-black">Dashboard Driver</h1>
            <p className="mt-1 text-sm font-medium text-gray-700">
              Halo {me.name}. Kelola trip, order, dan dompet Anda di sini.
            </p>
            <p className="mt-2 text-xs font-bold text-gray-600">
              Status verifikasi: {me.driverProfile?.verificationStatus ?? "PENDING"}
            </p>
          </div>
          <div className="rounded-lg border-2 border-black bg-white p-3 text-right shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xs font-bold uppercase text-gray-500">Saldo dompet</p>
            <p className="text-2xl font-extrabold text-black">
              {wallet ? formatRupiah(wallet.balance) : "-"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <form className={cardClass} onSubmit={handleCreateTrip}>
          <h2 className="text-2xl font-extrabold text-black">Buka trip baru</h2>
          <p className="mt-1 text-sm font-medium text-gray-600">
            Trip aktif akan muncul di halaman cari driver. Rute dalam satu kota juga diperbolehkan.
          </p>

          <div className="mt-4 space-y-3">
            <label className="flex flex-col gap-1 text-xs font-bold text-black">
              Jenis layanan
              <select
                value={serviceType}
                onChange={(event) => setServiceType(event.target.value as ServiceType)}
                className={inputClass}
              >
                <option value="JASTIP">Jasa Titip</option>
                <option value="ANTAR_JEMPUT">Antar Jemput</option>
              </select>
            </label>
            <RegionSelect label="Kota asal" value={origin} onChange={setOrigin} />
            <RegionSelect label="Kota tujuan" value={destination} onChange={setDestination} />
            <label className="flex items-start gap-2 text-xs font-bold text-black">
              <input
                type="checkbox"
                checked={sameCity}
                disabled={!isCityReady(origin)}
                onChange={(event) => {
                  if (event.target.checked) {
                    setDestination({ ...origin });
                  } else if (sameCity) {
                    setDestination(EMPTY_CITY);
                  }
                }}
                className="mt-0.5 h-4 w-4 accent-black"
              />
              <span>
                Trip dalam kota yang sama
                <span className="mt-0.5 block font-medium text-gray-600">
                  Cocok untuk jastip dari mall ke restoran atau sebaliknya di kota yang sama.
                </span>
              </span>
            </label>
            <MapView
              origin={toMapPoint(origin)}
              destination={toMapPoint(destination)}
              zoom={destination.zoom ?? origin.zoom ?? 11}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-bold text-black">
                Tarif minimum jasa
                <input
                  required
                  type="number"
                  min={0}
                  value={baseFee}
                  onChange={(event) => setBaseFee(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-black">
                Berangkat (opsional)
                <input
                  type="datetime-local"
                  value={departureAt}
                  onChange={(event) => setDepartureAt(event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-xs font-bold text-black">
              Catatan (opsional)
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                maxLength={500}
                className="rounded-md border-2 border-black bg-white p-3 text-sm font-medium outline-none"
                placeholder="Contoh: Bisa titip barang kecil sampai sedang"
              />
            </label>
          </div>

          {createMessage ? (
            <p className="mt-3 rounded-md border-2 border-green-700 bg-green-50 p-2 text-sm font-bold text-green-800">
              {createMessage}
            </p>
          ) : null}
          {createError ? (
            <p className="mt-3 rounded-md border-2 border-red-500 bg-red-50 p-2 text-sm font-bold text-red-700">
              {createError}
            </p>
          ) : null}

          <button type="submit" disabled={creating} className={`${buttonPrimary} mt-4`}>
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {creating ? "Membuka trip..." : "Buka trip"}
          </button>
        </form>

        <div className={cardClass}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-2xl font-extrabold text-black">Dompet</h2>
            <button type="button" onClick={() => void loadWallet()} className={buttonNeutral} disabled={loadingWallet}>
              <RefreshCw size={15} className={loadingWallet ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="mt-3 rounded-lg border-2 border-black bg-[#DCFCE7] p-3">
            <p className="text-xs font-bold uppercase text-gray-600">Saldo tersedia</p>
            <p className="text-3xl font-extrabold text-black">{wallet ? formatRupiah(wallet.balance) : "-"}</p>
          </div>

          <form className="mt-3 space-y-2" onSubmit={handleWithdraw}>
            <input
              required
              type="number"
              min={1}
              placeholder="Jumlah penarikan"
              value={withdrawAmount}
              onChange={(event) => setWithdrawAmount(event.target.value)}
              className={`${inputClass} w-full`}
            />
            <div className="grid grid-cols-2 gap-2">
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
              <input
                required
                inputMode="numeric"
                pattern="[0-9]{5,20}"
                placeholder="Nomor rekening"
                value={withdrawAccount}
                onChange={(event) => setWithdrawAccount(event.target.value)}
                className={inputClass}
              />
            </div>
            <button type="submit" disabled={withdrawBusy} className={buttonPrimary}>
              {withdrawBusy ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
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

          <div className="mt-3 max-h-44 space-y-1.5 overflow-y-auto pr-1">
            {(wallet?.transactions.items ?? []).map((tx) => (
              <div key={tx.id} className="rounded-md border-2 border-black bg-white p-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-black">{tx.type === "WITHDRAWAL" ? "Penarikan" : "Dana order"}</span>
                  <span className={`font-extrabold ${tx.amount < 0 ? "text-red-700" : "text-green-700"}`}>
                    {formatRupiah(tx.amount)}
                  </span>
                </div>
                <p className="text-[10px] font-medium text-gray-500">{formatDateTime(tx.createdAt)}</p>
              </div>
            ))}
            {wallet && wallet.transactions.items.length === 0 ? (
              <p className="text-xs font-medium text-gray-500">Belum ada transaksi.</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-black">Trip saya</h2>
          <button type="button" onClick={() => void loadTrips()} className={buttonNeutral} disabled={loadingTrips}>
            <RefreshCw size={15} className={loadingTrips ? "animate-spin" : ""} />
            Muat ulang
          </button>
        </div>
        {tripsError ? (
          <p className="rounded-lg border-2 border-red-500 bg-red-50 p-3 text-sm font-bold text-red-700">{tripsError}</p>
        ) : null}
        {trips.length === 0 && !loadingTrips ? (
          <div className={cardClass}>
            <p className="text-sm font-bold text-gray-700">Belum ada trip. Buka trip pertama Anda di atas.</p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {trips.map((trip) => (
              <article key={trip.id} className={cardClass}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase text-gray-500">{serviceLabel(trip.serviceType)}</p>
                    <h3 className="mt-1 flex items-center gap-1 text-lg font-extrabold text-black">
                      <MapPin size={17} />
                      {trip.originCity} ke {trip.destCity}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full border-2 border-black px-2 py-1 text-xs font-extrabold ${
                      trip.isActive ? "bg-green-200 text-green-900" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {trip.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-sm font-medium text-gray-700">
                  <p>Tarif minimum {formatRupiah(trip.baseFee)}</p>
                  <p className="flex items-center gap-1">
                    <Clock size={14} /> {formatDateTime(trip.departureAt)}
                  </p>
                  <p>{trip.activeOrderCount} order aktif</p>
                </div>
                <button type="button" onClick={() => void toggleTrip(trip)} className={`${buttonNeutral} mt-3`}>
                  {trip.isActive ? "Nonaktifkan trip" : "Aktifkan trip"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-black">Order masuk</h2>
          <button type="button" onClick={() => void loadOrders()} className={buttonNeutral} disabled={loadingOrders}>
            <RefreshCw size={15} className={loadingOrders ? "animate-spin" : ""} />
            Muat ulang
          </button>
        </div>
        {ordersError ? (
          <p className="rounded-lg border-2 border-red-500 bg-red-50 p-3 text-sm font-bold text-red-700">{ordersError}</p>
        ) : null}
        {orders.length === 0 && !loadingOrders ? (
          <div className={cardClass}>
            <p className="text-sm font-bold text-gray-700">Belum ada order masuk.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {orders.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectOrder(item.id)}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-[3px] border-black bg-white p-4 text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
              >
                <div>
                  <p className="text-xs font-bold text-gray-500">{formatDateTime(item.createdAt)}</p>
                  <p className="mt-1 text-base font-extrabold text-black">
                    {item.customer.name} - {item._count.items} barang
                  </p>
                  <p className="text-xs font-medium text-gray-600">Order {item.id.slice(-6)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-black">
                    {item.totalAmount ? formatRupiah(item.totalAmount) : "Belum ada harga"}
                  </p>
                  <StatusBadge status={item.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {orderId ? (
        <section id="driver-order-panel" className="scroll-mt-28">
          {loadingOrder && !order ? (
            <div className={`${cardClass} flex items-center gap-2 text-sm font-bold`}>
              <Loader2 size={16} className="animate-spin" /> Memuat order...
            </div>
          ) : order ? (
            <div className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-extrabold text-black">Order {order.id.slice(-6)}</h2>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-600">
                    {order.trip
                      ? `${order.trip.originCity} ke ${order.trip.destCity}`
                      : "Order dari postingan terbuka"}
                  </p>
                  <p className="text-xs font-semibold text-gray-500">
                    Customer: {order.customer?.name ?? "-"} - Dibuat {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <button type="button" onClick={closeOrder} className="rounded-md border-2 border-black bg-white p-1.5" aria-label="Tutup detail">
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_18rem]">
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-lg border-2 border-black bg-[#FFF7D6] p-2.5">
                      <img src={item.imageUrl} alt={item.name} className="h-16 w-16 shrink-0 rounded-md border-2 border-black object-cover" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-black">{item.name}</p>
                        <p className="text-xs font-medium text-gray-600">
                          Jumlah {item.quantity} - estimasi {item.estimatedPrice ? formatRupiah(item.estimatedPrice) : "-"}
                        </p>
                        {item.description ? <p className="text-xs text-gray-600">{item.description}</p> : null}
                        <p className="text-xs font-bold text-black">
                          Harga final: {item.finalPrice !== null ? formatRupiah(item.finalPrice) : "-"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {order.customerNote ? (
                    <p className="rounded-md border-2 border-black bg-gray-50 p-2 text-xs font-medium text-gray-700">
                      Catatan customer: {order.customerNote}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-lg border-2 border-black bg-[#F0F9FF] p-3">
                  <p className="text-xs font-bold uppercase text-gray-600">Ringkasan</p>
                  <div className="mt-2 space-y-1 text-sm font-medium text-gray-700">
                    <p>Subtotal: {order.itemSubtotal !== null ? formatRupiah(order.itemSubtotal) : "-"}</p>
                    <p>Ongkos jasa: {order.serviceFee !== null ? formatRupiah(order.serviceFee) : "-"}</p>
                    <p>Biaya platform: {order.platformFee !== null ? formatRupiah(order.platformFee) : "-"}</p>
                    <p className="border-t-2 border-black pt-1 text-base font-extrabold text-black">
                      Total: {order.totalAmount !== null ? formatRupiah(order.totalAmount) : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {order.status === "WAITING_DRIVER_PRICING" ? (
                <div className="mt-4 rounded-lg border-2 border-black bg-amber-50 p-3">
                  <p className="text-sm font-extrabold text-black">Tentukan harga</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {order.items.map((item) => (
                      <label key={item.id} className="flex flex-col gap-1 text-xs font-bold text-black">
                        {item.name}
                        <input
                          type="number"
                          min={0}
                          value={priceDraft[item.id] ?? "0"}
                          onChange={(event) =>
                            setPriceDraft((rows) => ({ ...rows, [item.id]: event.target.value }))
                          }
                          className={inputClass}
                        />
                      </label>
                    ))}
                  </div>
                  <label className="mt-2 flex max-w-xs flex-col gap-1 text-xs font-bold text-black">
                    Ongkos jasa (minimal {order.trip ? formatRupiah(order.trip.baseFee) : "tarif trip"})
                    <input
                      type="number"
                      min={0}
                      value={serviceFee}
                      onChange={(event) => setServiceFee(event.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => void submitPrice()} disabled={actionBusy} className={buttonPrimary}>
                      {actionBusy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Kirim harga
                    </button>
                    <button type="button" onClick={() => startReasonAction("reject")} disabled={actionBusy} className={buttonDanger}>
                      Tolak order
                    </button>
                  </div>
                </div>
              ) : null}

              {order.status === "WAITING_CUSTOMER_PAYMENT" ? (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border-2 border-black bg-orange-50 p-3">
                  <p className="text-sm font-bold text-black">
                    Menunggu customer membayar sebelum {formatDateTime(order.paymentDeadline)}
                  </p>
                  <button type="button" onClick={() => startReasonAction("reject")} disabled={actionBusy} className={buttonDanger}>
                    Tolak order
                  </button>
                </div>
              ) : null}

              {order.status === "PAID_HELD_IN_ESCROW" ? (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border-2 border-black bg-blue-50 p-3">
                  <p className="text-sm font-bold text-black">Dana sudah dibayar dan ditahan. Mulai perjalanan jika siap.</p>
                  <button type="button" onClick={() => void startOrderAction()} disabled={actionBusy} className={buttonPrimary}>
                    {actionBusy ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
                    Mulai perjalanan
                  </button>
                  <button type="button" onClick={() => startReasonAction("dispute")} disabled={actionBusy} className={buttonNeutral}>
                    Ajukan sengketa
                  </button>
                </div>
              ) : null}

              {order.status === "IN_TRANSIT" ? (
                <div className="mt-4 rounded-lg border-2 border-black bg-indigo-50 p-3">
                  <p className="text-sm font-extrabold text-black">Kirim bukti serah terima</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <ImageUpload
                      purpose="PROOF"
                      label="Foto bukti"
                      value={proofUrl}
                      onChange={setProofUrl}
                    />
                    <label className="flex flex-col gap-1 text-xs font-bold text-black">
                      Catatan (opsional)
                      <textarea
                        value={proofNote}
                        onChange={(event) => setProofNote(event.target.value)}
                        rows={4}
                        className="rounded-md border-2 border-black bg-white p-2 text-sm font-medium outline-none"
                        placeholder="Contoh: Diterima langsung oleh customer"
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => void deliverOrderAction()} disabled={actionBusy} className={buttonPrimary}>
                      {actionBusy ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
                      Tandai sudah diantar
                    </button>
                    <button type="button" onClick={() => startReasonAction("dispute")} disabled={actionBusy} className={buttonNeutral}>
                      Ajukan sengketa
                    </button>
                  </div>
                </div>
              ) : null}

              {order.status === "DELIVERED_PENDING_CONFIRMATION" ? (
                <p className="mt-4 rounded-md border-2 border-black bg-purple-50 p-3 text-sm font-bold text-purple-900">
                  Bukti sudah dikirim. Menunggu customer mengonfirmasi pesanan selesai.
                </p>
              ) : null}

              {order.deliveryProof ? (
                <div className="mt-4 rounded-lg border-2 border-black bg-white p-3">
                  <p className="text-sm font-extrabold text-black">Bukti terkirim</p>
                  <img
                    src={order.deliveryProof.imageUrl}
                    alt="Bukti serah terima"
                    className="mt-2 max-h-56 rounded-md border-2 border-black object-contain"
                  />
                </div>
              ) : null}

              {isClosedStatus(order.status) ? (
                <p className="mt-3 text-xs font-semibold text-gray-500">
                  Order ditutup {formatDateTime(order.closedAt ?? order.updatedAt)}
                  {order.closeReason ? ` - ${order.closeReason}` : ""}
                </p>
              ) : null}

              {reasonAction ? (
                <div className="mt-4 rounded-lg border-2 border-black bg-white p-3">
                  <label className="flex flex-col gap-1 text-xs font-bold text-black">
                    {reasonAction === "reject"
                      ? "Alasan penolakan (opsional)"
                      : "Alasan sengketa (minimal 10 karakter)"}
                    <textarea
                      value={actionReason}
                      onChange={(event) => setActionReason(event.target.value)}
                      rows={3}
                      maxLength={500}
                      className="rounded-md border-2 border-black bg-white p-3 text-sm font-medium outline-none"
                      placeholder={
                        reasonAction === "reject"
                          ? "Contoh: rute tidak sesuai"
                          : "Jelaskan masalah pesanan secara singkat"
                      }
                    />
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (reasonAction === "reject") void submitRejectOrderAction();
                        else void submitDisputeOrderAction();
                      }}
                      disabled={actionBusy}
                      className={reasonAction === "reject" ? buttonDanger : buttonPrimary}
                    >
                      {actionBusy ? <Loader2 size={16} className="animate-spin" /> : null}
                      {reasonAction === "reject" ? "Kirim penolakan" : "Kirim sengketa"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReasonAction(null);
                        setActionReason("");
                      }}
                      disabled={actionBusy}
                      className={buttonNeutral}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : null}

              {orderError ? (
                <p className="mt-3 rounded-md border-2 border-red-500 bg-red-50 p-2 text-sm font-bold text-red-700">
                  {orderError}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <section id="postingan-terbuka" className="scroll-mt-28 space-y-3 md:scroll-mt-32">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-black">Postingan terbuka</h2>
          <button type="button" onClick={() => void loadOpenRequests()} className={buttonNeutral} disabled={loadingRequests}>
            <RefreshCw size={15} className={loadingRequests ? "animate-spin" : ""} />
            Muat ulang
          </button>
        </div>
        {openRequestsError ? (
          <p className="rounded-lg border-2 border-red-500 bg-red-50 p-3 text-sm font-bold text-red-700">{openRequestsError}</p>
        ) : null}
        {openRequests.length === 0 && !loadingRequests ? (
          <div className={cardClass}>
            <p className="text-sm font-bold text-gray-700">Belum ada postingan terbuka.</p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {openRequests.map((request) => (
              <article key={request.id} className={cardClass}>
                <p className="text-xs font-extrabold uppercase text-gray-500">{serviceLabel(request.serviceType)}</p>
                <h3 className="mt-1 flex items-center gap-1 text-lg font-extrabold text-black">
                  <MapPin size={17} />
                  {request.originCity} ke {request.destCity}
                </h3>
                <p className="mt-1 text-sm font-medium text-gray-700">{request.description}</p>
                <p className="mt-2 text-xs font-semibold text-gray-500">
                  {request.customer.name} - berlaku sampai {formatDateTime(request.expiresAt)}
                </p>
                <button
                  type="button"
                  onClick={() => void claimRequest(request)}
                  disabled={actionBusy}
                  className={`${buttonPrimary} mt-3`}
                >
                  <CheckCircle2 size={16} />
                  Klaim postingan
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border-[3px] border-black bg-[#E0F2FE] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p className="flex items-center gap-2 text-sm font-extrabold text-black">
          <WalletIcon size={17} />
          Tips: dana order masuk ke dompet setelah customer menekan pesanan selesai.
        </p>
      </section>
    </div>
  );
}
