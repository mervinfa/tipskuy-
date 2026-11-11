"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { apiErrorMessage, apiGet, apiSend } from "@/components/app/api";
import { formatDateTime, serviceLabel } from "@/components/app/format";
import { ImageUpload } from "@/components/app/ImageUpload";
import { EMPTY_CITY, isCityReady, RegionSelect } from "@/components/app/RegionSelect";
import { ChatModal } from "@/components/chat/ChatModal";
import { MapView, toMapPoint } from "@/components/map/MapView";
import { useMe } from "@/components/app/useMe";
import type { CityValue, OrderDetail, ServiceType, Trip } from "@/components/app/types";
import { formatRupiah } from "@/lib/format";

type TripPage = { items: Trip[]; page: number; pageSize: number; total: number };
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

const cardClass =
  "rounded-xl border-[3px] border-black bg-white p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] md:p-5";
const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#B7FF8E] px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-60";
const buttonNeutral =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-60";

export function CariDriverApp() {
  const router = useRouter();
  const { me, loading: loadingMe } = useMe();
  const [origin, setOrigin] = useState<CityValue>(EMPTY_CITY);
  const [destination, setDestination] = useState<CityValue>(EMPTY_CITY);
  const [serviceType, setServiceType] = useState<ServiceType | "">("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [tripError, setTripError] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [chatTarget, setChatTarget] = useState<{
    tripId?: string;
    orderId?: string;
    title: string;
  } | null>(null);
  const [contacts, setContacts] = useState<
    Record<string, { driverName: string; whatsappNumber: string }>
  >({});
  const [contactLoading, setContactLoading] = useState<string | null>(null);

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

  useEffect(() => {
    if (me?.role !== "CUSTOMER") return;
    void loadTrips();
  }, [me, loadTrips]);

  async function loadContact(trip: Trip) {
    if (contacts[trip.id] || contactLoading === trip.id) return;
    setContactLoading(trip.id);
    setTripError(null);
    try {
      const data = await apiGet<{ driverName: string; whatsappNumber: string }>(
        `/api/trips/${trip.id}/contact`
      );
      setContacts((rows) => ({ ...rows, [trip.id]: data }));
    } catch (error) {
      setTripError(apiErrorMessage(error));
    } finally {
      setContactLoading(null);
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
        <h2 className="text-xl font-extrabold text-black md:text-2xl">Masuk untuk mencari driver</h2>
        <p className="mt-2 text-sm font-medium text-gray-600">
          Pencarian trip dan pembuatan order memerlukan akun customer.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
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
        <h2 className="text-xl font-extrabold text-black md:text-2xl">
          Akun ini terdaftar sebagai driver
        </h2>
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
      <section className="rounded-xl border-[3px] border-black bg-[#A5F3FC] p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-black md:text-3xl">Cari Driver Tipskuy</h1>
            <p className="mt-1 text-sm font-medium text-gray-700">
              Pilih rute, lihat trip aktif, lalu kirim permintaan titipan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/caridriver/pesanan" className={buttonNeutral}>
              Pesanan saya
            </Link>
            <Link href="/caridriver/postingan" className={buttonNeutral}>
              Postingan terbuka
            </Link>
          </div>
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
          <h2 className="text-xl font-extrabold text-black md:text-2xl">Trip aktif</h2>
          <button
            type="button"
            onClick={() => void loadTrips()}
            className={buttonNeutral}
            disabled={loadingTrips}
          >
            <RefreshCw size={15} className={loadingTrips ? "animate-spin" : ""} />
            Muat ulang
          </button>
        </div>

        {tripError ? (
          <p className="rounded-lg border-2 border-red-500 bg-red-50 p-3 text-sm font-bold text-red-700">
            {tripError}
          </p>
        ) : null}

        {!loadingTrips && trips.length === 0 ? (
          <div className={cardClass}>
            <p className="text-sm font-bold text-gray-700">Belum ada trip aktif untuk filter ini.</p>
            <p className="mt-1 text-xs font-medium text-gray-500">
              Coba kosongkan filter atau tunggu driver membuka trip baru.
            </p>
            <Link href="/caridriver/postingan" className={`${buttonNeutral} mt-3`}>
              Buat postingan terbuka
            </Link>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {trips.map((trip) => {
            const contact = contacts[trip.id];
            const loadingContact = contactLoading === trip.id;
            return (
              <article key={trip.id} className={`${cardClass} flex h-full flex-col`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500">
                      {serviceLabel(trip.serviceType)}
                    </p>
                    <h3 className="mt-1 flex items-start gap-1 text-lg font-extrabold text-black md:text-xl">
                      <MapPin size={18} className="mt-1 shrink-0" />
                      <span className="break-words">
                        {trip.originCity} ke {trip.destCity}
                      </span>
                    </h3>
                  </div>
                  <p className="shrink-0 text-right text-lg font-extrabold text-black">
                    {formatRupiah(trip.baseFee)}
                  </p>
                </div>

                <div className="mt-3 space-y-2 text-sm font-medium text-gray-700">
                  <p className="flex items-start gap-2">
                    <Truck size={15} className="mt-1 shrink-0" />
                    <span>
                      {trip.driver?.name ?? "Driver"} - {trip.driver?.vehicleType ?? "Kendaraan"}
                      {trip.driver?.verified ? (
                        <span className="ml-1 font-bold text-green-700">Terverifikasi</span>
                      ) : null}
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Clock size={15} className="mt-1 shrink-0" />
                    <span>Berangkat {formatDateTime(trip.departureAt ?? trip.createdAt)}</span>
                  </p>
                </div>

                <div className="mt-3 min-h-16 rounded-md border-2 border-black bg-white p-2.5">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-gray-600">
                    Catatan driver
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold text-black">
                    {trip.notes?.trim() ? trip.notes : "Belum ada catatan dari driver."}
                  </p>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedTrip(trip)}
                    className={`${buttonPrimary} col-span-2 w-full`}
                  >
                    <Package size={16} />
                    Titip lewat trip ini
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setChatTarget({
                        tripId: trip.id,
                        title: `Chat dengan ${trip.driver?.name ?? "driver"}`,
                      })
                    }
                    className={`${buttonNeutral} w-full`}
                  >
                    <MessageCircle size={16} />
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => void loadContact(trip)}
                    disabled={loadingContact}
                    className={`${buttonNeutral} w-full`}
                  >
                    {loadingContact ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <MessageCircle size={16} />
                    )}
                    WhatsApp
                  </button>
                </div>

                {contact ? (
                  <div className="mt-2 rounded-md border-2 border-black bg-[#DCFCE7] p-2 text-xs font-bold text-black">
                    <p>
                      WhatsApp {contact.driverName}: {contact.whatsappNumber}
                    </p>
                    <a
                      href={`https://wa.me/${contact.whatsappNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block underline"
                    >
                      Buka WhatsApp
                    </a>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      {selectedTrip ? (
        <OrderCreateForm
          trip={selectedTrip}
          onCancel={() => setSelectedTrip(null)}
          onCreated={(created) => {
            setSelectedTrip(null);
            router.push(`/caridriver/pesanan?order=${encodeURIComponent(created.id)}`);
          }}
        />
      ) : null}

      {chatTarget ? (
        <ChatModal
          open
          onClose={() => setChatTarget(null)}
          title={chatTarget.title}
          start={
            chatTarget.tripId ? { tripId: chatTarget.tripId } : { orderId: chatTarget.orderId }
          }
        />
      ) : null}
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
    if (
      parsedItems.some(
        (item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20
      )
    ) {
      setError("Jumlah barang harus 1 sampai 20");
      return;
    }
    if (
      parsedItems.some(
        (item) =>
          item.estimatedPrice !== undefined &&
          (!Number.isInteger(item.estimatedPrice) || item.estimatedPrice < 0)
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
          <h2 className="text-xl font-extrabold text-black md:text-2xl">Form titipan</h2>
          <p className="text-sm font-medium text-gray-600">
            {trip.originCity} ke {trip.destCity} - tarif jasa mulai {formatRupiah(trip.baseFee)}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border-2 border-black bg-white p-1.5"
          aria-label="Tutup"
        >
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
                  className="h-10 rounded-md border-2 border-black bg-white px-3 text-sm font-medium text-black outline-none placeholder:text-gray-500"
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
                  className="h-10 rounded-md border-2 border-black bg-white px-3 text-sm font-medium text-black outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-black">
                Perkiraan harga per barang (opsional)
                <input
                  type="number"
                  min={0}
                  value={item.estimatedPrice}
                  onChange={(event) => updateItem(item.key, { estimatedPrice: event.target.value })}
                  className="h-10 rounded-md border-2 border-black bg-white px-3 text-sm font-medium text-black outline-none placeholder:text-gray-500"
                  placeholder="Contoh: 60000"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-black">
                Catatan barang (opsional)
                <input
                  value={item.description}
                  onChange={(event) => updateItem(item.key, { description: event.target.value })}
                  className="h-10 rounded-md border-2 border-black bg-white px-3 text-sm font-medium text-black outline-none placeholder:text-gray-500"
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
            className="rounded-md border-2 border-black bg-white p-3 text-sm font-medium text-black outline-none placeholder:text-gray-500"
            placeholder="Contoh: Tolong belikan yang kemasan besar"
          />
        </label>

        {error ? (
          <p className="rounded-md border-2 border-red-500 bg-red-50 p-2 text-sm font-bold text-red-700">
            {error}
          </p>
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
