import type { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { clientIp, enforceRateLimit } from "@/lib/rate-limit";

// Rate limit login: 10 per menit per IP+email (E-18). Pre-check dibaca dari clone
// agar body asli tetap bisa diproses Auth.js.
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const url = new URL(req.url);
    if (url.pathname.endsWith("/api/auth/callback/credentials")) {
      const cloned = req.clone();
      let email = "";
      try {
        const form = await cloned.formData();
        const rawEmail = form.get("email");
        if (typeof rawEmail === "string") {
          email = rawEmail.toLowerCase();
        }
      } catch {
        // Body tidak valid akan ditolak Auth.js; lewati pre-check.
      }
      const ip = clientIp(req);
      enforceRateLimit(`login:${ip}:${email}`, 10, 60_000, "Terlalu banyak percobaan masuk. Coba lagi dalam semenit.");
    }
    return await handlers.POST(req);
  } catch (e) {
    // Galat dari Auth.js dikembalikan sebagai respons, bukan exception.
    return errorResponse(e);
  }
}

export const GET = handlers.GET;
