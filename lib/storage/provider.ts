import type { StorageProvider } from "./index";
import { localProvider } from "./local";
import { supabaseProvider } from "./supabase";
import { env } from "@/lib/env";

let cached: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!cached) {
    cached = env.STORAGE_PROVIDER === "supabase" ? supabaseProvider : localProvider;
  }
  return cached;
}
