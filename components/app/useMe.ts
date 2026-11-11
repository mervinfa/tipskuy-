"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, isUnauthenticated } from "./api";
import type { Me } from "./types";

const ME_CHANGED_EVENT = "tipskuy:me-changed";
const CACHE_TTL_MS = 30_000;

let cachedMe: Me | null | undefined;
let cachedAt = 0;
let inflight: Promise<Me | null> | null = null;

function fetchMe(): Promise<Me | null> {
  if (!inflight) {
    inflight = apiGet<Me>("/api/me")
      .then((data) => {
        cachedMe = data;
        cachedAt = Date.now();
        return data;
      })
      .catch((error: unknown) => {
        if (isUnauthenticated(error)) {
          cachedMe = null;
          cachedAt = Date.now();
          return null;
        }
        throw error;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function invalidateMeCache() {
  cachedMe = undefined;
  cachedAt = 0;
}

export function notifyMeChanged() {
  if (typeof window !== "undefined") {
    invalidateMeCache();
    window.dispatchEvent(new Event(ME_CHANGED_EVENT));
  }
}

export function useMe() {
  const [me, setMe] = useState<Me | null>(cachedMe ?? null);
  const [loading, setLoading] = useState(cachedMe === undefined);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const hasCache = cachedMe !== undefined;
    if (!hasCache) setLoading(true);
    setError(null);
    try {
      const data = await fetchMe();
      setMe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat sesi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cachedMe === undefined || Date.now() - cachedAt > CACHE_TTL_MS) {
      void refresh();
    } else {
      setMe(cachedMe);
      setLoading(false);
    }

    const handler = () => {
      void refresh();
    };
    window.addEventListener(ME_CHANGED_EVENT, handler);
    return () => window.removeEventListener(ME_CHANGED_EVENT, handler);
  }, [refresh]);

  return { me, loading, error, refresh };
}
