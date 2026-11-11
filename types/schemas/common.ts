import { z } from "zod";

export const idParamSchema = z.strictObject({
  id: z.string().min(1),
});

export const cityCodeSchema = z.string().regex(/^\d{4}$/, "Kode kota harus 4 digit angka");

// Client boleh mengirim data lengkap asal/tujuan, tetapi server hanya memakai cityCode.
export const cityRefSchema = z.strictObject({
  provinceCode: z.string().regex(/^\d{2}$/).optional(),
  cityCode: cityCodeSchema,
  province: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
