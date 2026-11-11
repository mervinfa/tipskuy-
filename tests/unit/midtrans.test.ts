import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { verifyMidtransSignature } from "@/lib/payments/midtrans";
import { getMidtransConfig } from "@/lib/env";

describe("Midtrans Payment Helper", () => {
  it("memverifikasi signature SHA512 Midtrans dengan benar", () => {
    const orderId = "order_123-1700000000";
    const statusCode = "200";
    const grossAmount = "50000.00";
    const { serverKey } = getMidtransConfig();

    const validHash = createHash("sha512")
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest("hex");

    const verified = verifyMidtransSignature(orderId, statusCode, grossAmount, validHash);
    expect(verified).toBe(true);

    const wrongSignature = "invalid_hash_value_1234567890abcdef";
    const failed = verifyMidtransSignature(orderId, statusCode, grossAmount, wrongSignature);
    expect(failed).toBe(false);
  });
});
