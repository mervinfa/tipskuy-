"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { apiErrorMessage, apiGet, apiSend, isUnauthenticated } from "@/components/app/api";
import { formatDateTime, isClosedStatus, serviceLabel } from "@/components/app/format";
import { ImageUpload } from "@/components/app/ImageUpload";
import { EMPTY_CITY, isCityReady, RegionSelect } from "@/components/app/RegionSelect";
import { StatusBadge } from "@/components/app/StatusBadge";
import { MapView, toMapPoint } from "@/components/map/MapView";
import { useMe } from "@/components/app/useMe";
import type {
  CityValue,
  OpenRequest,
  OrderDetail,
  OrderListItem,
  ServiceType,
  Trip,
} from "@/components/app/types";
import { useCountdown } from "@/hooks/useCountdown";
import { formatRupiah } from "@/lib/format";

type TripPage = { items: Trip[]; page: number; pageSize: number; total: number };
type OrderPage = { items: OrderListItem[]; nextCursor: string | null };
type DraftItem = {
  key: string;
  name: string;
  description: string;
  quantity: string;
  estimatedPrice: string;
  imageUrl: string;
};

function newDraftItem(): DraftItem {
  return {
    key: crypto.randomUUID(),
    name: "",
    description: "",
    quantity: "1",
    estimatedPrice: "",
    imageUrl: "",
  };
}

const cardClass = "rounded-xl border-[3px] border-black bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]";
const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#B7FF8E] px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-60";
const buttonNeutral =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-60";
const buttonDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-red-400 px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-60";

