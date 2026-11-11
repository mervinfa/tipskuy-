import type { OrderStatus, ServiceType } from "./types";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeZone: "Asia/Jakarta",
});

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return dateFormatter.format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${dateTimeFormatter.format(date)} WIB`;
}

export function serviceLabel(service: ServiceType): string {
  return service === "JASTIP" ? "Jasa Titip" : "Antar Jemput";
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT: "Draft",
  WAITING_DRIVER_PRICING: "Menunggu harga driver",
  WAITING_CUSTOMER_PAYMENT: "Menunggu pembayaran",
  PAID_HELD_IN_ESCROW: "Dibayar, dana ditahan",
  IN_TRANSIT: "Dalam perjalanan",
  DELIVERED_PENDING_CONFIRMATION: "Menunggu konfirmasi",
  COMPLETED: "Selesai",
  CANCELLED_EXPIRED: "Hangus",
  REJECTED_BY_CUSTOMER: "Ditolak customer",
  REJECTED_BY_DRIVER: "Ditolak driver",
  DISPUTED: "Sengketa",
  REFUNDED: "Dana dikembalikan",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  DRAFT: "bg-gray-200 text-gray-700",
  WAITING_DRIVER_PRICING: "bg-amber-200 text-amber-900",
  WAITING_CUSTOMER_PAYMENT: "bg-orange-200 text-orange-900",
  PAID_HELD_IN_ESCROW: "bg-blue-200 text-blue-900",
  IN_TRANSIT: "bg-indigo-200 text-indigo-900",
  DELIVERED_PENDING_CONFIRMATION: "bg-purple-200 text-purple-900",
  COMPLETED: "bg-green-200 text-green-900",
  CANCELLED_EXPIRED: "bg-red-200 text-red-900",
  REJECTED_BY_CUSTOMER: "bg-red-200 text-red-900",
  REJECTED_BY_DRIVER: "bg-red-200 text-red-900",
  DISPUTED: "bg-rose-200 text-rose-900",
  REFUNDED: "bg-gray-200 text-gray-700",
};

export function isClosedStatus(status: OrderStatus): boolean {
  return [
    "COMPLETED",
    "CANCELLED_EXPIRED",
    "REJECTED_BY_CUSTOMER",
    "REJECTED_BY_DRIVER",
    "REFUNDED",
  ].includes(status);
}
