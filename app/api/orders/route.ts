import { apiHandler, ok, parseJsonBody, serverNow } from "@/lib/http";
import { requireRole, requireUser } from "@/lib/session";
import { createOrder, listOrders } from "@/lib/orders/service";
import { createOrderSchema, orderListQuerySchema } from "@/types/schemas/order";

export const POST = apiHandler(async (req) => {
  const user = await requireRole("CUSTOMER");
  const input = createOrderSchema.parse(await parseJsonBody(req));
  const order = await createOrder(user.id, input);
  return ok({ ...order, serverTime: serverNow() }, { status: 201 });
});

export const GET = apiHandler(async (req) => {
  const user = await requireUser();
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const query = orderListQuerySchema.parse(params);
  const result = await listOrders(user.id, query);
  return ok({ ...result, serverTime: serverNow() });
});
