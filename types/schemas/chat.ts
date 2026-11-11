import { z } from "zod";

export const startConversationSchema = z
  .strictObject({
    tripId: z.string().min(1).optional(),
    orderId: z.string().min(1).optional(),
  })
  .refine((input) => Boolean(input.tripId) !== Boolean(input.orderId), {
    message: "Sertakan salah satu dari tripId atau orderId",
  });

export const sendMessageSchema = z.strictObject({
  body: z
    .string()
    .trim()
    .min(1, "Pesan tidak boleh kosong")
    .max(1000, "Pesan maksimal 1000 karakter"),
});

export const messageListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(100),
});

export type StartConversationInput = z.infer<typeof startConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
