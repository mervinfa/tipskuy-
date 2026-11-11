import { z } from "zod";

export const uploadPurposeSchema = z.enum(["ITEM", "PROOF"]);

export const withdrawSchema = z.strictObject({
  amount: z.coerce
    .number()
    .int("Jumlah penarikan harus bilangan bulat Rupiah")
    .min(1, "Jumlah penarikan minimal Rp1"),
  bankCode: z.string().min(2).max(20),
  accountNumber: z.string().regex(/^\d{5,20}$/, "Nomor rekening 5 sampai 20 digit angka"),
});

export const notificationListQuerySchema = z.object({
  unread: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const webhookSchema = z.object({
  gatewayRef: z.string().min(1),
  status: z.enum(["PAID", "FAILED"]),
});

export const expireOrderJobSchema = z.object({
  orderId: z.string().min(1),
});

export type WithdrawInput = z.infer<typeof withdrawSchema>;
