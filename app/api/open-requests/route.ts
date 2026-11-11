import { apiHandler, ok, parseJsonBody } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { createOpenRequest, listOpenRequests } from "@/lib/open-requests";
import { createOpenRequestSchema, openRequestListQuerySchema } from "@/types/schemas/order";

export const POST = apiHandler(async (req) => {
  const user = await requireRole("CUSTOMER");
  const input = createOpenRequestSchema.parse(await parseJsonBody(req));
  const created = await createOpenRequest(user.id, input);
  return ok(created, { status: 201 });
});

export const GET = apiHandler(async (req) => {
  await requireRole("DRIVER");
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const query = openRequestListQuerySchema.parse(params);
  const result = await listOpenRequests(query);
  return ok(result);
});
