import { z } from "zod";
import { OrderStatus, PaymentMethod, ServiceType } from "@prisma/client";

export const MAX_ITEM_PRICE = 50_000_000;
export const MAX_SERVICE_FEE = 10_000_000;

export const itemPriceSchema = z.coerce
  .number()
  .int("Harga harus bilangan bulat Rupiah")
  .min(0)
  .max(MAX_ITEM_PRICE, "Harga per barang maksimum Rp50.000.000");

export const serviceFeeSchema = z.coerce
  .number()
  .int("Ongkos jasa harus bilangan bulat Rupiah")
  .min(0)
  .max(MAX_SERVICE_FEE, "Ongkos jasa maksimum Rp10.000.000");

export const orderItemSchema = z.strictObject({
  name: z.string().min(1, "Nama barang wajib diisi").max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url("URL gambar barang tidak valid"),
  quantity: z.coerce.number().int().min(1, "Jumlah minimal 1").max(20, "Jumlah maksimal 20"),
  estimatedPrice: itemPriceSchema.optional(),
});

export const createOrderSchema = z.strictObject({
  tripId: z.string().min(1),
  customerNote: z.string().max(500).optional(),
  items: z.array(orderItemSchema).min(1, "Minimal 1 barang").max(10, "Maksimal 10 barang"),
});

export const setPriceSchema = z.strictObject({
  items: z
    .array(
      z.strictObject({
        id: z.string().min(1),
        finalPrice: itemPriceSchema,
      })
    )
    .min(1, "Harga minimal 1 barang")
    .max(10, "Harga maksimal 10 barang"),
  serviceFee: serviceFeeSchema,
});

export const payOrderSchema = z.strictObject({
  method: z.nativeEnum(PaymentMethod),
  idempotencyKey: z.uuid("Idempotency key harus UUID v4"),
});

export const rejectOrderSchema = z.strictObject({
  reason: z.string().max(300).optional(),
});

export const deliverOrderSchema = z.strictObject({
  imageUrl: z.string().url("URL bukti serah terima tidak valid"),
  note: z.string().max(300).optional(),
});

export const disputeOrderSchema = z.strictObject({
  reason: z.string().min(10, "Alasan sengketa minimal 10 karakter").max(500),
});

export const emptyBodySchema = z.strictObject({});

export const orderListQuerySchema = z.object({
  role: z.enum(["customer", "driver"]),
  status: z.nativeEnum(OrderStatus).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createOpenRequestSchema = z.strictObject({
  serviceType: z.nativeEnum(ServiceType),
  originCityCode: z.string().regex(/^\d{4}$/),
  destCityCode: z.string().regex(/^\d{4}$/),
  description: z.string().min(1, "Deskripsi wajib diisi").max(500),
  imageUrl: z.string().url().optional(),
});

export const openRequestListQuerySchema = z.object({
  originCityCode: z.string().regex(/^\d{4}$/).optional(),
  destCityCode: z.string().regex(/^\d{4}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type SetPriceInput = z.infer<typeof setPriceSchema>;
export type PayOrderInput = z.infer<typeof payOrderSchema>;
export type RejectOrderInput = z.infer<typeof rejectOrderSchema>;
export type DeliverOrderInput = z.infer<typeof deliverOrderSchema>;
export type DisputeOrderInput = z.infer<typeof disputeOrderSchema>;
export type CreateOpenRequestInput = z.infer<typeof createOpenRequestSchema>;
