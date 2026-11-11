// Nilai bawaan lingkungan untuk uji unit. Hanya dipakai bila variabel belum ada.
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:54329/tipskuy_test";
process.env.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:54329/tipskuy_test";
process.env.AUTH_SECRET ??= "tipskuy-testing-secret";
process.env.APP_URL ??= "http://localhost:3000";
process.env.STORAGE_PROVIDER ??= "local";
process.env.CRON_SECRET ??= "cron-testing-secret";
process.env.MIDTRANS_SERVER_KEY ??= "SB-Mid-server-test-key";
process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ??= "Mid-client-test-key";
process.env.MIDTRANS_IS_PRODUCTION ??= "false";
