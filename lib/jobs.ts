import { Client, Receiver } from "@upstash/qstash";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

// Publikasi job kadaluarsa. Kegagalan publish tidak boleh menggagalkan set-price:
// lapis lazy expiry dan cron tetap menjamin pembatalan.
export async function publishExpireOrderJob(orderId: string): Promise<void> {
  if (!env.QSTASH_TOKEN) {
    return;
  }
  try {
    const client = new Client({ token: env.QSTASH_TOKEN });
    const publishPromise = client.publishJSON({
      url: `${env.APP_URL}/api/jobs/expire-order`,
      body: { orderId },
      delay: env.PAYMENT_WINDOW_SECONDS,
      retries: 3,
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("QSTASH_PUBLISH_TIMEOUT")), 3000)
    );
    await Promise.race([publishPromise, timeoutPromise]);
  } catch (e) {
    console.error("Gagal publish job expire-order ke QStash", e);
  }
}

export async function verifyQstashSignature(signature: string | null, body: string): Promise<boolean> {
  if (!signature || !env.QSTASH_CURRENT_SIGNING_KEY || !env.QSTASH_NEXT_SIGNING_KEY) {
    return false;
  }
  const receiver = new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
  });
  try {
    return await receiver.verify({ signature, body });
  } catch {
    // Signature tidak valid harus diperlakukan sebagai gagal verifikasi, bukan galat 500.
    return false;
  }
}

// Signature untuk gateway mock dan job mock: HMAC-SHA256(body, AUTH_SECRET) heksadesimal.
export function computeMockSignature(body: string): string {
  return createHmac("sha256", env.AUTH_SECRET).update(body).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

export async function verifyJobOrWebhookSignature(req: Request, body: string): Promise<boolean> {
  const qstashSignature = req.headers.get("upstash-signature");
  if (qstashSignature) {
    return verifyQstashSignature(qstashSignature, body);
  }
  const mockSignature = req.headers.get("x-mock-signature");
  if (mockSignature) {
    return safeEqualHex(mockSignature, computeMockSignature(body));
  }
  return false;
}

export function verifyCronSecret(req: Request): boolean {
  if (!env.CRON_SECRET) {
    return false;
  }
  const authorization = req.headers.get("authorization");
  return authorization === `Bearer ${env.CRON_SECRET}`;
}
