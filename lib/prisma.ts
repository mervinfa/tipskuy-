import { PrismaClient } from "@prisma/client";

function getDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    // Di lingkungan serverless dengan Supabase PgBouncer (port 6543),
    // batasi connection per instance ke 1 agar tidak menguras connection pool dan menyebabkan error P2028.
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "30");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

const dbUrl = getDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    dbUrl
      ? {
          datasources: {
            db: {
              url: dbUrl,
            },
          },
        }
      : undefined
  );

globalForPrisma.prisma = prisma;

export const TX_OPTIONS = {
  maxWait: 15000,
  timeout: 30000,
} as const;

