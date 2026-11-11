import type { StorageProvider, UploadInput, UploadResult } from "./index";
import { requireSupabaseConfig } from "@/lib/env";

export const supabaseProvider: StorageProvider = {
  async upload(input: UploadInput): Promise<UploadResult> {
    const cfg = requireSupabaseConfig();
    const target = `${cfg.url}/storage/v1/object/${input.bucket}/${input.key}`;
    const res = await fetch(target, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.serviceRoleKey}`,
        "Content-Type": input.contentType,
        "x-upsert": "true",
      },
      body: new Uint8Array(input.buffer),
    });
    if (!res.ok) {
      throw new Error(`Supabase upload gagal dengan status ${res.status}`);
    }
    return { url: supabaseProvider.publicUrl(input.bucket, input.key), key: input.key };
  },

  publicUrl(bucket: string, key: string): string {
    const cfg = requireSupabaseConfig();
    return `${cfg.url}/storage/v1/object/public/${bucket}/${key}`;
  },

  async signedUrl(bucket: string, key: string, expiresInSeconds: number): Promise<string> {
    const cfg = requireSupabaseConfig();
    const res = await fetch(`${cfg.url}/storage/v1/object/sign/${bucket}/${key}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    });
    if (!res.ok) {
      throw new Error(`Supabase signed URL gagal dengan status ${res.status}`);
    }
    const json = (await res.json()) as { signedURL?: string };
    if (!json.signedURL) {
      throw new Error("Supabase tidak mengembalikan signedURL");
    }
    return `${cfg.url}/storage/v1${json.signedURL}`;
  },
};
