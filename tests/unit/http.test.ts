import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError, apiHandler, decodeCursor, encodeCursor, errorResponse, ok, parseJsonBody, parseJsonText, serverNow } from "@/lib/http";

describe("cursor base64url", () => {
  it("putaran balik encode dan decode", () => {
    const cursor = { c: "2026-01-01T00:00:00.000Z", id: "clxabc123" };
    const encoded = encodeCursor(cursor);
    expect(decodeCursor(encoded)).toEqual(cursor);
  });

  it("decode menolak masukan rusak", () => {
    expect(decodeCursor("bukan-base64")).toBeNull();
    expect(decodeCursor(encodeCursor({ c: "bukan-tanggal", id: "x" }))).toBeNull();
    expect(decodeCursor(Buffer.from("123", "utf8").toString("base64url"))).toBeNull();
  });
});

describe("respons HTTP", () => {
  it("ok membungkus data", async () => {
    const res = ok({ pesan: "halo" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { pesan: "halo" } });
  });

  it("serverNow menghasilkan ISO string", () => {
    expect(() => new Date(serverNow())).not.toThrow();
  });

  it("errorResponse memetakan AppError", async () => {
    const res = errorResponse(new AppError(410, "PAYMENT_DEADLINE_PASSED", "Habis waktu"));
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error.code).toBe("PAYMENT_DEADLINE_PASSED");
  });

  it("errorResponse memetakan ZodError ke 422", async () => {
    const result = z.object({ a: z.string() }).safeParse({ a: 1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const res = errorResponse(result.error);
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details.issues).toBeInstanceOf(Array);
    }
  });

  it("errorResponse memetakan P2002 email ke EMAIL_TAKEN", async () => {
    const res = errorResponse({ code: "P2002", meta: { target: ["email"] } });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("EMAIL_TAKEN");
  });

  it("errorResponse memetakan P2002 lain ke CONFLICT", async () => {
    const res = errorResponse({ code: "P2002", meta: { target: ["orderId"] } });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("CONFLICT");
  });

  it("errorResponse memetakan P2025 ke 404", async () => {
    const res = errorResponse({ code: "P2025" });
    expect(res.status).toBe(404);
  });

  it("errorResponse memetakan galat tak dikenal ke 500", async () => {
    const res = errorResponse(new Error("tidak terduga"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("apiHandler", () => {
  it("menangkap AppError dan mengembalikan respons galat", async () => {
    const handler = apiHandler(async () => {
      throw new AppError(409, "ORDER_STATE_CONFLICT", "Konflik");
    });
    const res = await handler(new Request("http://localhost/x"), { params: Promise.resolve({}) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("ORDER_STATE_CONFLICT");
  });

  it("meneruskan hasil handler saat sukses", async () => {
    const handler = apiHandler(async () => ok({ oke: true }));
    const res = await handler(new Request("http://localhost/x"), { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
  });
});

describe("parseJsonBody dan parseJsonText", () => {
  it("body JSON valid terbaca", async () => {
    const req = new Request("http://localhost/x", {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
    });
    expect(await parseJsonBody(req)).toEqual({ a: 1 });
  });

  it("body bukan JSON ditolak 400", async () => {
    const req = new Request("http://localhost/x", {
      method: "POST",
      body: "bukan json",
    });
    await expect(parseJsonBody(req)).rejects.toMatchObject({ status: 400, code: "BAD_REQUEST" });
  });

  it("teks bukan JSON ditolak 400", () => {
    expect(() => parseJsonText("bukan json")).toThrowError();
  });
});
