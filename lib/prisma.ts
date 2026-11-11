import { PrismaClient } from "@prisma/client";

function getCleanDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;
  url = url.trim();
  // Bersihkan jika pengguna tidak sengaja menempelkan prefix "DATABASE_URL=" di dashboard Vercel
  if (url.startsWith("DATABASE_URL=")) {
    url = url.slice("DATABASE_URL=".length).trim();
  }
  // Bersihkan tanda petik ganda atau tunggal yang tidak sengaja terbawa di env Vercel
  while (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim();
  }
  return url;
}

const cleanUrl = getCleanDatabaseUrl();
if (cleanUrl) {
  process.env.DATABASE_URL = cleanUrl;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    cleanUrl
      ? {
          datasources: {
            db: {
              url: cleanUrl,
            },
          },
        }
      : undefined
  );

globalForPrisma.prisma = prisma;

export const TX_OPTIONS = {
  maxWait: 10000,
  timeout: 15000,
} as const;



