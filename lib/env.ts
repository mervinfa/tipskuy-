import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(16),
  NEXTAUTH_URL: z.string().url().optional(),
  STORAGE_PROVIDER: z.enum(["supabase", "local"]).default("local"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_BUCKET_ITEMS: z.string().min(1).default("order-items"),
  SUPABASE_BUCKET_PROOFS: z.string().min(1).default("delivery-proofs"),
  QSTASH_TOKEN: z.string().optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  PLATFORM_FEE_BPS: z.coerce.number().int().min(0).default(500),
  PAYMENT_WINDOW_SECONDS: z.coerce.number().int().min(1).default(300),
  PAYMENT_PROVIDER: z.enum(["mock"]).default("mock"),
  VERIFICATION_REQUIRED: z.stringbool().default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    "Variabel lingkungan tidak valid: " +
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
  );
}

const input = parsed.data;

export const env = {
  ...input,
  DIRECT_URL: input.DIRECT_URL ?? input.DATABASE_URL,
  storageBucketItems: input.STORAGE_PROVIDER === "supabase"
    ? input.SUPABASE_BUCKET_ITEMS
    : "order-items",
  storageBucketProofs: input.STORAGE_PROVIDER === "supabase"
    ? input.SUPABASE_BUCKET_PROOFS
    : "delivery-proofs",
};

export function requireSupabaseConfig() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("STORAGE_PROVIDER=supabase memerlukan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY");
  }
  return {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    bucketItems: env.SUPABASE_BUCKET_ITEMS,
    bucketProofs: env.SUPABASE_BUCKET_PROOFS,
  };
}
