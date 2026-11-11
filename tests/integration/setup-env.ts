import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// URL basis data uji dibuat global-setup.ts dengan port dinamis lalu dibagikan
// melalui berkas; worker uji tidak selalu mewarisi process.env proses utama.
function bacaUrlUji(): string {
  try {
    const isi = JSON.parse(
      fs.readFileSync(path.join(os.tmpdir(), "tipskuy-test-db.json"), "utf-8")
    ) as { url?: string };
    if (typeof isi.url === "string" && isi.url.length > 0) {
      return isi.url;
    }
  } catch {
    // Berkas belum ada; jatuh ke bawaan untuk jalankan manual.
  }
  return "postgresql://postgres:postgres@127.0.0.1:54329/tipskuy_test";
}

const urlUji = bacaUrlUji();
// Dipaksa, bukan ??=: uji integrasi tidak boleh menyentuh basis data lain
// yang kebetulan terdaftar di process.env milik pengembang.
process.env.DATABASE_URL = urlUji;
process.env.DIRECT_URL = urlUji;
process.env.AUTH_SECRET ??= "tipskuy-testing-secret";
process.env.APP_URL ??= "http://localhost:3000";
process.env.STORAGE_PROVIDER ??= "local";
process.env.CRON_SECRET ??= "cron-testing-secret";
