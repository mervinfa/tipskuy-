import { ok, apiHandler, parseJsonBody } from "@/lib/http";
import { registerUser } from "@/lib/auth";
import { registerSchema } from "@/types/schemas/auth";
import { clientIp, enforceRateLimit } from "@/lib/rate-limit";

export const POST = apiHandler(async (req) => {
  enforceRateLimit(`register:${clientIp(req)}`, 5, 60_000, "Terlalu banyak percobaan registrasi. Coba lagi dalam semenit.");
  const input = registerSchema.parse(await parseJsonBody(req));
  const user = await registerUser(input);
  return ok(user, { status: 201 });
});
