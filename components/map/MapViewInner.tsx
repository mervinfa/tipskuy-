"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

export type MapPoint = { lat: number; lng: number };

const icon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapFocus({
  origin,
  destination,
  zoom,
}: {
  origin: MapPoint | null;
  destination: MapPoint | null;
  zoom: number;
}) {
  const map = useMap();
  const originLat = origin?.lat ?? null;
  const originLng = origin?.lng ?? null;
  const destinationLat = destination?.lat ?? null;
  const destinationLng = destination?.lng ?? null;

  useEffect(() => {
    if (
      originLat !== null &&
      originLng !== null &&
      destinationLat !== null &&
      destinationLng !== null &&
      (originLat !== destinationLat || originLng !== destinationLng)
    ) {
      map.fitBounds(L.latLngBounds([originLat, originLng], [destinationLat, destinationLng]), {
        padding: [32, 32],
        maxZoom: 12,
      });
      return;
    }
    const focusLat = destinationLat ?? originLat;
    const focusLng = destinationLng ?? originLng;
    if (focusLat !== null && focusLng !== null) {
      map.flyTo([focusLat, focusLng], zoom, { duration: 1.2 });
    }
  }, [originLat, originLng, destinationLat, destinationLng, zoom, map]);

  return null;
}

export default function MapViewInner({
  origin,
  destination,
  zoom = 11,
}: {
  origin: MapPoint | null;
  destination: MapPoint | null;
  zoom?: number;
}) {
  return (
    <MapContainer
      center={[-2.5, 118]}
      zoom={5}
      scrollWheelZoom
      className="z-0 h-80 w-full overflow-hidden rounded-md border-2 border-black"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {origin && <Marker position={[origin.lat, origin.lng]} icon={icon} />}
      {destination && <Marker position={[destination.lat, destination.lng]} icon={icon} />}
      <MapFocus origin={origin} destination={destination} zoom={zoom} />
    </MapContainer>
  );
}
