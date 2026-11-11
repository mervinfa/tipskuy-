import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider, UploadInput, UploadResult } from "./index";
import { env } from "@/lib/env";

// Penyimpanan lokal untuk development. Jangan dipakai di produksi
// (lihat AGENTS bagian 8 dan TDD 6.1).
function localRoot(): string {
  return path.join(process.cwd(), "public", "uploads");
}

export const localProvider: StorageProvider = {
  async upload(input: UploadInput): Promise<UploadResult> {
    const target = path.join(localRoot(), input.bucket, input.key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, input.buffer);
    return { url: localProvider.publicUrl(input.bucket, input.key), key: input.key };
  },

  publicUrl(bucket: string, key: string): string {
    const base = env.APP_URL.replace(/\/$/, "");
    return `${base}/uploads/${bucket}/${key}`;
  },

  async signedUrl(bucket: string, key: string): Promise<string> {
    // Lokal tidak punya bucket privat, URL sudah langsung tersedia.
    return localProvider.publicUrl(bucket, key);
  },
};
