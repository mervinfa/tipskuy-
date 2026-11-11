import { apiHandler, ok, parseJsonBody, serverNow } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { listMessages, sendMessage } from "@/lib/chat";
import { idParamSchema } from "@/types/schemas/common";
import { messageListQuerySchema, sendMessageSchema } from "@/types/schemas/chat";

export const GET = apiHandler<{ id: string }>(async (req, ctx) => {
  const user = await requireUser();
  const { id } = idParamSchema.parse(await ctx.params);
  const query = messageListQuerySchema.parse(
    Object.fromEntries(new URL(req.url).searchParams)
  );
  const result = await listMessages(user.id, id, query.limit);
  return ok({ ...result, serverTime: serverNow() });
});

export const POST = apiHandler<{ id: string }>(async (req, ctx) => {
  const user = await requireUser();
  const { id } = idParamSchema.parse(await ctx.params);
  enforceRateLimit(
    `chat-send:${user.id}`,
    30,
    60_000,
    "Terlalu banyak pesan. Tunggu sebentar sebelum mengirim lagi."
  );
  const input = sendMessageSchema.parse(await parseJsonBody(req));
  const message = await sendMessage(user.id, id, input);
  return ok({ ...message, serverTime: serverNow() }, { status: 201 });
});
