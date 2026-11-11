import { z } from "zod";
import { ServiceType } from "@prisma/client";
import { cityRefSchema, pageQuerySchema } from "./common";

export const MAX_BASE_FEE = 10_000_000;

export const createTripSchema = z.strictObject({
  serviceType: z.nativeEnum(ServiceType),
  origin: cityRefSchema,
  destination: cityRefSchema,
  baseFee: z.coerce
    .number()
    .int("Tarif minimum harus bilangan bulat")
    .min(0)
    .max(MAX_BASE_FEE, "Tarif minimum maksimum Rp10.000.000"),
  departureAt: z.string().datetime({ offset: true }).optional(),
  notes: z.string().max(500).optional(),
});

export const tripSearchSchema = pageQuerySchema.extend({
  originCityCode: z.string().regex(/^\d{4}$/).optional(),
  destCityCode: z.string().regex(/^\d{4}$/).optional(),
  serviceType: z.nativeEnum(ServiceType).optional(),
});

export const tripPatchSchema = z.strictObject({
  isActive: z.boolean(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type TripSearchInput = z.infer<typeof tripSearchSchema>;
