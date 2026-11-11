"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { apiErrorMessage, apiSend } from "@/components/app/api";
import { ImageUpload } from "@/components/app/ImageUpload";
import { EMPTY_CITY, isCityReady, RegionSelect } from "@/components/app/RegionSelect";
import { MapView, toMapPoint } from "@/components/map/MapView";
import type { CityValue, OpenRequest, ServiceType } from "@/components/app/types";

const cardClass =
  "rounded-xl border-[3px] border-black bg-white p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] md:p-5";
const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#B7FF8E] px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-60";

export function OpenRequestForm() {
  const [originValue, setOriginValue] = useState<CityValue>(EMPTY_CITY);
  const [destinationValue, setDestinationValue] = useState<CityValue>(EMPTY_CITY);
  const [service, setService] = useState<ServiceType>("JASTIP");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <h1 className="text-2xl font-extrabold text-black md:text-3xl">Postingan terbuka</h1>
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
              className="h-11 rounded-md border-2 border-black bg-white px-3 text-sm font-medium text-black"
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
            className="rounded-md border-2 border-black bg-white p-3 text-sm font-medium text-black outline-none placeholder:text-gray-500"
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
          <p className="rounded-md border-2 border-green-700 bg-green-50 p-2 text-sm font-bold text-green-800">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md border-2 border-red-500 bg-red-50 p-2 text-sm font-bold text-red-700">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={submitting} className={buttonPrimary}>
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Buat postingan
        </button>
      </form>
    </section>
  );
}
