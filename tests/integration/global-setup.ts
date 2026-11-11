import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import EmbeddedPostgres from "embedded-postgres";

const USER = "postgres";
const PASSWORD = "postgres";
const DB_NAME = "tipskuy_test";
const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ENV_FILE = path.join(os.tmpdir(), "tipskuy-test-db.json");

// Port bebas dicari saat runtime agar sisa server dari jalankan sebelumnya
// yang gagal dimatikan tidak membuat server baru gagal mengikat port.
async function cariPortBebas(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address !== null ? address.port : 0;
      server.close(() => {
        if (port > 0) {
          resolve(port);
        } else {
          reject(new Error("Tidak mendapat port TCP bebas"));
        }
      });
    });
  });
}

// Blok shared memory PostgreSQL terkunci pada jalur direktori data; direktori
// unik per jalankan membuat initdb kebal terhadap sisa proses jalankan lama.
function direktoriDataUnik(): string {
  return path.join(os.tmpdir(), `tipskuy-pg-test-${Date.now().toString(36)}-${process.pid}`);
}

// Di Windows berkas dapat sesaat masih terkunci setelah postgres berhenti
// (EBUSY); hapus dengan percobaan ulang.
async function hapusDirektoriData(dataDir: string): Promise<void> {
  for (let percobaan = 0; percobaan < 6; percobaan += 1) {
    try {
      fs.rmSync(dataDir, { recursive: true, force: true });
      return;
    } catch (e) {
      if (percobaan === 5) {
        console.error(`[global-setup] gagal menghapus ${dataDir}: ${String(e)}`);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

// Jaringan proses dipaksa berhenti agar tidak ada proses postgres yang lolos.
async function matikanProsesTree(pid: number): Promise<void> {
  await new Promise<void>((resolve) => {
    if (process.platform === "win32") {
      const child = spawn("taskkill", ["/pid", String(pid), "/f", "/t"], { stdio: "ignore" });
      child.once("close", () => resolve());
      child.once("error", () => resolve());
      return;
    }
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // proses sudah tidak ada; tidak perlu dihentikan
    }
    resolve();
  });
}

function bacaPostmasterPid(dataDir: string): number | null {
  try {
    const isi = fs.readFileSync(path.join(dataDir, "postmaster.pid"), "utf-8");
    const pid = Number.parseInt(isi.split("\n")[0] ?? "", 10);
    return Number.isFinite(pid) ? pid : null;
  } catch {
    return null;
  }
}

// Dijalankan satu kali di proses utama Vitest sebelum semua berkas uji
// integrasi. Menyiapkan PostgreSQL tertanam, menerapkan migrasi, lalu
// menghentikan server saat uji selesai.
export default async function globalSetup() {
  const port = await cariPortBebas();
  const databaseUrl = `postgresql://${USER}:${PASSWORD}@127.0.0.1:${port}/${DB_NAME}`;
  const dataDir = direktoriDataUnik();

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port,
    user: USER,
    password: PASSWORD,
    // Penghapusan direktori data ditangani teardown sendiri dengan percobaan
    // ulang agar kegagalan internal pg.stop tidak menghentikan pembersihan.
    persistent: true,
    postgresFlags: ["-c", "listen_addresses=127.0.0.1", "-c", "io_method=sync"],
    onLog: () => {},
    onError: (message: unknown) => {
      if (typeof message === "string" && message.trim().length > 0) {
        console.error(`[embedded-postgres] ${message.trim()}`);
      }
    },
  });

  await pg.initialise();
  await pg.start();
  await pg.createDatabase(DB_NAME);

  execSync("npx prisma migrate deploy", {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DIRECT_URL: databaseUrl,
    },
    stdio: "pipe",
  });

  // URL dibagikan ke worker uji melalui berkas karena worker tidak selalu
  // mewarisi perubahan process.env yang dilakukan proses utama.
  fs.writeFileSync(ENV_FILE, JSON.stringify({ url: databaseUrl }), "utf-8");
  process.env.DATABASE_URL = databaseUrl;
  process.env.DIRECT_URL = databaseUrl;

  return async function teardown() {
    const postmasterPid = bacaPostmasterPid(dataDir);
    try {
      await pg.stop();
    } catch (e) {
      console.error(`[global-setup] gagal menghentikan postgres: ${String(e)}`);
    }
    if (postmasterPid !== null) {
      await matikanProsesTree(postmasterPid);
    }
    await hapusDirektoriData(dataDir);
  };
}
