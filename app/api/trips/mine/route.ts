import { apiHandler, ok } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { listMyTrips } from "@/lib/trips";
import { pageQuerySchema } from "@/types/schemas/common";

export const GET = apiHandler(async (req) => {
  const user = await requireRole("DRIVER");
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const query = pageQuerySchema.parse(params);
  const result = await listMyTrips(user.id, query);
  return ok(result);
});
