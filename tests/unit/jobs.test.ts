import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { env } from "@/lib/env";
import { computeMockSignature, publishExpireOrderJob, safeEqualHex, verifyCronSecret, verifyJobOrWebhookSignature } from "@/lib/jobs";

describe("tanda tangan mock dan job", () => {
  it("computeMockSignature menghasilkan HMAC SHA256 dari AUTH_SECRET", () => {
    const body = JSON.stringify({ orderId: "order_1" });
    const expected = createHmac("sha256", env.AUTH_SECRET).update(body).digest("hex");
    expect(computeMockSignature(body)).toBe(expected);
  });

  it("verifyJobOrWebhookSignature menerima tanda tangan mock yang benar", async () => {
    const body = JSON.stringify({ orderId: "order_1" });
    const req = new Request("http://localhost/api/jobs/expire-order", {
      method: "POST",
      headers: { "x-mock-signature": computeMockSignature(body) },
    });
    expect(await verifyJobOrWebhookSignature(req, body)).toBe(true);
  });

  it("verifyJobOrWebhookSignature menolak tanda tangan salah dan header kosong", async () => {
    const body = JSON.stringify({ orderId: "order_1" });
    const salah = new Request("http://localhost/x", {
      headers: { "x-mock-signature": "deadbeef" },
    });
    expect(await verifyJobOrWebhookSignature(salah, body)).toBe(false);
    const tanpa = new Request("http://localhost/x");
    expect(await verifyJobOrWebhookSignature(tanpa, body)).toBe(false);
  });

  it("safeEqualHex membandingkan panjang berbeda dengan false", () => {
    expect(safeEqualHex("abc", "abcd")).toBe(false);
    expect(safeEqualHex("abc", "abc")).toBe(true);
  });

  it("verifyCronSecret memeriksa header authorization", () => {
    const benar = new Request("http://localhost/api/cron/expire-orders", {
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    });
    expect(verifyCronSecret(benar)).toBe(true);
    const salah = new Request("http://localhost/x", {
      headers: { authorization: "Bearer salah-rahasia" },
    });
    expect(verifyCronSecret(salah)).toBe(false);
    const kosong = new Request("http://localhost/x");
    expect(verifyCronSecret(kosong)).toBe(false);
  });

  it("publishExpireOrderJob tidak melempar tanpa QStash token", async () => {
    await expect(publishExpireOrderJob("order_1")).resolves.toBeUndefined();
  });
});
