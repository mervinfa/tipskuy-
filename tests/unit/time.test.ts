import { describe, expect, it } from "vitest";
import { PAYMENT_WINDOW_MS, calcRemainingMs, formatMmSs, paymentDeadlineFrom } from "@/lib/time";

describe("lib/time", () => {
  it("PAYMENT_WINDOW_MS mengikuti konfigurasi default 300 detik", () => {
    expect(PAYMENT_WINDOW_MS).toBe(300_000);
  });

  it("paymentDeadlineFrom menambahkan jendela pembayaran", () => {
    const pricedAt = new Date("2026-01-01T10:00:00Z");
    expect(paymentDeadlineFrom(pricedAt).getTime()).toBe(pricedAt.getTime() + 300_000);
  });

  it("calcRemainingMs menghitung dari serverTime, bukan jam perangkat", () => {
    const deadline = "2026-01-01T10:05:00Z";
    const serverTime = "2026-01-01T10:00:00Z";
    const deviceNowMs = new Date("2026-01-01T10:10:00Z").getTime();
    expect(calcRemainingMs(deadline, serverTime, deviceNowMs)).toBe(300_000);
  });

  it("calcRemainingMs mengembalikan 0 untuk masukan tidak valid atau terlewat", () => {
    expect(calcRemainingMs("bukan-tanggal", "2026-01-01T10:00:00Z", 0)).toBe(0);
    expect(calcRemainingMs("2026-01-01T10:05:00Z", "bukan-tanggal", 0)).toBe(0);
    expect(calcRemainingMs("2026-01-01T10:00:00Z", "2026-01-01T10:00:00Z", 0)).toBe(0);
  });

  it("formatMmSs memecah menit dan detik", () => {
    expect(formatMmSs(299_000)).toEqual({ mm: 4, ss: 59 });
    expect(formatMmSs(0)).toEqual({ mm: 0, ss: 0 });
  });
});