export function CariDriverApp() {
  const { me, loading: loadingMe } = useMe();
  const [origin, setOrigin] = useState<CityValue>(EMPTY_CITY);
  const [destination, setDestination] = useState<CityValue>(EMPTY_CITY);
  const [serviceType, setServiceType] = useState<ServiceType | "">("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [tripError, setTripError] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    setLoadingTrips(true);
    setTripError(null);
    try {
      const params = new URLSearchParams();
      if (isCityReady(origin)) params.set("originCityCode", origin.cityCode);
      if (isCityReady(destination)) params.set("destCityCode", destination.cityCode);
      if (serviceType) params.set("serviceType", serviceType);
      const data = await apiGet<TripPage>(`/api/trips?${params.toString()}`);
      setTrips(data.items);
    } catch (error) {
      setTripError(apiErrorMessage(error));
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }, [origin, destination, serviceType]);

  const loadOrders = useCallback(async () => {
    if (!me || me.role !== "CUSTOMER") return;
    try {
      const data = await apiGet<OrderPage>("/api/orders?role=customer&limit=20");
      setOrders(data.items);
    } catch (error) {
      if (!isUnauthenticated(error)) console.error("Gagal memuat order", error);
    }
  }, [me]);

  const loadOrder = useCallback(
    async (silent = false) => {
      if (!orderId) {
        setOrder(null);
        return;
      }
      if (!silent) setLoadingOrder(true);
      setOrderError(null);
      try {
        const data = await apiGet<OrderDetail>(`/api/orders/${orderId}`);
        setOrder(data);
      } catch (error) {
        setOrderError(apiErrorMessage(error));
      } finally {
        if (!silent) setLoadingOrder(false);
      }
    },
    [orderId]
  );

  useEffect(() => {
    if (me?.role !== "CUSTOMER") return;
    void loadTrips();
  }, [me, loadTrips]);

  useEffect(() => {
    if (me?.role !== "CUSTOMER") return;
    void loadOrders();
    const timer = window.setInterval(() => {
      void loadOrders();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [me, loadOrders]);

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

  function openOrder(id: string) {
    setOrderId(id);
    setOrder(null);
    window.history.replaceState(null, "", `/caridriver?order=${encodeURIComponent(id)}`);
    window.setTimeout(() => {
      document.getElementById("order-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function closeOrder() {
    setOrderId(null);
    setOrder(null);
    setOrderError(null);
    window.history.replaceState(null, "", "/caridriver");
  }

  async function refreshOrder() {
    await Promise.all([loadOrder(true), loadOrders()]);
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
        <h2 className="text-2xl font-extrabold text-black">Masuk untuk mencari driver</h2>
        <p className="mt-2 text-sm font-medium text-gray-600">
          Pencarian trip dan pembuatan order memerlukan akun customer.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/auth/login" className={buttonPrimary}>
            Login
          </Link>
          <Link href="/auth/register" className={buttonNeutral}>
            Register
          </Link>
        </div>
      </div>
    );
  }

  if (me.role === "DRIVER") {
    return (
      <div className={cardClass}>
        <h2 className="text-2xl font-extrabold text-black">Akun ini terdaftar sebagai driver</h2>
        <p className="mt-2 text-sm font-medium text-gray-600">
          Kelola trip, order masuk, dan dompet dari dashboard driver.
        </p>
        <Link href="/driver" className={`${buttonPrimary} mt-4`}>
          Buka Dashboard Driver
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border-[3px] border-black bg-[#A5F3FC] p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-black">Cari Driver Tipskuy</h1>
            <p className="mt-1 text-sm font-medium text-gray-700">
              Pilih rute, lihat trip aktif, lalu kirim permintaan titipan.
            </p>
          </div>
          <Link href="/#contact" className={buttonNeutral}>
            Butuh bantuan?
          </Link>
        </div>

        <form
          className="mt-6 grid gap-4 lg:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            void loadTrips();
          }}
        >
          <RegionSelect label="Kota asal" value={origin} onChange={setOrigin} />
          <RegionSelect label="Kota tujuan" value={destination} onChange={setDestination} />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-extrabold text-black">Jenis layanan</span>
            <select
              value={serviceType}
              onChange={(event) => setServiceType(event.target.value as ServiceType | "")}
              className="h-11 w-full rounded-md border-2 border-black bg-white px-3 text-sm font-medium text-black outline-none focus:border-[#FF9B51]"
            >
              <option value="">Semua layanan</option>
              <option value="JASTIP">Jasa Titip</option>
              <option value="ANTAR_JEMPUT">Antar Jemput</option>
            </select>
            <button type="submit" className={buttonPrimary} disabled={loadingTrips}>
              {loadingTrips ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Cari trip
            </button>
          </div>
          <div className="lg:col-span-3">
            <MapView
              origin={toMapPoint(origin)}
              destination={toMapPoint(destination)}
              zoom={destination.zoom ?? origin.zoom ?? 11}
            />
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-black">Trip aktif</h2>
          <button type="button" onClick={() => void loadTrips()} className={buttonNeutral} disabled={loadingTrips}>
            <RefreshCw size={15} className={loadingTrips ? "animate-spin" : ""} />
            Muat ulang
          </button>
        </div>

        {tripError ? (
          <p className="rounded-lg border-2 border-red-500 bg-red-50 p-3 text-sm font-bold text-red-700">{tripError}</p>
        ) : null}

        {!loadingTrips && trips.length === 0 ? (
          <div className={cardClass}>
            <p className="text-sm font-bold text-gray-700">Belum ada trip aktif untuk filter ini.</p>
            <p className="mt-1 text-xs font-medium text-gray-500">
              Coba kosongkan filter atau tunggu driver membuka trip baru.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {trips.map((trip) => (
            <article key={trip.id} className={cardClass}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500">
                    {serviceLabel(trip.serviceType)}
                  </p>
                  <h3 className="mt-1 flex items-center gap-1 text-xl font-extrabold text-black">
                    <MapPin size={18} />
                    {trip.originCity} ke {trip.destCity}
                  </h3>
                </div>
                <p className="text-right text-lg font-extrabold text-black">{formatRupiah(trip.baseFee)}</p>
              </div>

              <div className="mt-3 space-y-1 text-sm font-medium text-gray-700">
                <p className="flex items-center gap-2">
                  <Truck size={15} />
                  {trip.driver?.name ?? "Driver"} - {trip.driver?.vehicleType ?? "Kendaraan"}
                  {trip.driver?.verified ? <span className="font-bold text-green-700">Terverifikasi</span> : null}
                </p>
                <p className="flex items-center gap-2">
                  <Clock size={15} />
                  Berangkat {formatDateTime(trip.departureAt)}
                </p>
                {trip.notes ? <p className="text-xs text-gray-600">{trip.notes}</p> : null}
              </div>

              <button type="button" onClick={() => setSelectedTrip(trip)} className={`${buttonPrimary} mt-4 w-full`}>
                <Package size={16} />
                Titip lewat trip ini
              </button>
            </article>
          ))}
        </div>
      </section>

      {selectedTrip ? (
        <OrderCreateForm
          trip={selectedTrip}
          onCancel={() => setSelectedTrip(null)}
          onCreated={(created) => {
            setSelectedTrip(null);
            setOrders((rows) => [
              {
                id: created.id,
                status: created.status,
                tripId: created.tripId,
                openRequestId: created.openRequestId,
                itemSubtotal: created.itemSubtotal,
                serviceFee: created.serviceFee,
                platformFee: created.platformFee,
                totalAmount: created.totalAmount,
                pricedAt: created.pricedAt,
                paymentDeadline: created.paymentDeadline,
                closedAt: created.closedAt,
                closeReason: created.closeReason,
                createdAt: created.createdAt,
                updatedAt: created.updatedAt,
                _count: { items: created.items.length },
                customer: created.customer ?? { id: me.id, name: me.name },
                driver: created.driver ?? {
                  id: "",
                  user: { id: "", name: selectedTrip.driver?.name ?? "Driver" },
                },
              },
              ...rows,
            ]);
            openOrder(created.id);
          }}
        />
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-black">Pesanan saya</h2>
          <button type="button" onClick={() => void loadOrders()} className={buttonNeutral}>
            <RefreshCw size={15} />
            Muat ulang
          </button>
        </div>

        {orders.length === 0 ? (
          <div className={cardClass}>
            <p className="text-sm font-bold text-gray-700">Belum ada pesanan.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {orders.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openOrder(item.id)}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-[3px] border-black bg-white p-4 text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
              >
                <div>
                  <p className="text-xs font-bold text-gray-500">{formatDateTime(item.createdAt)}</p>
                  <p className="mt-1 text-base font-extrabold text-black">
                    {item.tripId ? `Order ${item.id.slice(-6)}` : `Postingan ${item.id.slice(-6)}`}
                  </p>
                  <p className="text-xs font-medium text-gray-600">
                    {item._count.items} barang - {item.driver?.user.name ?? "Driver"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-black">
                      {item.totalAmount ? formatRupiah(item.totalAmount) : "Menunggu harga"}
                    </p>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {orderId ? (
        <section id="order-panel" className="scroll-mt-28">
          {loadingOrder && !order ? (
            <div className={`${cardClass} flex items-center gap-2 text-sm font-bold`}>
              <Loader2 size={16} className="animate-spin" /> Memuat order...
            </div>
          ) : order ? (
            <CustomerOrderPanel
              order={order}
              onClose={closeOrder}
              onRefresh={refreshOrder}
              onError={setOrderError}
            />
          ) : null}
          {orderError ? (
            <p className="mt-3 rounded-lg border-2 border-red-500 bg-red-50 p-3 text-sm font-bold text-red-700">
              {orderError}
            </p>
          ) : null}
        </section>
      ) : null}

      <OpenRequestForm origin={origin} destination={destination} serviceType={serviceType} />
    </div>
  );
}

function OrderCreateForm({
  trip,
  onCancel,
  onCreated,
}: {
  trip: Trip;
  onCancel: () => void;
  onCreated: (order: OrderDetail) => void;
}) {
  const [items, setItems] = useState<DraftItem[]>([newDraftItem()]);
  const [customerNote, setCustomerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(key: string, patch: Partial<DraftItem>) {
    setItems((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsedItems = items.map((item) => {
      const quantity = Number(item.quantity);
      const estimatedPrice = item.estimatedPrice.trim() === "" ? undefined : Number(item.estimatedPrice);
      return {
        name: item.name.trim(),
        ...(item.description.trim() ? { description: item.description.trim() } : {}),
        imageUrl: item.imageUrl,
        quantity,
        ...(estimatedPrice !== undefined ? { estimatedPrice } : {}),
      };
    });

    if (parsedItems.some((item) => !item.name || !item.imageUrl)) {
      setError("Nama dan foto setiap barang wajib diisi");
      return;
    }
    if (parsedItems.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)) {
      setError("Jumlah barang harus 1 sampai 20");
      return;
    }
    if (
      parsedItems.some(
        (item) => item.estimatedPrice !== undefined && (!Number.isInteger(item.estimatedPrice) || item.estimatedPrice < 0)
      )
    ) {
      setError("Perkiraan harga harus bilangan bulat Rupiah");
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiSend<OrderDetail>("/api/orders", "POST", {
        tripId: trip.id,
        ...(customerNote.trim() ? { customerNote: customerNote.trim() } : {}),
        items: parsedItems,
      });
      onCreated(created);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-black">Form titipan</h2>
          <p className="text-sm font-medium text-gray-600">
            {trip.originCity} ke {trip.destCity} - tarif jasa mulai {formatRupiah(trip.baseFee)}
          </p>
        </div>
        <button type="button" onClick={onCancel} className="rounded-md border-2 border-black bg-white p-1.5" aria-label="Tutup">
          <X size={16} />
        </button>
      </div>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        {items.map((item, index) => (
          <div key={item.key} className="rounded-lg border-2 border-black bg-[#FFF7D6] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-extrabold text-black">Barang {index + 1}</p>
              {items.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setItems((rows) => rows.filter((row) => row.key !== item.key))}
                  className="rounded-md border-2 border-black bg-red-300 p-1"
                  aria-label="Hapus barang"
                >
                  <Trash2 size={14} />
                </button>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-bold text-black">
                Nama barang
                <input
                  required
                  value={item.name}
                  onChange={(event) => updateItem(item.key, { name: event.target.value })}
                  className="h-10 rounded-md border-2 border-black bg-white px-3 text-sm font-medium outline-none"
                  placeholder="Contoh: Bakpia Pathok 25"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-black">
                Jumlah
                <input
                  required
                  type="number"
                  min={1}
                  max={20}
                  value={item.quantity}
                  onChange={(event) => updateItem(item.key, { quantity: event.target.value })}
                  className="h-10 rounded-md border-2 border-black bg-white px-3 text-sm font-medium outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-black">
                Perkiraan harga per barang (opsional)
                <input
                  type="number"
                  min={0}
                  value={item.estimatedPrice}
                  onChange={(event) => updateItem(item.key, { estimatedPrice: event.target.value })}
                  className="h-10 rounded-md border-2 border-black bg-white px-3 text-sm font-medium outline-none"
                  placeholder="Contoh: 60000"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-black">
                Catatan barang (opsional)
                <input
                  value={item.description}
                  onChange={(event) => updateItem(item.key, { description: event.target.value })}
                  className="h-10 rounded-md border-2 border-black bg-white px-3 text-sm font-medium outline-none"
                  placeholder="Rasa, ukuran, warna"
                />
              </label>
            </div>

            <div className="mt-3 max-w-xs">
              <ImageUpload
                purpose="ITEM"
                label={`Foto barang ${index + 1}`}
                value={item.imageUrl}
                onChange={(url) => updateItem(item.key, { imageUrl: url })}
              />
            </div>
          </div>
        ))}

        {items.length < 10 ? (
          <button
            type="button"
            onClick={() => setItems((rows) => [...rows, newDraftItem()])}
            className={buttonNeutral}
          >
            <Plus size={15} />
            Tambah barang
          </button>
        ) : null}

        <label className="flex flex-col gap-1 text-xs font-bold text-black">
          Catatan untuk driver (opsional)
          <textarea
            value={customerNote}
            onChange={(event) => setCustomerNote(event.target.value)}
            rows={3}
            className="rounded-md border-2 border-black bg-white p-3 text-sm font-medium outline-none"
            placeholder="Contoh: Tolong belikan yang kemasan besar"
          />
        </label>

        {error ? (
          <p className="rounded-md border-2 border-red-500 bg-red-50 p-2 text-sm font-bold text-red-700">{error}</p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={submitting} className={buttonPrimary}>
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
            {submitting ? "Mengirim..." : "Kirim permintaan titipan"}
          </button>
          <button type="button" onClick={onCancel} className={buttonNeutral}>
            Batal
          </button>
        </div>
      </form>
    </section>
  );
}

function CustomerOrderPanel({
  order,
  onClose,
  onRefresh,
  onError,
}: {
  order: OrderDetail;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onError: (message: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<"QRIS" | "VIRTUAL_ACCOUNT" | "MOCK_TRANSFER">("QRIS");
  const [contact, setContact] = useState<{ driverName: string; whatsappNumber: string } | null>(null);
  const [actionMode, setActionMode] = useState<"reject" | "dispute" | "complete" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const idemRef = useRef(crypto.randomUUID());
  const countdown = useCountdown(order.paymentDeadline, order.serverTime ?? null, () => {
    void onRefresh();
  });

  useEffect(() => {
    idemRef.current = crypto.randomUUID();
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

  async function pay() {
    await run(() =>
      apiSend(`/api/orders/${order.id}/pay`, "POST", {
        method,
        idempotencyKey: idemRef.current,
      })
    );
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
  const canReject = order.status === "WAITING_DRIVER_PRICING" || order.status === "WAITING_CUSTOMER_PAYMENT";
  const canDispute = ["PAID_HELD_IN_ESCROW", "IN_TRANSIT", "DELIVERED_PENDING_CONFIRMATION"].includes(order.status);

  return (
    <div className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-extrabold text-black">Detail pesanan</h2>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm font-medium text-gray-600">
            {order.trip ? `${order.trip.originCity} ke ${order.trip.destCity}` : "Order dari postingan terbuka"}
          </p>
          <p className="text-xs font-semibold text-gray-500">
            Driver: {order.driver?.user.name ?? "-"} - Dibuat {formatDateTime(order.createdAt)}
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md border-2 border-black bg-white p-1.5" aria-label="Tutup detail">
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3 rounded-lg border-2 border-black bg-[#FFF7D6] p-2.5">
              <img src={item.imageUrl} alt={item.name} className="h-20 w-20 shrink-0 rounded-md border-2 border-black object-cover" />
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
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border-2 border-black bg-orange-50 p-3">
          <label className="flex flex-col gap-1 text-xs font-bold text-black">
            Metode pembayaran
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value as typeof method)}
              className="h-10 rounded-md border-2 border-black bg-white px-3 text-sm font-medium"
            >
              <option value="QRIS">QRIS</option>
              <option value="VIRTUAL_ACCOUNT">Virtual Account</option>
              <option value="MOCK_TRANSFER">Transfer mock</option>
            </select>
          </label>
          <button type="button" onClick={() => void pay()} disabled={busy || !canPay} className={buttonPrimary}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            Bayar sekarang
          </button>
          {!canPay ? <p className="text-xs font-bold text-red-700">Waktu pembayaran habis. Muat ulang status.</p> : null}
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
                className="rounded-md border-2 border-black bg-white p-3 text-sm font-medium outline-none"
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

function OpenRequestForm({
  origin,
  destination,
  serviceType,
}: {
  origin: CityValue;
  destination: CityValue;
  serviceType: ServiceType | "";
}) {
  const [originValue, setOriginValue] = useState(origin);
  const [destinationValue, setDestinationValue] = useState(destination);
  const [service, setService] = useState<ServiceType>(serviceType || "JASTIP");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOriginValue(origin);
  }, [origin]);

  useEffect(() => {
    setDestinationValue(destination);
  }, [destination]);

  useEffect(() => {
    if (serviceType) setService(serviceType);
  }, [serviceType]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!isCityReady(originValue) || !isCityReady(destinationValue)) {
      setError("Pilih kota asal dan kota tujuan");
      return;
    }
    setSubmitting(true);
    try {
      await apiSend<OpenRequest>("/api/open-requests", "POST", {
        serviceType: service,
        originCityCode: originValue.cityCode,
        destCityCode: destinationValue.cityCode,
        description: description.trim(),
        ...(imageUrl ? { imageUrl } : {}),
      });
      setDescription("");
      setImageUrl("");
      setMessage("Postingan terbuka dibuat. Driver dapat melihat dan mengklaimnya.");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={cardClass}>
      <h2 className="text-2xl font-extrabold text-black">Postingan terbuka</h2>
      <p className="mt-1 text-sm font-medium text-gray-600">
        Tidak menemukan trip yang cocok? Buat permintaan terbuka agar driver menghubungi Anda.
      </p>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div className="grid gap-4 lg:grid-cols-3">
          <RegionSelect label="Kota asal" value={originValue} onChange={setOriginValue} />
          <RegionSelect label="Kota tujuan" value={destinationValue} onChange={setDestinationValue} />
          <label className="flex flex-col gap-2 text-sm font-extrabold text-black">
            Jenis layanan
            <select
              value={service}
              onChange={(event) => setService(event.target.value as ServiceType)}
              className="h-11 rounded-md border-2 border-black bg-white px-3 text-sm font-medium"
            >
              <option value="JASTIP">Jasa Titip</option>
              <option value="ANTAR_JEMPUT">Antar Jemput</option>
            </select>
          </label>
        </div>
        <MapView
          origin={toMapPoint(originValue)}
          destination={toMapPoint(destinationValue)}
          zoom={destinationValue.zoom ?? originValue.zoom ?? 11}
        />
        <label className="flex flex-col gap-1 text-xs font-bold text-black">
          Deskripsi kebutuhan
          <textarea
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={500}
            className="rounded-md border-2 border-black bg-white p-3 text-sm font-medium outline-none"
            placeholder="Contoh: Tolong belikan oleh-oleh khas Pekalongan maksimal 2 kg"
          />
        </label>
        <div className="max-w-xs">
          <ImageUpload
            purpose="ITEM"
            label="Foto barang (opsional)"
            value={imageUrl}
            onChange={setImageUrl}
          />
        </div>
        {message ? (
          <p className="rounded-md border-2 border-green-700 bg-green-50 p-2 text-sm font-bold text-green-800">{message}</p>
        ) : null}
        {error ? (
          <p className="rounded-md border-2 border-red-500 bg-red-50 p-2 text-sm font-bold text-red-700">{error}</p>
        ) : null}
        <button type="submit" disabled={submitting} className={buttonPrimary}>
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Buat postingan
        </button>
      </form>
    </section>
  );
}
