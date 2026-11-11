"use client";
import { useEffect, useMemo, useState } from "react";

// Jam perangkat bisa salah: sisa waktu dihitung dari serverTime respons API.
// Hasil countdown hanya tampilan; keputusan akhir ada di server.
export function useCountdown(deadlineIso: string | null, serverTimeIso: string | null, onExpire: () => void) {
  const offset = useMemo(
    () => (serverTimeIso ? new Date(serverTimeIso).getTime() - Date.now() : 0),
    [serverTimeIso]
  );
  function calc() {
    if (!deadlineIso) return 0;
    return Math.max(0, new Date(deadlineIso).getTime() - (Date.now() + offset));
  }
  const [remaining, setRemaining] = useState(() => calc());
  useEffect(() => {
    if (!deadlineIso) return;
    const id = setInterval(() => {
      const r = calc();
      setRemaining(r);
      if (r === 0) {
        clearInterval(id);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(id);
    // offset sudah memuat serverTime; calc dan onExpire stabil selama countdown berjalan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineIso, offset]);
  return {
    remainingMs: remaining,
    mm: Math.floor(remaining / 60000),
    ss: Math.floor((remaining % 60000) / 1000),
  };
}
