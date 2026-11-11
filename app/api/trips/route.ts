import { apiHandler, ok, parseJsonBody } from "@/lib/http";
import { requireRole, requireUser } from "@/lib/session";
import { createTrip, searchTrips } from "@/lib/trips";
import { createTripSchema, tripSearchSchema } from "@/types/schemas/trip";

export const POST = apiHandler(async (req) => {
  const user = await requireRole("DRIVER");
  const input = createTripSchema.parse(await parseJsonBody(req));
  const trip = await createTrip(user.id, input);
  return ok(trip, { status: 201 });
});

export const GET = apiHandler(async (req) => {
  await requireUser();
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const query = tripSearchSchema.parse(params);
  const result = await searchTrips(query);
  return ok(result);
});
