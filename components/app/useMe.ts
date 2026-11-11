"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, isUnauthenticated } from "./api";
import type { Me } from "./types";

const ME_CHANGED_EVENT = "tipskuy:me-changed";

export function notifyMeChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ME_CHANGED_EVENT));
  }
}

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Me>("/api/me");
      setMe(data);
    } catch (err) {
      if (isUnauthenticated(err)) {
        setMe(null);
      } else {
        setError(err instanceof Error ? err.message : "Gagal memuat sesi");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const handler = () => {
      void refresh();
    };
    window.addEventListener(ME_CHANGED_EVENT, handler);
    return () => window.removeEventListener(ME_CHANGED_EVENT, handler);
  }, [refresh]);

  return { me, loading, error, refresh };
}
