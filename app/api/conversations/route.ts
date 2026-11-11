import { apiHandler, ok, parseJsonBody, serverNow } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { listConversations, startConversation } from "@/lib/chat";
import { startConversationSchema } from "@/types/schemas/chat";

export const GET = apiHandler(async () => {
  const user = await requireUser();
  const result = await listConversations(user.id);
  return ok({ ...result, serverTime: serverNow() });
});

export const POST = apiHandler(async (req) => {
  const user = await requireUser();
  const input = startConversationSchema.parse(await parseJsonBody(req));
  const conversation = await startConversation(user, input);
  return ok(conversation);
});
