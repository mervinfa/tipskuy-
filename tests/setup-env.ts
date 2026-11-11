// Nilai bawaan lingkungan untuk uji unit. Hanya dipakai bila variabel belum ada.
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:54329/tipskuy_test";
process.env.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:54329/tipskuy_test";
process.env.AUTH_SECRET ??= "tipskuy-testing-secret";
process.env.APP_URL ??= "http://localhost:3000";
process.env.STORAGE_PROVIDER ??= "local";
process.env.CRON_SECRET ??= "cron-testing-secret";
