import { AppError } from "@/lib/http";
import { env } from "@/lib/env";

export type StorageBucket = "items" | "proofs";

export function bucketName(bucket: StorageBucket): string {
  return bucket === "items" ? env.storageBucketItems : env.storageBucketProofs;
}

// Prefix URL storage yang dianggap berasal dari konfigurasi aktif.
// Local dev memakai folder /uploads di bawah APP_URL.
function allowedBasePrefixes(): string[] {
  if (env.STORAGE_PROVIDER === "supabase" && env.SUPABASE_URL) {
    const base = env.SUPABASE_URL.replace(/\/$/, "");
    return [
      `${base}/storage/v1/object/public/`,
      `${base}/storage/v1/object/sign/`,
    ];
  }
  const prefixes = new Set<string>();
  const base = env.APP_URL.replace(/\/$/, "");
  prefixes.add(`${base}/uploads/`);
  prefixes.add("http://localhost:3000/uploads/");
  prefixes.add("http://localhost:3001/uploads/");
  prefixes.add("http://127.0.0.1:3000/uploads/");
  prefixes.add("http://127.0.0.1:3001/uploads/");
  return Array.from(prefixes);
}

export type ParsedStorageUrl = {
  bucket: string;
  key: string;
};

// Validasi bahwa URL berasal dari host storage terkonfigurasi, bucket yang benar,
// dan diunggah oleh user yang sama (key diawali userId, lihat TDD 6.1.7).
export function parseStorageUrl(url: string, bucket: StorageBucket, userId: string): ParsedStorageUrl {
  let rest = "";
  if (url.startsWith("/uploads/")) {
    rest = url.slice("/uploads/".length);
  } else {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new AppError(422, "INVALID_IMAGE_URL", "URL gambar tidak valid");
    }
    const path = parsed.origin + parsed.pathname;
    const matched = allowedBasePrefixes().find((prefix) => path.startsWith(prefix));
    if (!matched) {
      throw new AppError(422, "INVALID_IMAGE_URL", "URL gambar tidak berasal dari storage yang dikonfigurasi");
    }
    rest = path.slice(matched.length);
  }
  const expectedBucket = bucketName(bucket);
  if (!rest.startsWith(`${expectedBucket}/`)) {
    throw new AppError(422, "INVALID_IMAGE_BUCKET", "URL gambar tidak berasal dari bucket yang benar");
  }
  const key = rest.slice(expectedBucket.length + 1);
  if (!key.startsWith(`${userId}/`)) {
    throw new AppError(422, "INVALID_IMAGE_OWNER", "URL gambar bukan milik Anda");
  }
  if (!key.endsWith(".webp")) {
    throw new AppError(422, "INVALID_IMAGE_URL", "URL gambar harus berkas hasil proses unggahan");
  }
  return { bucket: expectedBucket, key };
}
