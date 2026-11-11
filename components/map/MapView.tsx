"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./MapViewInner";

export type { MapPoint } from "./MapViewInner";

export const MapView = dynamic(() => import("./MapViewInner"), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-md bg-neutral-100" />,
});

export function toMapPoint(value: { lat?: number; lng?: number }): MapPoint | null {
  if (typeof value.lat !== "number" || typeof value.lng !== "number") return null;
  return { lat: value.lat, lng: value.lng };
}
