import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": root,
    },
  },
  test: {
    server: {
      deps: {
        // next-auth mengimpor "next/server" sebagai ESM; paket next tidak
        // mendeklarasikan field "exports" sehingga resolver native Node gagal.
        // Inline agar Vite yang menangani resolusi modul tersebut.
        inline: ["next-auth"],
      },
    },
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          setupFiles: ["tests/setup-env.ts"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          setupFiles: ["tests/integration/setup-env.ts"],
          globalSetup: ["tests/integration/global-setup.ts"],
          fileParallelism: false,
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["lib/orders/**"],
      thresholds: {
        lines: 90,
      },
    },
  },
});
