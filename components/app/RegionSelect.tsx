"use client";

import { useEffect, useState } from "react";
import type { CityValue } from "./types";

type Province = { code: string; name: string; lat: number; lng: number };
type City = { code: string; name: string; lat: number; lng: number };

const selectClass =
  "h-11 w-full rounded-md border-2 border-black bg-white px-3 text-sm font-medium text-black outline-none focus:border-[#FF9B51]";

export function RegionSelect({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: CityValue;
  onChange: (value: CityValue) => void;
  disabled?: boolean;
}) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/regions/provinces.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Province[]) => {
        if (active) setProvinces(data);
      })
      .catch(() => {
        if (active) setProvinces([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!value.provinceCode) return;
    const controller = new AbortController();
    async function loadCities() {
      setLoadingCities(true);
      try {
        const res = await fetch(`/regions/${value.provinceCode}.json`, { signal: controller.signal });
        const data = (res.ok ? await res.json() : []) as City[];
        setCities(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCities([]);
      } finally {
        if (!controller.signal.aborted) setLoadingCities(false);
      }
    }
    void loadCities();
    return () => controller.abort();
  }, [value.provinceCode]);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-extrabold text-black">{label}</span>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <select
          aria-label={`${label} provinsi`}
          className={selectClass}
          value={value.provinceCode}
          disabled={disabled}
          onChange={(event) => {
            const provinceCode = event.target.value;
            const province = provinces.find((item) => item.code === provinceCode);
            onChange({
              provinceCode,
              cityCode: "",
              cityName: "",
              lat: province?.lat,
              lng: province?.lng,
              zoom: 7,
            });
          }}
        >
          <option value="">Pilih provinsi</option>
          {provinces.map((province) => (
            <option key={province.code} value={province.code}>
              {province.name}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} kota`}
          className={selectClass}
          value={value.cityCode}
          disabled={disabled || !value.provinceCode || loadingCities}
          onChange={(event) => {
            const city = cities.find((item) => item.code === event.target.value);
            onChange({
              provinceCode: value.provinceCode,
              cityCode: city?.code ?? "",
              cityName: city?.name ?? "",
              lat: city?.lat,
              lng: city?.lng,
              zoom: 11,
            });
          }}
        >
          <option value="">{loadingCities ? "Memuat kota..." : "Pilih kota"}</option>
          {cities.map((city) => (
            <option key={city.code} value={city.code}>
              {city.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export const EMPTY_CITY: CityValue = { provinceCode: "", cityCode: "", cityName: "" };

export function isCityReady(value: CityValue): boolean {
  return /^\d{4}$/.test(value.cityCode);
}
