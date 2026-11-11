import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/[...nextauth]/route";
import { uniqueEmail } from "./helpers";

// E-18: percobaan login yang gagal 11 kali dalam semenit dibatasi 429.
// Route memakai lib/auth asli tanpa mock supaya alur Auth.js tetap dijalankan.
// Hasil internal Auth.js boleh berupa respons galat apa pun; yang diuji adalah
// bahwa panggilan ke-11 ditolak rate limit sebelum Auth.js memproses body.
describe("E-18 rate limit login", () => {
  it("menolak percobaan login ke-11 dalam semenit dengan 429 RATE_LIMITED", async () => {
    const email = uniqueEmail("login");
    const ip = "10.99.0.1";
    const url = "http://localhost:3000/api/auth/callback/credentials";
    const buat = () =>
      new NextRequest(url, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "x-forwarded-for": ip,
        },
        body: new URLSearchParams({
          email,
          password: "sandi-salah-123",
          csrfToken: "token-tidak-valid",
        }).toString(),
      });

    for (let i = 1; i <= 10; i += 1) {
      const res = await POST(buat());
      expect(res.status).not.toBe(429);
    }

    const blocked = await POST(buat());
    expect(blocked.status).toBe(429);
    const json = (await blocked.json()) as { error: { code: string } };
    expect(json.error.code).toBe("RATE_LIMITED");
  });
});
