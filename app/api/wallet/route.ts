import { apiHandler, ok } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { getWallet } from "@/lib/wallet";
import { pageQuerySchema } from "@/types/schemas/common";

export const GET = apiHandler(async (req) => {
  const user = await requireRole("DRIVER");
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const query = pageQuerySchema.parse(params);
  const result = await getWallet(user.id, query);
  return ok(result);
});
