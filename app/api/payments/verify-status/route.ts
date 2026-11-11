import { z } from "zod";
import { apiHandler, AppError, ok, parseJsonBody } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { getOrderForUser, syncMidtransPayment } from "@/lib/orders/service";

const verifyStatusSchema = z.strictObject({
  orderId: z.string().min(1, "orderId wajib diisi"),
});

export const POST = apiHandler(async (req) => {
  const user = await requireUser();
  const { orderId } = verifyStatusSchema.parse(await parseJsonBody(req));

  const updated = await syncMidtransPayment(orderId);
  const order = await getOrderForUser(user.id, orderId);

  return ok({
    synced: updated,
    status: order.status,
    order,
  });
});
