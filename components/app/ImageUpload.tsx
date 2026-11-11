"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { apiErrorMessage, apiUpload } from "./api";

export function ImageUpload({
  purpose,
  value,
  onChange,
  label,
  hint,
}: {
  purpose: "ITEM" | "PROOF";
  value: string;
  onChange: (url: string) => void;
  label: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran berkas maksimum 5 MB");
      return;
    }
    const form = new FormData();
    form.set("file", file);
    form.set("purpose", purpose);
    setUploading(true);
    try {
      const result = await apiUpload<{ url: string; key: string }>("/api/uploads", form);
      onChange(result.url);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-extrabold text-black">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      {value ? (
        <div className="relative overflow-hidden rounded-lg border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <img src={value} alt={label} className="h-32 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-md border-2 border-black bg-red-500 p-1 text-white"
            aria-label="Hapus gambar"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex h-28 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-black bg-white text-sm font-bold text-black transition-colors hover:bg-[#FFF7D6] disabled:opacity-60"
        >
          {uploading ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} />}
          {uploading ? "Mengunggah..." : "Pilih gambar"}
        </button>
      )}
      <p className="text-xs font-medium text-gray-600">{hint ?? "JPG, PNG, atau WebP. Maksimum 5 MB."}</p>
      {error ? <p className="text-xs font-bold text-red-700">{error}</p> : null}
    </div>
  );
}
