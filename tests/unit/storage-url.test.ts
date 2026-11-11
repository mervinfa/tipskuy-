import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/http";
import { bucketName, parseStorageUrl } from "@/lib/storage/url";

const userId = "user_abc123";
const base = "http://localhost:3000/uploads";

function expectAppError(fn: () => unknown, status: number, code: string) {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(AppError);
    const err = e as AppError;
    expect(err.status).toBe(status);
    expect(err.code).toBe(code);
    return;
  }
  throw new Error(`URL seharusnya ditolak dengan ${code}`);
}

describe("parseStorageUrl", () => {
  it("U-11: URL valid milik sendiri diterima dan menghasilkan key", () => {
    const url = `${base}/order-items/${userId}/2026/11/barang.webp`;
    expect(parseStorageUrl(url, "items", userId)).toEqual({
      bucket: "order-items",
      key: `${userId}/2026/11/barang.webp`,
    });
  });

  it("U-11: URL dari host lain ditolak", () => {
    const url = `https://evil.example.com/uploads/order-items/${userId}/2026/11/barang.webp`;
    expectAppError(() => parseStorageUrl(url, "items", userId), 422, "INVALID_IMAGE_URL");
  });

  it("URL bucket salah ditolak", () => {
    const url = `${base}/delivery-proofs/${userId}/2026/11/bukti.webp`;
    expectAppError(() => parseStorageUrl(url, "items", userId), 422, "INVALID_IMAGE_BUCKET");
  });

  it("URL milik user lain ditolak", () => {
    const url = `${base}/order-items/user_lain/2026/11/barang.webp`;
    expectAppError(() => parseStorageUrl(url, "items", userId), 422, "INVALID_IMAGE_OWNER");
  });

  it("URL tanpa akhiran webp ditolak", () => {
    const url = `${base}/order-items/${userId}/2026/11/barang.jpg`;
    expectAppError(() => parseStorageUrl(url, "items", userId), 422, "INVALID_IMAGE_URL");
  });

  it("URL rusak ditolak", () => {
    expectAppError(() => parseStorageUrl("bukan-url", "items", userId), 422, "INVALID_IMAGE_URL");
  });

  it("bucketName mengikuti konfigurasi penyimpanan lokal", () => {
    expect(bucketName("items")).toBe("order-items");
    expect(bucketName("proofs")).toBe("delivery-proofs");
  });
});
