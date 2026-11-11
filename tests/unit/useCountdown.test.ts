// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCountdown } from "@/hooks/useCountdown";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("U-09: sisa waktu tetap dihitung dari serverTime saat jam perangkat lebih cepat", () => {
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    // Server 10 menit lebih lambat dari jam perangkat.
    const serverTimeIso = "2026-01-01T11:50:00Z";
    const deadlineIso = "2026-01-01T11:55:00Z";
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown(deadlineIso, serverTimeIso, onExpire));
    // Sisa waktu relatif ke waktu server: 5 menit, bukan 15 menit.
    expect(result.current.remainingMs).toBe(5 * 60_000);
    expect(result.current.mm).toBe(5);
    expect(result.current.ss).toBe(0);
  });

  it("U-10: onExpire terpanggil tepat sekali saat mencapai nol", () => {
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    const serverTimeIso = "2026-01-01T12:00:00Z";
    const deadlineIso = "2026-01-01T12:00:02Z";
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown(deadlineIso, serverTimeIso, onExpire));

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.remainingMs).toBe(1_000);
    expect(onExpire).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.remainingMs).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current.remainingMs).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("deadline kosong menghasilkan sisa nol tanpa interval", () => {
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown(null, "2026-01-01T12:00:00Z", onExpire));
    expect(result.current.remainingMs).toBe(0);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onExpire).not.toHaveBeenCalled();
  });
});
