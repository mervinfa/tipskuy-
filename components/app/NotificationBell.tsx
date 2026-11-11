"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { apiGet, apiSend, isUnauthenticated } from "./api";
import { formatDateTime } from "./format";
import type { NotificationItem, Role } from "./types";

type NotificationResponse = {
  items: NotificationItem[];
  unreadCount: number;
  nextCursor: string | null;
};

export function NotificationBell({ role }: { role: Role | null }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!role) return;
    if (typeof document !== "undefined" && document.hidden) return;
    try {
      const data = await apiGet<NotificationResponse>("/api/notifications?limit=10");
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      if (!isUnauthenticated(error)) {
        console.error("Gagal memuat notifikasi", error);
      }
    }
  }, [role]);

  useEffect(() => {
    setItems([]);
    setUnreadCount(0);
    if (!role) return;
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [role, load]);

  async function markRead(item: NotificationItem) {
    if (!item.readAt) {
      try {
        await apiSend(`/api/notifications/${item.id}/read`, "PATCH");
        setItems((rows) =>
          rows.map((row) => (row.id === item.id ? { ...row, readAt: new Date().toISOString() } : row))
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (error) {
        if (!isUnauthenticated(error)) console.error("Gagal menandai notifikasi", error);
      }
    }
    if (item.orderId && role) {
      window.location.assign(`${role === "DRIVER" ? "/driver" : "/caridriver"}?order=${item.orderId}`);
    }
  }

  async function markAll() {
    setLoading(true);
    try {
      await apiSend("/api/notifications/read-all", "PATCH");
      const now = new Date().toISOString();
      setItems((rows) => rows.map((row) => ({ ...row, readAt: row.readAt ?? now })));
      setUnreadCount(0);
    } catch (error) {
      if (!isUnauthenticated(error)) console.error("Gagal menandai semua notifikasi", error);
    } finally {
      setLoading(false);
    }
  }

  if (!role) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void load();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none"
        aria-label="Notifikasi"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-black bg-red-500 px-1 text-[10px] font-extrabold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border-[3px] border-black bg-white p-3 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-base font-extrabold text-black">Notifikasi</h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void markAll()}
                disabled={loading || unreadCount === 0}
                className="flex items-center gap-1 rounded-md border-2 border-black bg-[#B7FF8E] px-2 py-1 text-[11px] font-bold text-black disabled:opacity-50"
              >
                <CheckCheck size={13} />
                Semua
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border-2 border-black bg-white p-1"
                aria-label="Tutup notifikasi"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <p className="py-6 text-center text-sm font-medium text-gray-500">Belum ada notifikasi.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void markRead(item)}
                  className={`w-full rounded-lg border-2 border-black p-2.5 text-left transition-colors ${
                    item.readAt ? "bg-white hover:bg-gray-50" : "bg-[#FFF7D6] hover:bg-[#FEF08A]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-extrabold text-black">{item.title}</p>
                    {!item.readAt ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" /> : null}
                  </div>
                  <p className="mt-1 text-xs font-medium leading-snug text-gray-700">{item.body}</p>
                  <p className="mt-1.5 text-[10px] font-semibold text-gray-500">{formatDateTime(item.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
