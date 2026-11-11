import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, clientIp, enforceRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mengizinkan hingga batas lalu menolak dalam jendela yang sama", () => {
    const key = `unit-rate-${crypto.randomUUID()}`;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5, 60_000)).toBe(true);
    }
    expect(checkRateLimit(key, 5, 60_000)).toBe(false);
  });

  it("jendela baru mengizinkan kembali setelah reset", () => {
    const key = `unit-rate-reset-${crypto.randomUUID()}`;
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    }
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
  });
});

describe("enforceRateLimit", () => {
  it("melempar 429 saat batas tercapai", () => {
    const key = `unit-enforce-${crypto.randomUUID()}`;
    enforceRateLimit(key, 1, 60_000, "Terlalu sering");
    expect(() => enforceRateLimit(key, 1, 60_000, "Terlalu sering")).toThrowError(
      /Terlalu sering/
    );
  });
});

describe("clientIp", () => {
  it("membaca IP pertama dari x-forwarded-for", () => {
    const req = new Request("http://localhost/x", {
      headers: { "x-forwarded-for": "10.0.0.7, 192.168.1.1" },
    });
    expect(clientIp(req)).toBe("10.0.0.7");
  });

  it("fallback ke x-real-ip", () => {
    const req = new Request("http://localhost/x", { headers: { "x-real-ip": "10.0.0.9" } });
    expect(clientIp(req)).toBe("10.0.0.9");
  });

  it("unknown saat tidak ada header", () => {
    const req = new Request("http://localhost/x");
    expect(clientIp(req)).toBe("unknown");
  });
});
