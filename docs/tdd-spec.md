# Tipskuy: Technical Design Document (TDD)

Versi: 1.0
Stack: Next.js 15 (App Router), TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL, Auth.js (NextAuth v5), Leaflet, Zod, Vitest, Playwright.

Dokumen ini adalah sumber kebenaran untuk database, arsitektur folder, kontrak API, keamanan transaksi, dan integrasi frontend. Jika kode dan dokumen ini berbeda, dokumen ini yang diperbarui terlebih dahulu, baru kode mengikuti.

---

## 0. Keputusan Desain Utama

| No | Keputusan | Alasan |
|----|-----------|--------|
| 1 | Mutasi data melalui Route Handler (`app/api/...`), bukan Server Actions | Kontrak API tunggal, mudah diuji, mudah dipanggil dari modal client |
| 2 | Logika bisnis hanya di `lib/orders/*`, route handler hanya parse, authorize, panggil service, format respons | Mencegah logika tersebar di banyak endpoint |
| 3 | Uang disimpan sebagai `Int` dalam Rupiah (tanpa desimal) | Menghindari galat floating point |
| 4 | Perubahan status order selalu lewat satu fungsi `transition()` dengan update bersyarat (`updateMany` dengan `where status = from`) | Mencegah race condition (double pay, double complete) tanpa lock manual |
| 5 | Auto-cancel memakai kolom `paymentDeadline` sebagai sumber kebenaran, dengan empat lapis pengaman (server check saat bayar, lazy expiry saat baca, QStash delayed job, cron fallback) | Tidak bergantung pada satu worker yang bisa gagal |
| 6 | Upload dua langkah: `POST /api/uploads` mengembalikan URL, lalu URL dikirim di body JSON endpoint order | Validasi file terpusat, body order tetap JSON |
| 7 | Data wilayah Indonesia dan koordinat berupa file JSON statis hasil build script | Tanpa ketergantungan API pihak ketiga saat runtime |
| 8 | Satu sumber state order di server, diakses client lewat SWR/TanStack Query. Modal tidak menyimpan salinan status order | Menghilangkan redundansi state antar modal |
| 9 | Chat disimpan di tabel `Conversation` dan `Message`, satu percakapan per pasangan customer dan driver. Trip atau order terakhir disimpan sebagai konteks agar riwayat tidak terputus saat customer membuka trip lain dengan driver yang sama. Nomor WhatsApp tetap tidak ada di daftar trip dan hanya diambil lewat endpoint kontak saat tombol ditekan | Customer bisa berdiskusi di dalam web tanpa membocorkan nomor secara massal dan tanpa kehilangan riwayat |

Nama status mengikuti dokumen ini (bukan nama lama `PENDING_PRICE`, `WAITING_PAYMENT`, dst.). Lihat bagian 3.

---

## 1. Arsitektur Sistem dan Struktur Direktori

### 1.1 Diagram Komponen

```
Browser (React client components, Leaflet, modal order)
   |
   | HTTPS (JSON, multipart untuk upload)
   v
Next.js Route Handlers (app/api/**)  --->  Zod validation  --->  lib/orders/service.ts
   |                                                                  |
   | Auth.js session (JWT cookie, httpOnly)                           v
   |                                                       Prisma Client (singleton)
   |                                                                  |
   +--> lib/storage (Supabase Storage / Cloudinary)                   v
   +--> lib/payments (mock gateway, adapter ke Midtrans/Xendit)   PostgreSQL
   +--> lib/jobs (Upstash QStash publish)
        ^
        | callback terverifikasi signature
   QStash / Vercel Cron  --->  /api/jobs/expire-order, /api/cron/expire-orders
```

### 1.2 Pohon Direktori

```
tipskuy/
|-- AGENTS.md
|-- docs/
|   `-- tdd-spec.md
|-- prisma/
|   |-- schema.prisma
|   |-- migrations/
|   |   `-- 0002_constraints/migration.sql     (CHECK constraint, partial index)
|   `-- seed.ts
|-- public/
|   |-- regions/                                (hasil build-regions: provinces.json, {provinceCode}.json)
|   `-- leaflet/                                (marker-icon.png, marker-icon-2x.png, marker-shadow.png)
|-- scripts/
|   `-- build-regions.ts
|-- app/
|   |-- layout.tsx
|   |-- page.tsx
|   |-- (auth)/
|   |   |-- login/page.tsx
|   |   `-- register/page.tsx
|   |-- (main)/
|   |   |-- caridriver/
|   |   |   |-- page.tsx                        (cari trip dan buat order)
|   |   |   |-- pesanan/page.tsx                (daftar dan detail pesanan customer)
|   |   |   `-- postingan/page.tsx              (buat postingan terbuka)
|   |   `-- driver/
|   |       |-- page.tsx
|   |       `-- wallet/page.tsx
|   `-- api/
|       |-- auth/
|       |   |-- [...nextauth]/route.ts
|       |   `-- register/route.ts
|       |-- me/route.ts
|       |-- uploads/route.ts
|       |-- trips/
|       |   |-- route.ts                        (GET search, POST create)
|       |   |-- mine/route.ts
|       |   `-- [id]/route.ts                   (PATCH aktif/nonaktif)
|       |-- open-requests/
|       |   |-- route.ts
|       |   `-- [id]/claim/route.ts
|       |-- orders/
|       |   |-- route.ts                        (GET list, POST create)
|       |   `-- [id]/
|       |       |-- route.ts                    (GET detail)
|       |       |-- set-price/route.ts
|       |       |-- pay/route.ts
|       |       |-- reject/route.ts
|       |       |-- start/route.ts
|       |       |-- deliver/route.ts
|       |       |-- complete/route.ts
|       |       `-- dispute/route.ts
|       |-- payments/webhook/route.ts
|       |-- notifications/
|       |   |-- route.ts
|       |   |-- read-all/route.ts
|       |   `-- [id]/read/route.ts
|       |-- conversations/
|       |   |-- route.ts                        (GET list, POST start)
|       |   `-- [id]/messages/route.ts          (GET messages, POST message)
|       |-- wallet/
|       |   |-- route.ts
|       |   `-- withdraw/route.ts
|       |-- jobs/expire-order/route.ts          (dipanggil QStash)
|       `-- cron/expire-orders/route.ts         (dipanggil Vercel Cron)
|-- components/
|   |-- ui/                                     (Button, Input, Select, Dialog, Drawer, Spinner, Toast)
|   |-- layout/                                 (Navbar, Footer, PageContainer)
|   |-- auth/                                   (LoginForm, RegisterForm, RoleSelect)
|   |-- map/
|   |   |-- MapView.tsx                         (wrapper dynamic, ssr false)
|   |   `-- MapViewInner.tsx                    (react-leaflet, hanya client)
|   |-- region/
|   |   `-- RegionSelect.tsx                    (Provinsi -> Kota, memanggil onCityChange)
|   |-- caridriver/                             (CariDriverApp, PesananSayaApp, DriverCard, OpenRequestForm, CustomerOrderPanel)
|   |-- driver/                                 (DriverApp, TripForm, ActiveTripList, WalletApp, DeliveryProofForm)|   |-- orders/
|   |   |-- OrderFlowProvider.tsx               (state controller tunggal)
|   |   |-- OrderFlowModal.tsx                  (memilih isi modal berdasarkan status)
|   |   |-- PopUpTitip.tsx
|   |   |-- PaymentMethode.tsx
|   |   |-- LiveProgress.tsx
|   |   |-- PopUpSuccess.tsx
|   |   |-- PopUpCancel.tsx
|   |   |-- DriverPricingModal.tsx
|   |   `-- CountdownTimer.tsx
|   |-- chat/
|   |   `-- ChatModal.tsx                       (obrolan trip atau order, polling 4 detik)
|   `-- notifications/                          (NotificationBell, NotificationDrawer)
|-- hooks/
|   |-- useOrder.ts
|   |-- useNotifications.ts
|   |-- useCountdown.ts
|   `-- useRegions.ts
|-- lib/
|   |-- prisma.ts                               (singleton)
|   |-- auth.ts                                 (konfigurasi Auth.js)
|   |-- session.ts                              (requireUser, requireRole)
|   |-- env.ts                                  (validasi env dengan Zod)
|   |-- http.ts                                 (apiHandler, AppError, format error)
|   |-- time.ts                                 (clock injectable, konstanta 5 menit)
|   |-- notifications.ts                        (notify())
|   |-- jobs.ts                                 (publish QStash, verifikasi signature)
|   |-- chat.ts                                 (startConversation, listMessages, sendMessage)
|   |-- storage/
|   |   |-- index.ts                            (interface StorageProvider)
|   |   |-- validate-image.ts                   (magic bytes, ukuran, EXIF strip)
|   |   `-- supabase.ts atau cloudinary.ts
|   |-- payments/
|   |   |-- index.ts                            (interface PaymentGateway)
|   |   `-- mock.ts
|   `-- orders/
|       |-- state-machine.ts
|       |-- pricing.ts
|       |-- expiry.ts
|       `-- service.ts                          (createOrder, setPrice, payOrder, ... )
|-- types/
|   |-- api.ts                                  (tipe respons)
|   `-- schemas/                                (Zod: auth.ts, trip.ts, order.ts, upload.ts, chat.ts)
|-- tests/
|   |-- unit/
|   |-- integration/
|   `-- e2e/
`-- vitest.config.ts, playwright.config.ts, .env.example
```

### 1.3 Aturan Lapisan

1. `app/api/**/route.ts`: parse body dengan Zod, panggil `requireUser()` atau `requireRole()`, panggil fungsi di `lib/orders/service.ts`, kembalikan JSON. Tidak ada query Prisma langsung untuk mutasi order di route.
2. `lib/orders/service.ts`: satu-satunya tempat yang memanggil `transition()` dan mengubah saldo.
3. `components/**`: tidak mengimpor `lib/prisma` atau `lib/orders/*`. Komponen hanya memakai hooks dan `fetch` ke `/api`.
4. Komponen peta hanya diimpor lewat `components/map/MapView.tsx`.

### 1.4 Variabel Lingkungan (`.env.example`)

```
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
NEXTAUTH_URL=
STORAGE_PROVIDER=supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET_ITEMS=order-items
SUPABASE_BUCKET_PROOFS=delivery-proofs
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
CRON_SECRET=
APP_URL=
PLATFORM_FEE_BPS=500
PAYMENT_WINDOW_SECONDS=300
PAYMENT_PROVIDER=mock
VERIFICATION_REQUIRED=false
```

---

## 2. Skema Database (Prisma)

Database: PostgreSQL. Tabel keuangan memakai `onDelete: Restrict` agar riwayat transaksi tidak hilang. User tidak dihapus fisik, gunakan `deletedAt`.

### 2.1 `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ---------- Enum ----------

enum Role {
  CUSTOMER
  DRIVER
}

enum ServiceType {
  JASTIP          // Jasa Titip Barang
  ANTAR_JEMPUT    // Antar Jemput Barang
}

enum VerificationStatus {
  PENDING
  VERIFIED
  REJECTED
}

enum OrderStatus {
  DRAFT
  WAITING_DRIVER_PRICING
  WAITING_CUSTOMER_PAYMENT
  PAID_HELD_IN_ESCROW
  IN_TRANSIT
  DELIVERED_PENDING_CONFIRMATION
  COMPLETED
  CANCELLED_EXPIRED
  REJECTED_BY_CUSTOMER
  REJECTED_BY_DRIVER
  DISPUTED
  REFUNDED
}

enum PaymentMethod {
  QRIS
  VIRTUAL_ACCOUNT
  MOCK_TRANSFER
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  EXPIRED
  REFUNDED
}

enum EscrowStatus {
  HELD
  RELEASED
  REFUNDED
}

enum NotificationType {
  ORDER_REQUESTED
  PRICE_SET
  PAYMENT_RECEIVED
  ORDER_EXPIRED
  ORDER_REJECTED
  ORDER_STARTED
  ORDER_DELIVERED
  ORDER_COMPLETED
  FUNDS_RELEASED
  ORDER_DISPUTED
  OPEN_REQUEST_CLAIMED
}

enum WalletTxType {
  ESCROW_RELEASE
  WITHDRAWAL
  ADJUSTMENT
}

enum OpenRequestStatus {
  OPEN
  CLAIMED
  CLOSED
}

enum ActorType {
  CUSTOMER
  DRIVER
  SYSTEM
  ADMIN
}

// ---------- Auth ----------

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified DateTime?
  passwordHash  String
  image         String?
  phone         String?
  role          Role
  deletedAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts       Account[]
  sessions       Session[]
  driverProfile  DriverProfile?
  customerOrders Order[]         @relation("CustomerOrders")
  openRequests   OpenRequest[]
  notifications  Notification[]
  wallet         Wallet?
  conversations  Conversation[]  @relation("CustomerConversations")
  messages       Message[]

  @@index([role])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ---------- Driver dan Trip ----------

model DriverProfile {
  id                 String             @id @default(cuid())
  userId             String             @unique
  vehicleType        String
  vehiclePlate       String?
  whatsappNumber     String             // format E.164 tanpa tanda plus, contoh 6281234567890
  verificationStatus VerificationStatus @default(PENDING)
  verifiedAt         DateTime?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  user   User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  trips  TripListing[]
  orders Order[]       @relation("DriverOrders")
  conversations Conversation[]
}

model TripListing {
  id               String      @id @default(cuid())
  driverId         String
  serviceType      ServiceType

  originProvince   String
  originCityCode   String
  originCity       String
  originLat        Float
  originLng        Float

  destProvince     String
  destCityCode     String
  destCity         String
  destLat          Float
  destLng          Float

  baseFee          Int         // tarif minimum jasa, Rupiah
  departureAt      DateTime?
  notes            String?
  isActive         Boolean     @default(true)
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  driver DriverProfile @relation(fields: [driverId], references: [id], onDelete: Cascade)
  orders Order[]

  @@index([originCityCode, destCityCode, isActive])
  @@index([driverId, isActive])
  @@index([serviceType, isActive])
  conversations Conversation[]
}

model OpenRequest {
  id             String            @id @default(cuid())
  customerId     String
  serviceType    ServiceType
  originCityCode String
  originCity     String
  destCityCode   String
  destCity       String
  description    String
  imageUrl       String?
  status         OpenRequestStatus @default(OPEN)
  expiresAt      DateTime
  createdAt      DateTime          @default(now())

  customer User    @relation(fields: [customerId], references: [id], onDelete: Restrict)
  order    Order?

  @@index([originCityCode, destCityCode, status])
  @@index([customerId])
}

// ---------- Chat ----------

model Conversation {
  id         String   @id @default(cuid())
  customerId String
  driverId   String
  tripId     String?
  orderId    String?  @unique
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  customer User          @relation("CustomerConversations", fields: [customerId], references: [id], onDelete: Restrict)
  driver   DriverProfile @relation(fields: [driverId], references: [id], onDelete: Restrict)
  trip     TripListing?  @relation(fields: [tripId], references: [id], onDelete: SetNull)
  order    Order?        @relation(fields: [orderId], references: [id], onDelete: SetNull)

  messages Message[]

  @@unique([customerId, driverId])
  @@index([customerId, updatedAt(sort: Desc)])
  @@index([driverId, updatedAt(sort: Desc)])
  @@index([tripId])
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  senderId       String
  body           String   @db.VarChar(1000)
  createdAt      DateTime @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender       User         @relation(fields: [senderId], references: [id], onDelete: Restrict)

  @@index([conversationId, createdAt])
  @@index([senderId])
}

// ---------- Order dan Pembayaran ----------

model Order {
  id             String      @id @default(cuid())
  customerId     String
  driverId       String
  tripId         String?
  openRequestId  String?     @unique
  status         OrderStatus @default(WAITING_DRIVER_PRICING)

  customerNote   String?
  itemSubtotal   Int?        // jumlah harga final seluruh barang
  serviceFee     Int?        // ongkos jasa/ongkir yang disepakati
  platformFee    Int?        // fee platform, dibebankan ke customer
  totalAmount    Int?        // itemSubtotal + serviceFee + platformFee

  pricedAt         DateTime?
  paymentDeadline  DateTime?   // pricedAt + 5 menit
  paidAt           DateTime?
  startedAt        DateTime?
  deliveredAt      DateTime?
  completedAt      DateTime?
  closedAt         DateTime?   // waktu masuk status final non-sukses
  closeReason      String?

  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  customer     User          @relation("CustomerOrders", fields: [customerId], references: [id], onDelete: Restrict)
  driver       DriverProfile @relation("DriverOrders", fields: [driverId], references: [id], onDelete: Restrict)
  trip         TripListing?  @relation(fields: [tripId], references: [id], onDelete: SetNull)
  openRequest  OpenRequest?  @relation(fields: [openRequestId], references: [id], onDelete: SetNull)

  items          OrderItem[]
  payment        Payment?
  escrow         EscrowTransaction?
  deliveryProof  DeliveryProof?
  notifications  Notification[]
  statusLogs     OrderStatusLog[]
  conversation   Conversation?

  @@index([customerId, status, createdAt(sort: Desc)])
  @@index([driverId, status, createdAt(sort: Desc)])
  @@index([status, paymentDeadline])   // dipakai scan order hangus
  @@index([tripId])
}

model OrderItem {
  id             String  @id @default(cuid())
  orderId        String
  name           String
  description    String?
  imageUrl       String
  quantity       Int     @default(1)
  estimatedPrice Int?    // perkiraan dari customer, opsional
  finalPrice     Int?    // total harga final baris ini, diisi driver

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
}

model Payment {
  id             String        @id @default(cuid())
  orderId        String        @unique
  method         PaymentMethod
  status         PaymentStatus @default(PENDING)
  amount         Int
  gatewayRef     String?       @unique
  idempotencyKey String        @unique
  expiresAt      DateTime
  paidAt         DateTime?
  rawPayload     Json?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  order  Order              @relation(fields: [orderId], references: [id], onDelete: Restrict)
  escrow EscrowTransaction?
}

model EscrowTransaction {
  id          String       @id @default(cuid())
  orderId     String       @unique
  paymentId   String       @unique
  amount      Int          // dana yang ditahan (totalAmount)
  platformFee Int
  status      EscrowStatus @default(HELD)
  heldAt      DateTime     @default(now())
  releasedAt  DateTime?
  refundedAt  DateTime?

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Restrict)
  payment Payment @relation(fields: [paymentId], references: [id], onDelete: Restrict)

  @@index([status])
}

model DeliveryProof {
  id          String   @id @default(cuid())
  orderId     String   @unique
  imageUrl    String
  note        String?
  deliveredAt DateTime @default(now())

  order Order @relation(fields: [orderId], references: [id], onDelete: Restrict)
}

model OrderStatusLog {
  id         String       @id @default(cuid())
  orderId    String
  fromStatus OrderStatus?
  toStatus   OrderStatus
  actorType  ActorType
  actorId    String?
  reason     String?
  createdAt  DateTime     @default(now())

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId, createdAt])
}

// ---------- Notifikasi ----------

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  body      String
  orderId   String?
  readAt    DateTime?
  createdAt DateTime         @default(now())

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  order Order? @relation(fields: [orderId], references: [id], onDelete: SetNull)

  @@index([userId, readAt, createdAt(sort: Desc)])
}

// ---------- Dompet ----------

model Wallet {
  id        String   @id @default(cuid())
  userId    String   @unique
  balance   Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user         User            @relation(fields: [userId], references: [id], onDelete: Restrict)
  transactions WalletTransaction[]
}

model WalletTransaction {
  id           String       @id @default(cuid())
  walletId     String
  type         WalletTxType
  amount       Int          // positif untuk masuk, negatif untuk keluar
  balanceAfter Int
  orderId      String?
  escrowId     String?      @unique   // mencegah rilis ganda di level database
  note         String?
  createdAt    DateTime     @default(now())

  wallet Wallet @relation(fields: [walletId], references: [id], onDelete: Restrict)

  @@index([walletId, createdAt(sort: Desc)])
}
```

### 2.2 Migration SQL Tambahan (`0002_constraints`)

Prisma tidak mendukung CHECK constraint secara native. Tambahkan lewat migration manual:

```sql
ALTER TABLE "Wallet" ADD CONSTRAINT wallet_balance_non_negative CHECK ("balance" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT order_amounts_non_negative CHECK (
  ("itemSubtotal" IS NULL OR "itemSubtotal" >= 0) AND
  ("serviceFee" IS NULL OR "serviceFee" >= 0) AND
  ("platformFee" IS NULL OR "platformFee" >= 0) AND
  ("totalAmount" IS NULL OR "totalAmount" >= 0)
);
ALTER TABLE "Order" ADD CONSTRAINT order_total_consistent CHECK (
  "totalAmount" IS NULL OR "totalAmount" = "itemSubtotal" + "serviceFee" + "platformFee"
);
CREATE INDEX order_pending_payment_idx ON "Order" ("paymentDeadline")
  WHERE "status" = 'WAITING_CUSTOMER_PAYMENT';
CREATE UNIQUE INDEX "Conversation_customerId_driverId_key" ON "Conversation" ("customerId", "driverId");
```

### 2.3 Catatan Skema

- `OrderItem` hanya menyimpan `finalPrice` per baris. Ongkos jasa disimpan di `Order.serviceFee` karena satu order punya satu ongkos, bukan satu per barang.
- `Order.driverId` wajib. Postingan terbuka (`OpenRequest`) baru menjadi `Order` saat driver mengklaimnya.
- `WalletTransaction.escrowId` unik: bahkan jika ada bug di service, rilis dana kedua untuk escrow yang sama ditolak database.
- `OrderStatusLog` adalah audit trail. Setiap `transition()` menulis satu baris.
- Wallet driver dibuat saat registrasi driver, dalam transaksi yang sama dengan pembuatan `DriverProfile`.
- `Conversation` unik per pasangan customer dan driver, sedangkan `orderId` tetap unik untuk konteks order terakhir. Riwayat percakapan tidak terputus saat customer membuka trip lain dengan driver yang sama. Trip dan order terakhir disimpan pada percakapan yang sama; order baru menimpa konteks order lama.
- `Message.body` dibatasi 1000 karakter di Zod dan `VarChar(1000)` di database. Pesan tidak dapat diubah atau dihapus dari UI.

---

## 3. State Machine dan Siklus Transaksi

### 3.1 Diagram Alur

```
                   (Customer submit)
   DRAFT ------------------------------> WAITING_DRIVER_PRICING
                                              |            \
                                 (Driver set-price)         \ (Driver reject)
                                              v              v
                                 WAITING_CUSTOMER_PAYMENT   REJECTED_BY_DRIVER
                                  |        |          \
                    (Customer bayar        |           \ (Sistem: now >= paymentDeadline)
                     sebelum deadline)     |            v
                                  |        |      CANCELLED_EXPIRED
                                  |        | (Customer tolak)
                                  |        v
                                  |   REJECTED_BY_CUSTOMER
                                  v
                         PAID_HELD_IN_ESCROW
                                  |
                       (Driver mulai perjalanan)
                                  v
                              IN_TRANSIT
                                  |
                  (Driver upload bukti serah terima)
                                  v
                  DELIVERED_PENDING_CONFIRMATION
                        |                  \
        (Customer tekan                     \ (Customer ajukan sengketa)
         "Pesanan Selesai")                  v
                        v                 DISPUTED ---> COMPLETED (admin, dana ke driver)
                   COMPLETED                        \--> REFUNDED  (admin, dana ke customer)
              (dana dirilis ke wallet)
```

`DISPUTED` juga dapat dicapai dari `PAID_HELD_IN_ESCROW` dan `IN_TRANSIT` (customer atau driver).

### 3.2 Tabel Transisi dan Hak Akses

| Dari | Ke | Aktor | Syarat tambahan | Efek samping |
|------|----|-------|-----------------|--------------|
| `DRAFT` | `WAITING_DRIVER_PRICING` | Customer pemilik | Minimal 1 item dengan gambar | Notifikasi `ORDER_REQUESTED` ke driver |
| `WAITING_DRIVER_PRICING` | `WAITING_CUSTOMER_PAYMENT` | Driver pemilik order | `serviceFee >= trip.baseFee` bila ada trip; semua item punya `finalPrice` | Set `pricedAt`, `paymentDeadline = now + 300s`, hitung total, notifikasi `PRICE_SET`, jadwalkan job expiry |
| `WAITING_DRIVER_PRICING` | `REJECTED_BY_DRIVER` | Driver pemilik order | - | Notifikasi `ORDER_REJECTED` ke customer |
| `WAITING_DRIVER_PRICING` | `REJECTED_BY_CUSTOMER` | Customer pemilik | - | Notifikasi ke driver |
| `WAITING_CUSTOMER_PAYMENT` | `PAID_HELD_IN_ESCROW` | Sistem (dipicu customer/webhook) | `now < paymentDeadline` | Buat `Payment` PAID dan `EscrowTransaction` HELD, notifikasi `PAYMENT_RECEIVED` |
| `WAITING_CUSTOMER_PAYMENT` | `CANCELLED_EXPIRED` | Sistem | `now >= paymentDeadline` | Payment `EXPIRED` bila ada, notifikasi `ORDER_EXPIRED` ke kedua pihak |
| `WAITING_CUSTOMER_PAYMENT` | `REJECTED_BY_CUSTOMER` | Customer pemilik | - | Notifikasi ke driver |
| `PAID_HELD_IN_ESCROW` | `IN_TRANSIT` | Driver pemilik order | - | Set `startedAt`, notifikasi `ORDER_STARTED` |
| `IN_TRANSIT` | `DELIVERED_PENDING_CONFIRMATION` | Driver pemilik order | Bukti foto valid | Buat `DeliveryProof`, set `deliveredAt`, notifikasi `ORDER_DELIVERED` |
| `DELIVERED_PENDING_CONFIRMATION` | `COMPLETED` | Customer pemilik | Escrow `HELD` | Rilis escrow, kredit wallet driver, notifikasi `FUNDS_RELEASED` |
| `PAID_HELD_IN_ESCROW`, `IN_TRANSIT`, `DELIVERED_PENDING_CONFIRMATION` | `DISPUTED` | Customer atau driver pemilik | Alasan wajib diisi | Dana tetap ditahan, notifikasi `ORDER_DISPUTED` |
| `DISPUTED` | `COMPLETED` atau `REFUNDED` | Admin | - | Di luar lingkup UI v1, dijalankan lewat script internal |

Aturan umum:
- Semua transisi yang tidak tercantum di tabel ditolak dengan `409 INVALID_TRANSITION`.
- Status final: `COMPLETED`, `CANCELLED_EXPIRED`, `REJECTED_BY_CUSTOMER`, `REJECTED_BY_DRIVER`, `REFUNDED`. Tidak ada transisi keluar dari status final.
- Driver tidak pernah bisa memicu rilis dana. Rilis dana hanya terjadi sebagai efek samping `DELIVERED_PENDING_CONFIRMATION -> COMPLETED` oleh customer.
- Auto-complete oleh sistem tidak ada di v1. Keputusan terbuka: apakah dana dirilis otomatis setelah N hari tanpa respons customer. Jika ditambahkan, tambahkan transisi `DELIVERED_PENDING_CONFIRMATION -> COMPLETED` dengan aktor `SYSTEM` dan perbarui dokumen ini.

### 3.3 Implementasi `lib/orders/state-machine.ts`

```ts
import { OrderStatus as S, ActorType, Prisma } from "@prisma/client";
import { AppError } from "@/lib/http";

type Actor = ActorType;

export const TRANSITIONS: Record<S, Partial<Record<S, Actor[]>>> = {
  DRAFT: { WAITING_DRIVER_PRICING: ["CUSTOMER"] },
  WAITING_DRIVER_PRICING: {
    WAITING_CUSTOMER_PAYMENT: ["DRIVER"],
    REJECTED_BY_DRIVER: ["DRIVER"],
    REJECTED_BY_CUSTOMER: ["CUSTOMER"],
  },
  WAITING_CUSTOMER_PAYMENT: {
    PAID_HELD_IN_ESCROW: ["SYSTEM"],
    CANCELLED_EXPIRED: ["SYSTEM"],
    REJECTED_BY_CUSTOMER: ["CUSTOMER"],
  },
  PAID_HELD_IN_ESCROW: { IN_TRANSIT: ["DRIVER"], DISPUTED: ["CUSTOMER", "DRIVER"] },
  IN_TRANSIT: { DELIVERED_PENDING_CONFIRMATION: ["DRIVER"], DISPUTED: ["CUSTOMER", "DRIVER"] },
  DELIVERED_PENDING_CONFIRMATION: { COMPLETED: ["CUSTOMER"], DISPUTED: ["CUSTOMER"] },
  DISPUTED: { COMPLETED: ["ADMIN"], REFUNDED: ["ADMIN"] },
  COMPLETED: {},
  CANCELLED_EXPIRED: {},
  REJECTED_BY_CUSTOMER: {},
  REJECTED_BY_DRIVER: {},
  REFUNDED: {},
};

export function assertTransition(from: S, to: S, actor: Actor) {
  const allowed = TRANSITIONS[from]?.[to];
  if (!allowed || !allowed.includes(actor)) {
    throw new AppError(409, "INVALID_TRANSITION", `Transisi ${from} -> ${to} oleh ${actor} tidak diizinkan`);
  }
}

type TransitionInput = {
  orderId: string;
  from: S;
  to: S;
  actor: { type: Actor; id?: string };
  data?: Prisma.OrderUpdateManyMutationInput;
  extraWhere?: Prisma.OrderWhereInput;   // contoh: { paymentDeadline: { gt: now } }
  reason?: string;
};

export async function transition(tx: Prisma.TransactionClient, i: TransitionInput) {
  assertTransition(i.from, i.to, i.actor.type);
  const res = await tx.order.updateMany({
    where: { id: i.orderId, status: i.from, ...i.extraWhere },
    data: { status: i.to, ...i.data },
  });
  if (res.count !== 1) {
    throw new AppError(409, "ORDER_STATE_CONFLICT", "Status order sudah berubah atau syarat transisi tidak terpenuhi");
  }
  await tx.orderStatusLog.create({
    data: {
      orderId: i.orderId, fromStatus: i.from, toStatus: i.to,
      actorType: i.actor.type, actorId: i.actor.id, reason: i.reason,
    },
  });
}
```

Update bersyarat pada `updateMany` bertindak sebagai kunci: dua request bersamaan untuk order yang sama, hanya satu yang mendapat `count === 1`.

### 3.4 Kalkulasi Harga `lib/orders/pricing.ts`

```ts
export function calcTotals(input: { itemPrices: number[]; serviceFee: number; feeBps: number }) {
  const { itemPrices, serviceFee, feeBps } = input;
  if (![...itemPrices, serviceFee].every(Number.isInteger)) throw new Error("NON_INTEGER_AMOUNT");
  const itemSubtotal = itemPrices.reduce((a, b) => a + b, 0);
  const platformFee = Math.floor((serviceFee * feeBps) / 10_000);
  const totalAmount = itemSubtotal + serviceFee + platformFee;
  const driverPayout = itemSubtotal + serviceFee;       // totalAmount - platformFee
  return { itemSubtotal, serviceFee, platformFee, totalAmount, driverPayout };
}
```

Batas validasi: `finalPrice` 0 sampai 50.000.000 per item, `serviceFee` 0 sampai 10.000.000. Angka di luar batas ditolak `422`.

---

## 4. Spesifikasi Kontrak API

### 4.1 Konvensi

- Base path: `/api`. Format JSON, UTF-8. Waktu dalam ISO 8601 UTC.
- Autentikasi: cookie sesi Auth.js (httpOnly, secure, sameSite=lax). Endpoint bertanda `Auth` wajib sesi valid.
- Semua respons sukses: `{ "data": ... }`. Semua respons gagal:

```json
{ "error": { "code": "ORDER_STATE_CONFLICT", "message": "Teks untuk pengguna", "details": {} } }
```

- Kode galat umum: `400 BAD_REQUEST`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 INVALID_TRANSITION | ORDER_STATE_CONFLICT`, `410 PAYMENT_DEADLINE_PASSED`, `413 FILE_TOO_LARGE`, `415 UNSUPPORTED_MEDIA_TYPE`, `422 VALIDATION_ERROR`, `429 RATE_LIMITED`.
- Order milik orang lain mengembalikan `404`, bukan `403`, agar ID tidak bisa ditebak (mencegah IDOR).
- Semua endpoint mutasi order memakai `Content-Type: application/json`, kecuali `/api/uploads`.
- Respons order selalu menyertakan `serverTime` agar countdown client akurat.

### 4.2 Auth

`POST /api/auth/register` (publik, rate limit 5 per menit per IP)

```json
// Request
{
  "name": "Budi Santoso",
  "email": "budi@mail.com",
  "password": "min 8 karakter, 1 huruf, 1 angka",
  "phone": "081234567890",
  "role": "DRIVER",
  "driver": { "vehicleType": "Motor", "vehiclePlate": "H 1234 AB", "whatsappNumber": "6281234567890" }
}
// 201
{ "data": { "id": "clx...", "role": "DRIVER", "email": "budi@mail.com" } }
```

Aturan: `driver` wajib bila `role = DRIVER`, dilarang bila `CUSTOMER`. Email unik (`409 EMAIL_TAKEN`). Password di-hash dengan argon2id (`@node-rs/argon2`) atau bcrypt cost 12. Pembuatan `User`, `DriverProfile`, dan `Wallet` dalam satu `$transaction`.

`POST /api/auth/callback/credentials` (disediakan Auth.js, dipanggil lewat `signIn("credentials", ...)`)
Body: `email`, `password`. Gagal: pesan generik `INVALID_CREDENTIALS` (tidak membedakan email salah atau password salah). Rate limit 10 per menit per IP+email.

`GET /api/me` (Auth)

```json
{ "data": { "id": "clx...", "name": "Budi", "email": "...", "role": "DRIVER",
            "driverProfile": { "id": "clx...", "verificationStatus": "VERIFIED", "whatsappNumber": "628..." } } }
```

### 4.3 Upload

`POST /api/uploads` (Auth, `multipart/form-data`)

Field: `file` (binary), `purpose` (`ITEM` atau `PROOF`).
- `ITEM`: hanya CUSTOMER. `PROOF`: hanya DRIVER.
- Validasi: lihat bagian 6.1.

```json
// 201
{ "data": { "url": "https://.../order-items/2026/11/abc123.webp", "key": "order-items/2026/11/abc123.webp" } }
```

### 4.4 Trip

`POST /api/trips` (Auth, DRIVER; wajib `VERIFIED` jika `VERIFICATION_REQUIRED=true`)

```json
{
  "serviceType": "JASTIP",
  "origin": { "provinceCode": "33", "cityCode": "3374", "province": "Jawa Tengah", "city": "Kota Semarang", "lat": -6.9667, "lng": 110.4167 },
  "destination": { "provinceCode": "32", "cityCode": "3273", "province": "Jawa Barat", "city": "Kota Bandung", "lat": -6.9175, "lng": 107.6191 },
  "baseFee": 25000,
  "departureAt": "2026-11-15T07:00:00Z",
  "notes": "Bisa titip barang kecil sampai sedang"
}
```

Server mengabaikan `lat`/`lng`/nama dari client dan mengisi ulang dari `data/regions` berdasarkan `cityCode` (client tidak dipercaya untuk data wilayah). `201` mengembalikan objek trip.

Trip dalam satu kota diperbolehkan. Contohnya driver membuka jastip dari mall ke restoran di kota yang sama. `origin.cityCode` dan `destination.cityCode` boleh identik.

`GET /api/trips?originCityCode=3374&destCityCode=3273&serviceType=JASTIP&page=1&pageSize=20` (Auth)

```json
{ "data": { "items": [
    { "id": "...", "serviceType": "JASTIP", "originCity": "Kota Semarang", "destCity": "Kota Bandung",
      "baseFee": 25000, "departureAt": "...", "notes": "...",
      "driver": { "id": "...", "name": "Budi", "vehicleType": "Motor", "verified": true } } ],
    "page": 1, "pageSize": 20, "total": 3 } }
```

Nomor WhatsApp driver tidak ada di daftar. Nomor hanya dikembalikan oleh `GET /api/trips/[id]/contact` (Auth, CUSTOMER) agar tidak bisa di-scrape massal. Endpoint kontak dibatasi 30 request per menit per user.

Kartu driver di halaman customer menampilkan tombol `WhatsApp` dan `Chat`. Tombol `WhatsApp` baru memanggil endpoint kontak saat ditekan, lalu menampilkan nomor dan tautan `https://wa.me/{nomor}`. Nomor tidak pernah ikut dalam payload `GET /api/trips`. Tombol `Chat` membuka `ChatModal` dan membuat percakapan lewat `POST /api/conversations` dengan `tripId`.

`GET /api/trips/mine` (Auth, DRIVER): daftar trip milik driver, termasuk jumlah order aktif.
`PATCH /api/trips/[id]` (Auth, DRIVER pemilik): body `{ "isActive": false }`.

### 4.5 Postingan Terbuka

`POST /api/open-requests` (Auth, CUSTOMER): body `{ serviceType, originCityCode, destCityCode, description, imageUrl? }`. `expiresAt` otomatis 7 hari.
`GET /api/open-requests?originCityCode=&destCityCode=` (Auth, DRIVER): daftar status `OPEN`.
`POST /api/open-requests/[id]/claim` (Auth, DRIVER): membuat `Order` berstatus `WAITING_DRIVER_PRICING` dengan `openRequestId`, mengubah request menjadi `CLAIMED` secara atomik (`updateMany where status = OPEN`).

### 4.6 Order

`POST /api/orders` (Auth, CUSTOMER)

```json
// Request
{
  "tripId": "clx...",
  "customerNote": "Tolong cari ukuran L",
  "items": [
    { "name": "Bakpia Pathok 25", "description": "Rasa kacang hijau", "imageUrl": "https://.../abc.webp", "quantity": 2, "estimatedPrice": 60000 }
  ]
}
// 201
{ "data": { "id": "ord_1", "status": "WAITING_DRIVER_PRICING", "tripId": "clx...", "items": [ ... ],
            "paymentDeadline": null, "serverTime": "2026-11-10T03:00:00.000Z" } }
```

Validasi: 1 sampai 10 item, `imageUrl` harus berasal dari host storage yang dikonfigurasi, trip harus `isActive`, `driverId` diambil dari trip (bukan dari body). Efek: notifikasi `ORDER_REQUESTED` ke driver.

`GET /api/orders?role=customer|driver&status=...&cursor=...` (Auth): hanya order milik pemanggil.
`GET /api/orders/[id]` (Auth, customer atau driver pemilik): detail lengkap. Menjalankan `expireIfNeeded()` sebelum membaca (lazy expiry).

`PATCH /api/orders/[id]/set-price` (Auth, DRIVER pemilik)

```json
// Request
{ "items": [ { "id": "item_1", "finalPrice": 55000 } ], "serviceFee": 25000 }
// 200
{ "data": { "id": "ord_1", "status": "WAITING_CUSTOMER_PAYMENT",
            "itemSubtotal": 55000, "serviceFee": 25000, "platformFee": 1250, "totalAmount": 81250,
            "pricedAt": "2026-11-10T03:05:00.000Z", "paymentDeadline": "2026-11-10T03:10:00.000Z",
            "serverTime": "2026-11-10T03:05:00.000Z" } }
```

Galat: `409 INVALID_TRANSITION` bila status bukan `WAITING_DRIVER_PRICING`, `422` bila item tidak lengkap atau fee di bawah `trip.baseFee`.

`POST /api/orders/[id]/pay` (Auth, CUSTOMER pemilik)

```json
// Request
{ "method": "QRIS", "idempotencyKey": "uuid-v4-dari-client" }
// 200 (mock: langsung PAID)
{ "data": { "status": "PAID_HELD_IN_ESCROW", "payment": { "status": "PAID", "amount": 81250, "method": "QRIS" },
            "escrow": { "status": "HELD" } } }
```

Galat:
- `410 PAYMENT_DEADLINE_PASSED`: `now >= paymentDeadline`. Order sekaligus diubah ke `CANCELLED_EXPIRED`.
- `409 ORDER_STATE_CONFLICT`: sudah dibayar atau dibatalkan.
- Idempotensi: `idempotencyKey` yang sama untuk order yang sama mengembalikan hasil pembayaran sebelumnya, bukan membuat pembayaran baru.

`POST /api/orders/[id]/reject` (Auth, pemilik): body `{ "reason": "opsional" }`. Customer: dari `WAITING_DRIVER_PRICING` atau `WAITING_CUSTOMER_PAYMENT`. Driver: dari `WAITING_DRIVER_PRICING`.

`POST /api/orders/[id]/start` (Auth, DRIVER pemilik): tanpa body. `PAID_HELD_IN_ESCROW -> IN_TRANSIT`.

`POST /api/orders/[id]/deliver` (Auth, DRIVER pemilik)

```json
{ "imageUrl": "https://.../delivery-proofs/xyz.webp", "note": "Diterima langsung oleh customer di Jl. ..." }
```

`IN_TRANSIT -> DELIVERED_PENDING_CONFIRMATION`. `imageUrl` wajib dari bucket `delivery-proofs`.

`POST /api/orders/[id]/complete` (Auth, CUSTOMER pemilik)

```json
// 200
{ "data": { "status": "COMPLETED", "escrow": { "status": "RELEASED", "releasedAt": "..." },
            "driverPayout": 80000 } }
```

Seluruh proses dalam satu `prisma.$transaction` (lihat 4.9). Memanggil dua kali: panggilan kedua mendapat `409 ORDER_STATE_CONFLICT`, saldo tidak bertambah dua kali.

`POST /api/orders/[id]/dispute` (Auth, pemilik): body `{ "reason": "min 10 karakter" }`.

### 4.7 Notifikasi

`GET /api/notifications?unread=true&limit=20&cursor=...` (Auth)

```json
{ "data": { "items": [
    { "id": "n1", "type": "PRICE_SET", "title": "Harga sudah ditentukan", "body": "Total Rp81.250. Bayar sebelum 10:10.",
      "orderId": "ord_1", "readAt": null, "createdAt": "..." } ],
    "unreadCount": 1, "nextCursor": null, "serverTime": "..." } }
```

`PATCH /api/notifications/[id]/read` (Auth, pemilik): set `readAt = now()`. Idempoten.
`PATCH /api/notifications/read-all` (Auth).

Pengiriman ke client: polling SWR setiap 8 detik saat tab aktif (`refreshInterval`, pause saat tab tersembunyi). SSE atau WebSocket dapat ditambahkan nanti tanpa mengubah kontrak.

### 4.8 Wallet

`GET /api/wallet` (Auth, DRIVER): `{ balance, transactions: [...] }` dengan paginasi.
`POST /api/wallet/withdraw` (Auth, DRIVER): body `{ amount, bankCode, accountNumber }`. V1: mock, mengurangi saldo secara atomik (`updateMany where balance >= amount`) dan mencatat `WalletTransaction` bertipe `WITHDRAWAL`. Nomor rekening tidak disimpan di database.

### 4.9 Contoh Implementasi Inti

Pembayaran (`lib/orders/service.ts`). Catatan penting: melempar galat di dalam `$transaction` akan me-rollback perubahan, termasuk perubahan status ke `CANCELLED_EXPIRED`. Karena itu hasil "kadaluarsa" dikembalikan sebagai nilai, dan galat dilempar setelah transaksi commit.

```ts
export async function payOrder(userId: string, orderId: string, input: PayInput, clock = new Date()) {
  const outcome = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { id: orderId, customerId: userId } });
    if (!order) throw new AppError(404, "NOT_FOUND", "Order tidak ditemukan");

    const existing = await tx.payment.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing && existing.orderId === order.id) return { kind: "ok" as const, order, payment: existing };

    if (order.status !== "WAITING_CUSTOMER_PAYMENT") {
      throw new AppError(409, "ORDER_STATE_CONFLICT", "Order tidak menunggu pembayaran");
    }
    if (!order.paymentDeadline || order.paymentDeadline <= clock) {
      await transition(tx, {
        orderId, from: "WAITING_CUSTOMER_PAYMENT", to: "CANCELLED_EXPIRED",
        actor: { type: "SYSTEM" }, data: { closedAt: clock, closeReason: "PAYMENT_TIMEOUT" },
        extraWhere: { paymentDeadline: { lte: clock } },
      });
      await notifyExpired(tx, order);
      return { kind: "expired" as const };
    }

    const gw = await paymentGateway.charge({ orderId, amount: order.totalAmount!, method: input.method });
    const payment = await tx.payment.create({
      data: { orderId, method: input.method, status: "PAID", amount: order.totalAmount!,
              gatewayRef: gw.ref, idempotencyKey: input.idempotencyKey,
              expiresAt: order.paymentDeadline, paidAt: clock },
    });
    await tx.escrowTransaction.create({
      data: { orderId, paymentId: payment.id, amount: order.totalAmount!, platformFee: order.platformFee!, status: "HELD" },
    });
    await transition(tx, {
      orderId, from: "WAITING_CUSTOMER_PAYMENT", to: "PAID_HELD_IN_ESCROW",
      actor: { type: "SYSTEM", id: userId }, data: { paidAt: clock },
      extraWhere: { paymentDeadline: { gt: clock } },
    });
    await notifyPaid(tx, order);
    return { kind: "ok" as const, order, payment };
  });

  if (outcome.kind === "expired") throw new AppError(410, "PAYMENT_DEADLINE_PASSED", "Waktu pembayaran 5 menit telah habis");
  return outcome;
}
```

Rilis dana:

```ts
export async function completeOrder(userId: string, orderId: string, clock = new Date()) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, customerId: userId },
      include: { driver: { select: { userId: true } } },
    });
    if (!order) throw new AppError(404, "NOT_FOUND", "Order tidak ditemukan");

    await transition(tx, {
      orderId, from: "DELIVERED_PENDING_CONFIRMATION", to: "COMPLETED",
      actor: { type: "CUSTOMER", id: userId }, data: { completedAt: clock },
    });

    const held = await tx.escrowTransaction.updateMany({
      where: { orderId, status: "HELD" },
      data: { status: "RELEASED", releasedAt: clock },
    });
    if (held.count !== 1) throw new AppError(409, "ESCROW_NOT_HELD", "Dana tidak berada dalam status ditahan");

    const escrow = await tx.escrowTransaction.findUniqueOrThrow({ where: { orderId } });
    const payout = escrow.amount - escrow.platformFee;

    const wallet = await tx.wallet.update({
      where: { userId: order.driver.userId },
      data: { balance: { increment: payout } },
    });
    await tx.walletTransaction.create({
      data: { walletId: wallet.id, type: "ESCROW_RELEASE", amount: payout,
              balanceAfter: wallet.balance, orderId, escrowId: escrow.id },
    });
    await notifyFundsReleased(tx, order, payout);
    return { status: "COMPLETED" as const, driverPayout: payout };
  });
}
```

### 4.10 Otorisasi per Endpoint

| Endpoint | CUSTOMER pemilik | DRIVER pemilik | Lainnya |
|----------|------------------|----------------|---------|
| `POST /orders` | ya | tidak | tidak |
| `PATCH /orders/[id]/set-price` | tidak | ya | tidak |
| `POST /orders/[id]/pay` | ya | tidak | tidak |
| `POST /orders/[id]/start` | tidak | ya | tidak |
| `POST /orders/[id]/deliver` | tidak | ya | tidak |
| `POST /orders/[id]/complete` | ya | tidak (`403`) | tidak |
| `POST /orders/[id]/dispute` | ya | ya | tidak |
| `GET /orders/[id]` | ya | ya | `404` |
| `POST /conversations` (`tripId`) | ya | tidak | tidak |
| `POST /conversations` (`orderId`) | ya | ya | `404` |
| `GET /conversations` | ya | ya | tidak |
| `GET /conversations/[id]/messages` | ya | ya | `404` |
| `POST /conversations/[id]/messages` | ya | ya | `404` |

### 4.11 Chat Customer dan Driver

Chat dipakai agar customer dapat menanyakan barang, ukuran, atau waktu tanpa harus membuka WhatsApp. Percakapan dapat dimulai dari kartu trip sebelum order dibuat, atau dari detail order.

`POST /api/conversations` (Auth)

```json
// Request dari kartu trip
{ "tripId": "clx..." }
// Request dari detail order
{ "orderId": "ord_1" }
// 200
{ "data": { "id": "conv_1", "tripId": "clx...", "orderId": null,
            "customer": { "id": "usr_c", "name": "Budi" },
            "driver": { "id": "drv_1", "user": { "id": "usr_d", "name": "Ardi" } },
            "trip": { "id": "clx...", "originCity": "Kota Semarang", "destCity": "Kota Bandung" },
            "order": null, "lastMessage": null } }
```

Aturan:
- `tripId` hanya boleh dikirim oleh CUSTOMER. Percakapan memakai customer pemanggil dan driver pemilik trip.
- `orderId` boleh dikirim oleh customer atau driver pemilik order. Percakapan memakai pasangan customer dan driver dari order.
- Hanya satu dari `tripId` atau `orderId` yang boleh diisi. Body dengan keduanya atau tanpa keduanya ditolak `422`.
- Jika percakapan untuk pasangan customer dan driver sudah ada, endpoint mengembalikan percakapan yang sama tanpa menghapus riwayat. Membuka dari trip lain hanya memperbarui `tripId` dan mengosongkan `orderId` agar obrolan tetap bisa dilanjutkan; membuka dari order memperbarui `tripId` dan `orderId`.
- Customer dapat membuka kembali percakapan lama dari daftar percakapan di halaman Pesanan Saya, dan driver dari daftar percakapan di dashboard.
- Resource milik pengguna lain mengembalikan `404`.

`GET /api/conversations` (Auth): daftar percakapan milik pemanggil, diurutkan `updatedAt` menurun, maksimum 50 item. Setiap item menyertakan `lastMessage`.

`GET /api/conversations/[id]/messages?limit=100` (Auth, peserta percakapan)

```json
{ "data": { "items": [
    { "id": "msg_1", "conversationId": "conv_1", "senderId": "usr_c",
      "sender": { "id": "usr_c", "name": "Budi" }, "body": "Bisa titip ukuran L?",
      "createdAt": "2026-11-10T03:00:00.000Z" } ],
    "serverTime": "2026-11-10T03:00:05.000Z" } }
```

`POST /api/conversations/[id]/messages` (Auth, peserta percakapan): body `{ "body": "teks 1 sampai 1000 karakter" }`, rate limit 30 pesan per menit per user. Status order final membuat percakapan hanya bisa dibaca dan endpoint mengembalikan `409 CHAT_CLOSED`.

Client memakai `ChatModal` dengan polling 4 detik saat modal terbuka, berhenti saat modal ditutup atau tab tersembunyi. Fokus keyboard masuk ke kolom pesan saat modal dibuka, `Escape` menutup modal, dan `Enter` mengirim pesan (Shift+Enter membuat baris baru).

---

## 5. Mekanisme Auto-Cancel 5 Menit

### 5.1 Prinsip

`paymentDeadline` di database adalah satu-satunya sumber kebenaran. Timer di client hanya tampilan. Tidak ada timer in-memory di server (serverless tidak menjamin proses hidup).

### 5.2 Empat Lapis Pengaman

| Lapis | Mekanisme | Fungsi |
|-------|-----------|--------|
| 1 | Server check di `payOrder` (`paymentDeadline > now` pada `where` update) | Menjamin pembayaran terlambat selalu ditolak, apa pun yang terjadi pada lapis lain |
| 2 | Lazy expiry: `expireIfNeeded(orderId)` dipanggil di `GET /orders/[id]`, `GET /orders`, dan `GET /notifications` | Status akurat saat dibaca walau worker gagal |
| 3 | Delayed job Upstash QStash dijadwalkan saat `set-price` dengan delay 300 detik, memanggil `/api/jobs/expire-order` | Pembatalan tepat waktu dan notifikasi terkirim |
| 4 | Cron fallback `/api/cron/expire-orders` setiap menit (Vercel Cron paket Pro, atau cron-job.org / GitHub Actions bila Hobby) | Menyapu order yang terlewat |

Vercel Hobby hanya mengizinkan cron harian. Jika memakai Hobby, lapis 3 adalah lapis utama dan lapis 4 dijalankan dari scheduler eksternal.

### 5.3 `lib/orders/expiry.ts`

```ts
export async function expireOrder(orderId: string, clock = new Date()) {
  return prisma.$transaction(async (tx) => {
    try {
      await transition(tx, {
        orderId, from: "WAITING_CUSTOMER_PAYMENT", to: "CANCELLED_EXPIRED",
        actor: { type: "SYSTEM" },
        data: { closedAt: clock, closeReason: "PAYMENT_TIMEOUT" },
        extraWhere: { paymentDeadline: { lte: clock } },
      });
    } catch (e) {
      if (e instanceof AppError && e.code === "ORDER_STATE_CONFLICT") return false; // sudah dibayar/dibatalkan/belum waktunya
      throw e;
    }
    await tx.payment.updateMany({ where: { orderId, status: "PENDING" }, data: { status: "EXPIRED" } });
    await notifyExpired(tx, orderId);
    return true;
  });
}

export async function expireIfNeeded(orderId: string) {
  return expireOrder(orderId); // aman dipanggil berulang: no-op bila tidak perlu
}

export async function sweepExpiredOrders(limit = 200) {
  const rows = await prisma.order.findMany({
    where: { status: "WAITING_CUSTOMER_PAYMENT", paymentDeadline: { lte: new Date() } },
    select: { id: true }, take: limit,
  });
  let expired = 0;
  for (const r of rows) if (await expireOrder(r.id)) expired++;
  return expired;
}
```

### 5.4 Penjadwalan QStash

```ts
// dipanggil setelah transaksi set-price commit
await qstash.publishJSON({
  url: `${env.APP_URL}/api/jobs/expire-order`,
  body: { orderId },
  delay: env.PAYMENT_WINDOW_SECONDS,   // 300
  retries: 3,
});
```

`/api/jobs/expire-order` memverifikasi signature QStash (`Receiver.verify`) sebelum memanggil `expireOrder`. `/api/cron/expire-orders` memverifikasi header `Authorization: Bearer ${CRON_SECRET}`. Kedua endpoint idempoten.

Kegagalan publish QStash tidak boleh menggagalkan `set-price`. Catat error, lapis 2 dan 4 tetap menjamin pembatalan.

### 5.5 Countdown di Client

Jam perangkat bisa salah. Hitung selisih dengan `serverTime`:

```ts
// hooks/useCountdown.ts
export function useCountdown(deadlineIso: string | null, serverTimeIso: string | null, onExpire: () => void) {
  const offset = useMemo(() => (serverTimeIso ? new Date(serverTimeIso).getTime() - Date.now() : 0), [serverTimeIso]);
  const [remaining, setRemaining] = useState(() => calc());
  function calc() {
    if (!deadlineIso) return 0;
    return Math.max(0, new Date(deadlineIso).getTime() - (Date.now() + offset));
  }
  useEffect(() => {
    if (!deadlineIso) return;
    const id = setInterval(() => {
      const r = calc();
      setRemaining(r);
      if (r === 0) { clearInterval(id); onExpire(); }   // onExpire: refetch order dari server
    }, 1000);
    return () => clearInterval(id);
  }, [deadlineIso, offset]);
  return { remainingMs: remaining, mm: Math.floor(remaining / 60000), ss: Math.floor((remaining % 60000) / 1000) };
}
```

Saat hitung mundur mencapai nol, tombol bayar dinonaktifkan dan client memanggil `refetch` order. Status final tetap ditentukan server. Jika server menjawab `410`, tampilkan `PopUpCancel`.

### 5.6 Pembayaran Gateway Nyata (Fase Lanjut)

- Set masa berlaku QRIS/VA di gateway sama dengan `paymentDeadline`.
- Webhook `/api/payments/webhook`: verifikasi signature, cari `Payment` lewat `gatewayRef`, panggil logika yang sama dengan `payOrder`.
- Jika webhook "paid" tiba setelah deadline: jangan ubah order menjadi `PAID_HELD_IN_ESCROW`. Tandai `Payment.status = PAID`, order tetap `CANCELLED_EXPIRED`, jalankan refund otomatis, dan catat di log.
- Webhook harus idempoten (kunci: `gatewayRef` + status).

---

## 6. Upload File dan Integrasi Leaflet

### 6.1 Strategi Upload

Pilihan penyimpanan:

| Opsi | Kelebihan | Kekurangan | Keputusan |
|------|-----------|------------|-----------|
| Supabase Storage | Bucket privat/publik, policy, satu vendor dengan Postgres bila dipakai | Perlu konfigurasi policy | Direkomendasikan |
| Cloudinary | Transformasi gambar bawaan | Batas kuota gratis | Alternatif |
| Local multipart (`/public/uploads`) | Sederhana | Tidak jalan di Vercel (filesystem read-only), tidak skalabel | Hanya untuk development lokal |

Implementasi lewat interface `StorageProvider { upload(buffer, key, contentType): Promise<{ url, key }> }` agar vendor bisa diganti tanpa mengubah route.

Aturan validasi di `POST /api/uploads`:
1. Batas ukuran 5 MB (`413 FILE_TOO_LARGE`).
2. Deteksi tipe dari magic bytes (paket `file-type`), bukan dari ekstensi atau header `Content-Type`. Hanya `image/jpeg`, `image/png`, `image/webp`. Selain itu `415`.
3. Proses ulang dengan `sharp`: resize sisi terpanjang maksimum 1600 px, konversi ke WebP, hapus metadata EXIF (termasuk lokasi GPS).
4. Nama file acak: `{purpose}/{yyyy}/{mm}/{cuid}.webp`. Nama asli dari client dibuang.
5. Bucket terpisah: `order-items` dan `delivery-proofs`. Bucket bukti serah terima bersifat privat dan diakses lewat signed URL berumur pendek (60 menit) yang dibuat di `GET /api/orders/[id]`.
6. Rate limit: 20 upload per menit per user.
7. `imageUrl` di body order divalidasi: host dan bucket harus cocok konfigurasi, dan key harus diunggah oleh user yang sama (simpan pemetaan key ke userId di tabel kecil atau awali key dengan userId).

### 6.2 Data Wilayah dan Koordinat

Sumber: file JSON statis yang dihasilkan sekali oleh `scripts/build-regions.ts`, lalu di-commit.

- Daftar provinsi dan kabupaten/kota diambil dari data wilayah administratif publik (kode Kemendagri).
- Koordinat tiap kabupaten/kota diperoleh dengan geocoding sekali jalan (Nominatim, 1 request per detik, sekitar 514 entri) dan diperiksa manual untuk entri yang meleset. Fallback: titik tengah provinsi.
- Tidak ada pemanggilan API wilayah atau geocoding saat runtime.

Format keluaran:

```
public/regions/provinces.json        [{ "code": "33", "name": "Jawa Tengah", "lat": -7.15, "lng": 110.14 }]
public/regions/33.json               [{ "code": "3374", "name": "Kota Semarang", "lat": -6.9667, "lng": 110.4167 }]
```

Daftar kota dimuat per provinsi saat dipilih (`fetch('/regions/33.json')`) agar bundle awal kecil. Server memakai file yang sama (dibaca lewat `fs` atau import JSON) untuk memvalidasi `cityCode` pada `POST /api/trips`.

### 6.3 Leaflet di Next.js

`components/map/MapView.tsx`:

```tsx
"use client";
import dynamic from "next/dynamic";

export const MapView = dynamic(() => import("./MapViewInner"), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-md bg-neutral-100" />,
});
```

`components/map/MapViewInner.tsx`:

```tsx
"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";

const icon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});

type Point = { lat: number; lng: number };

function FlyTo({ target, zoom }: { target: Point | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], zoom, { duration: 1.2 });
  }, [target?.lat, target?.lng, zoom, map]);
  return null;
}

export default function MapViewInner({ origin, destination }: { origin: Point | null; destination: Point | null }) {
  const focus = destination ?? origin;     // titik yang terakhir dipilih mendapat fokus
  return (
    <MapContainer center={[-2.5, 118]} zoom={5} scrollWheelZoom className="h-80 w-full rounded-md z-0">
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {origin && <Marker position={[origin.lat, origin.lng]} icon={icon} />}
      {destination && <Marker position={[destination.lat, destination.lng]} icon={icon} />}
      <FlyTo target={focus} zoom={11} />
    </MapContainer>
  );
}
```

Aturan:
- `L` hanya disentuh di dalam file `*Inner.tsx` yang tidak pernah diimpor langsung dari server component.
- Tidak ada pemanggilan `L.map(...)` manual. Instance peta dikelola `MapContainer` dan diakses lewat `useMap()` di dalam `useEffect`.
- Ikon marker memakai file di `public/leaflet` agar tidak rusak oleh bundler.
- Tile server OpenStreetMap publik dibatasi kebijakan penggunaan. Untuk produksi dengan trafik nyata, pakai penyedia tile berlisensi (MapTiler, Stadia, atau self-host).

### 6.4 Sinkronisasi Dropdown dan Peta

`components/region/RegionSelect.tsx` menerima `value` dan `onChange({ provinceCode, cityCode, name, lat, lng })`. Alur:

1. Pilih provinsi: muat `/regions/{code}.json`, reset kota, peta `flyTo` ke titik provinsi (zoom 7).
2. Pilih kota: `onChange` memberi `lat`/`lng` kota, state induk (`origin` atau `destination`) diperbarui, `FlyTo` bereaksi pada perubahan `target`, peta `flyTo` zoom 11.
3. Jika asal dan tujuan sama-sama terisi, tampilkan dua marker dan gunakan `map.fitBounds` (opsional, dipicu lewat komponen `FitBounds` dengan pola `useMap` yang sama).

State `origin` dan `destination` berada di komponen halaman (`/driver` dan `/caridriver`), bukan di dalam peta.

---

## 7. Perapian UI dan Sinkronisasi Komponen Eksisting

Catatan: bagian ini disusun dari nama komponen yang disebutkan di spesifikasi. Sebelum refactor, jalankan `tree components/caridriver components/auth` dan cocokkan nama berkas dengan tabel di bawah.

### 7.1 Pemetaan Komponen

| Komponen | Peran | Kondisi tampil (berdasarkan `order.status`) |
|----------|-------|----------------------------------------------|
| `PopUpTitip` | Form unggah barang dan catatan | Tidak ada order aktif, customer membuka modal titip dari `DriverCard` |
| `DriverPricingModal` (baru) | Driver mengisi harga barang dan ongkos | `WAITING_DRIVER_PRICING` (sisi driver) |
| `PaymentMethode` | Ringkasan harga, countdown, pilihan QRIS/VA | `WAITING_CUSTOMER_PAYMENT` (sisi customer) |
| `LiveProgress` | Linimasa status dan tombol "Pesanan Selesai" | `PAID_HELD_IN_ESCROW`, `IN_TRANSIT`, `DELIVERED_PENDING_CONFIRMATION` |
| `ChatModal` (baru) | Obrolan customer dan driver per trip atau order | Kapan saja dari kartu trip atau detail order yang masih aktif |
| `PopUpSuccess` | Konfirmasi selesai | `COMPLETED` |
| `PopUpCancel` | Alasan pembatalan | `CANCELLED_EXPIRED`, `REJECTED_BY_*`, `REFUNDED` |

### 7.2 Satu State Controller

Masalah yang dihindari: lima modal dengan lima boolean `isOpen` yang bisa saling bertentangan. Solusi: satu provider yang hanya menyimpan `activeOrderId` dan `isOpen`. Isi modal diturunkan dari data server.

```tsx
// components/orders/OrderFlowProvider.tsx
"use client";
type Ctx = { activeOrderId: string | null; open: (id: string | null) => void; close: () => void; isOpen: boolean };
const OrderFlowContext = createContext<Ctx | null>(null);

export function OrderFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ id: string | null; isOpen: boolean }>({ id: null, isOpen: false });
  const value = useMemo<Ctx>(() => ({
    activeOrderId: state.id, isOpen: state.isOpen,
    open: (id) => setState({ id, isOpen: true }),
    close: () => setState((s) => ({ ...s, isOpen: false })),
  }), [state]);
  return <OrderFlowContext.Provider value={value}>{children}</OrderFlowContext.Provider>;
}
export const useOrderFlow = () => useContext(OrderFlowContext)!;
```

```tsx
// components/orders/OrderFlowModal.tsx
export function OrderFlowModal() {
  const { activeOrderId, isOpen, close } = useOrderFlow();
  const { order, mutate } = useOrder(activeOrderId);      // SWR, refresh 8 detik saat modal terbuka
  if (!isOpen) return null;
  return (
    <Dialog open onClose={close}>
      {!order && <PopUpTitip onCreated={(o) => mutate(o)} />}
      {order?.status === "WAITING_CUSTOMER_PAYMENT" && <PaymentMethode order={order} onChange={mutate} />}
      {order && ["PAID_HELD_IN_ESCROW", "IN_TRANSIT", "DELIVERED_PENDING_CONFIRMATION"].includes(order.status) &&
        <LiveProgress order={order} onChange={mutate} />}
      {order?.status === "COMPLETED" && <PopUpSuccess order={order} onClose={close} />}
      {order && CANCELLED_STATUSES.includes(order.status) && <PopUpCancel order={order} onClose={close} />}
    </Dialog>
  );
}
```

Aturan refactor:
1. Hapus semua `useState` boolean seperti `showPayment`, `showSuccess`, `showCancel`. Tampilan diturunkan dari `order.status`.
2. Modal anak tidak boleh menyimpan salinan `order`. Mereka menerima `order` lewat props dan memicu aksi lewat fungsi yang memanggil API lalu `mutate`.
3. Notifikasi harga di navbar: `NotificationBell` membuka `NotificationDrawer`. Item notifikasi `PRICE_SET` memanggil `open(order.id)` sehingga `PaymentMethode` muncul sebagai modal tanpa pindah halaman.
4. Form (`PopUpTitip`, `TripForm`, `RegisterForm`) memakai controlled component (`useState` atau React Hook Form) dengan skema Zod yang sama dengan server (`types/schemas`).
5. Tombol aksi menampilkan state `loading` dan dinonaktifkan selama request berjalan untuk mencegah klik ganda. Server tetap idempoten.

### 7.3 Ikon dan Gaya

- Semua ikon dari `lucide-react`. Tidak ada emoji dan tidak ada ikon inline buatan sendiri.
- Ukuran ikon seragam: 16 px untuk teks inline, 20 px untuk tombol, 24 px untuk header modal.
- Label status memakai teks dan warna fungsional (misal `text-amber-700` dengan titik kecil), bukan badge kapsul dekoratif.
- Catatan trip dari driver ditampilkan sebagai kotak `rounded-md` dengan label tebal dan teks `text-black`, bukan teks kecil abu-abu. Textarea catatan memakai `text-black` eksplisit agar teks yang diketik selalu terlihat.
- Tidak ada gradien mencolok atau efek glow. Ikuti palet tema yang sudah ada.

Pemetaan ikon yang disarankan:

| Konteks | Ikon Lucide |
|---------|-------------|
| Notifikasi | `Bell` |
| Pembayaran | `Wallet`, `QrCode`, `CreditCard` |
| Timer | `Timer` |
| Pengiriman | `Truck`, `PackageCheck` |
| Bukti foto | `Camera`, `ImageUp` |
| Lokasi | `MapPin` |
| Batal | `XCircle` |
| Selesai | `CheckCircle2` |
| WhatsApp (tautan kontak) | `MessageCircle` |

### 7.4 Layout Responsif

1. Lebar acuan minimum 375 px. Tidak boleh ada overflow horizontal. Semua baris tombol memakai `flex-wrap` dan tombol aksi utama melebar penuh pada layar kecil.
2. Halaman `/caridriver` dan `/driver` memakai satu kolom pada layar kecil. Dua kolom hanya aktif pada `lg`.
3. Dompet driver berada di halaman terpisah `/driver/wallet`, bukan di dashboard. Dashboard hanya menampilkan tautan menuju dompet. Halaman dompet memakai satu kolom pada layar kecil.
4. Header halaman memakai ukuran teks `text-2xl` pada layar kecil dan `text-3xl` pada `md`. Kartu memakai padding `p-4` pada layar kecil dan `p-5` atau `p-6` pada `md`.
5. Footer memakai grid dua kolom pada layar kecil: identitas dan sosial di baris pertama, kontak dan navigasi di baris kedua. Padding vertikal `py-8` pada layar kecil dan `py-12` pada `md`. Ikon sosial memakai `lucide-react` ukuran 20 px pada layar kecil dan 24 px pada `md`.
6. `ChatModal` memakai lebar penuh dikurangi padding pada layar kecil, tinggi maksimum `85vh`, dan area pesan dapat digulir tanpa menggeser halaman di belakang.
7. Kartu trip pada halaman customer memakai `flex h-full flex-col` dan grup tombol `mt-auto`, sehingga tombol selalu sejajar di bawah kartu meskipun isi catatan berbeda. Baris keberangkatan selalu tampil; bila `departureAt` kosong, tampilkan `createdAt` sebagai waktu trip dibuka. Kotak catatan selalu tampil dengan tinggi minimum dan teks pengganti "Belum ada catatan dari driver" bila catatan kosong.

### 7.5 Navigasi dan Pemisahan Halaman Customer

1. Menu publik (Home, About, Contact) hanya tampil saat pengguna belum login. Menu ini tidak ditampilkan untuk customer atau driver yang sudah login.
2. Customer yang sudah login memakai menu `Cari Driver`, `Pesanan Saya`, dan `Postingan Terbuka`. Driver memakai menu `Dashboard`, `Dompet`, dan `Postingan Terbuka`.
3. Halaman customer dipisah: `/caridriver` untuk mencari trip dan membuat order, `/caridriver/pesanan` untuk daftar dan detail pesanan, `/caridriver/postingan` untuk membuat postingan terbuka.
4. Setelah order dibuat dari `/caridriver`, client mengarahkan ke `/caridriver/pesanan?order={id}` agar detail order langsung terbuka.
5. Logo di navbar selalu menuju `/` (tampilan awal) untuk semua peran.
6. Halaman `/caridriver/pesanan` menampilkan daftar percakapan customer agar percakapan lama dapat dibuka kembali tanpa membuat percakapan baru.
7. Form titipan dari kartu trip tampil sebagai modal di atas halaman, bukan menambah konten di bawah daftar trip.

---

## 8. Strategi Pengujian

Peralatan: Vitest (unit dan integrasi), PostgreSQL uji (Docker atau Testcontainers, satu skema per worker), Playwright (E2E), `vi.useFakeTimers()` dan `vi.setSystemTime()` untuk waktu.

Prinsip: `clock` (objek `Date`) disuntikkan ke fungsi service sehingga uji tidak bergantung pada waktu nyata.

### 8.1 Unit Test

| ID | Target | Kasus | Hasil yang diharapkan |
|----|--------|-------|-----------------------|
| U-01 | `assertTransition` | Semua pasangan valid di tabel 3.2 | Tidak melempar |
| U-02 | `assertTransition` | Semua pasangan tidak valid (generate dari produk kartesius status x status) | `INVALID_TRANSITION` |
| U-03 | `assertTransition` | DRIVER mencoba `DELIVERED_PENDING_CONFIRMATION -> COMPLETED` | `INVALID_TRANSITION` |
| U-04 | `assertTransition` | Transisi keluar dari tiap status final | `INVALID_TRANSITION` |
| U-05 | `calcTotals` | Subtotal 55.000, jasa 25.000, bps 500 | platformFee 1.250, total 81.250, payout 80.000 |
| U-06 | `calcTotals` | Jasa 0, harga 0 | total 0, tidak NaN |
| U-07 | `calcTotals` | Nilai pecahan atau negatif | Error validasi |
| U-08 | `calcTotals` | Pembulatan fee (jasa 10.001, bps 500) | `Math.floor`, total konsisten dengan CHECK constraint |
| U-09 | `useCountdown` | `serverTime` 10 menit lebih lambat dari jam perangkat | Sisa waktu tetap dihitung dari `serverTime` |
| U-10 | `useCountdown` | Mencapai nol | `onExpire` dipanggil tepat sekali |
| U-11 | Skema Zod order | 0 item, 11 item, `imageUrl` dari host lain | Ditolak |
| U-12 | `validateImage` | Berkas `.exe` diganti nama `.jpg` | `415` |
| U-13 | `validateImage` | Berkas 5 MB + 1 byte | `413` |
| U-14 | `validateImage` | JPEG dengan EXIF GPS | Keluaran tanpa EXIF |

### 8.2 Integration Test (database nyata)

| ID | Skenario | Hasil yang diharapkan |
|----|----------|-----------------------|
| I-01 | Alur penuh: customer `POST /orders` -> driver `set-price` -> customer `pay` -> driver `start` -> driver `deliver` -> customer `complete` | Status akhir `COMPLETED`, escrow `RELEASED`, saldo wallet driver naik sebesar `driverPayout`, 1 baris `WalletTransaction`, `OrderStatusLog` lengkap (6 baris) |
| I-02 | `set-price` menetapkan `paymentDeadline = pricedAt + 300s` | Selisih tepat 300 detik |
| I-03 | Customer menolak harga | `REJECTED_BY_CUSTOMER`, tidak ada `Payment` |
| I-04 | Driver menolak order | `REJECTED_BY_DRIVER`, notifikasi ke customer |
| I-05 | `complete` setelah `deliver` dipanggil dua kali berurutan | Panggilan kedua `409`, saldo hanya bertambah sekali |
| I-06 | `complete` dipanggil dua kali secara paralel (`Promise.all`) | Tepat satu sukses, satu `409`, saldo bertambah sekali |
| I-07 | `pay` dipanggil dua kali paralel dengan `idempotencyKey` berbeda | Tepat satu `Payment`, satu `EscrowTransaction` |
| I-08 | `pay` dua kali dengan `idempotencyKey` sama | Respons identik, tidak ada duplikasi |
| I-09 | `sweepExpiredOrders` | Hanya order dengan `paymentDeadline <= now` dan status `WAITING_CUSTOMER_PAYMENT` yang berubah |
| I-10 | `expireOrder` dipanggil dua kali | Kedua kali aman, notifikasi hanya satu kali |
| I-11 | `GET /notifications` membuat order hangus lewat lazy expiry | Status `CANCELLED_EXPIRED` terbaca benar |
| I-12 | Penarikan melebihi saldo | Ditolak, saldo tidak berubah |
| I-13 | Constraint DB: update langsung `balance = -1` | Ditolak CHECK constraint |
| I-14 | Insert `WalletTransaction` kedua dengan `escrowId` sama | Ditolak unique constraint |
| I-15 | Registrasi driver | `User`, `DriverProfile`, `Wallet` terbentuk atomik; jika pembuatan wallet gagal, tidak ada yang tersimpan |

### 8.3 Edge Case dan Keamanan

| ID | Kasus | Hasil yang diharapkan |
|----|-------|-----------------------|
| E-01 | Bayar tepat pada `deadline - 1 ms` | Diterima |
| E-02 | Bayar tepat pada `deadline` (detik ke-300) | Ditolak (`gt`, bukan `gte`) |
| E-03 | Bayar pada detik ke-301 | `410 PAYMENT_DEADLINE_PASSED`, order menjadi `CANCELLED_EXPIRED`, tidak ada `Payment` |
| E-04 | Driver memanggil `/complete` pada order miliknya | `403` atau `404`, escrow tetap `HELD`, saldo tidak berubah |
| E-05 | Driver memanggil endpoint apa pun untuk mengubah `Wallet` langsung | Tidak ada endpoint yang menerima angka saldo dari client |
| E-06 | Customer B membaca atau membayar order customer A | `404` |
| E-07 | Driver B memanggil `set-price` order driver A | `404` |
| E-08 | CUSTOMER memanggil `POST /trips` | `403` |
| E-09 | Upload `purpose=PROOF` oleh CUSTOMER | `403` |
| E-10 | Upload PDF, SVG, GIF animasi, atau berkas teks | `415` |
| E-11 | Upload berkas dengan header `image/png` tetapi isi bukan gambar | `415` |
| E-12 | `set-price` dengan `finalPrice` negatif atau pecahan | `422` |
| E-13 | `set-price` dengan `serviceFee` di bawah `trip.baseFee` | `422` |
| E-14 | `deliver` saat status `PAID_HELD_IN_ESCROW` (belum `start`) | `409 INVALID_TRANSITION` |
| E-15 | `set-price` dipanggil dua kali | Kedua `409`, deadline tidak diperpanjang |
| E-16 | `body` request berisi `status`, `totalAmount`, atau `driverId` | Field diabaikan atau ditolak oleh Zod strict mode |
| E-17 | Webhook gateway "paid" tiba setelah deadline | Order tetap `CANCELLED_EXPIRED`, refund dipicu |
| E-18 | Login salah 11 kali dalam semenit | `429` |
| E-19 | Manipulasi jam perangkat customer | Tidak berpengaruh pada validasi server |
| E-20 | Pengguna tanpa sesi memanggil endpoint terproteksi | `401` |

### 8.4 End-to-End (Playwright)

1. Registrasi driver, buka trip Semarang ke Bandung, peta melakukan `flyTo` saat kota dipilih.
2. Registrasi customer, cari driver, buka `PopUpTitip`, unggah gambar, kirim.
3. Sesi driver: modal permintaan muncul, isi harga, kirim.
4. Sesi customer: ikon notifikasi menyala, drawer terbuka, `PaymentMethode` tampil dengan countdown, bayar.
5. Driver mulai perjalanan dan unggah bukti.
6. Customer menekan "Pesanan Selesai", `PopUpSuccess` tampil, saldo driver bertambah.
7. Varian: biarkan countdown habis, `PopUpCancel` tampil dan tombol bayar nonaktif.

### 8.5 Kriteria Lulus

- Seluruh uji di 8.1 sampai 8.3 hijau.
- Cakupan baris untuk `lib/orders/**` minimal 90 persen.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` bersih.
- Pemeriksaan karakter terlarang pada dokumen dan UI (lihat `AGENTS.md`) bersih.

---

## 9. Urutan Implementasi

| Fase | Isi | Selesai bila |
|------|-----|--------------|
| 1 | Prisma schema, migration, `lib/prisma.ts`, `lib/env.ts`, `lib/http.ts`, seed | `prisma migrate dev` dan seed berjalan |
| 2 | Auth.js, register, `GET /api/me`, `requireRole` | Login dan pembatasan role teruji |
| 3 | `scripts/build-regions.ts`, `RegionSelect`, `MapView`, sinkronisasi flyTo | Dropdown dan peta sinkron di `/driver` dan `/caridriver` |
| 4 | Trip: create, search, mine, toggle | Customer menemukan trip driver |
| 5 | Upload: storage provider, validasi, endpoint | U-12 sampai U-14 dan E-09 sampai E-11 hijau |
| 6 | `state-machine.ts`, `pricing.ts`, `service.ts` (create, set-price, reject) | U-01 sampai U-08 dan I-02 sampai I-04 hijau |
| 7 | Notifikasi: tabel, endpoint, `NotificationBell`, drawer | Driver dan customer menerima notifikasi |
| 8 | Pay, escrow, expiry (empat lapis), countdown | I-07 sampai I-11 dan E-01 sampai E-03 hijau |
| 9 | Start, deliver, complete, wallet, dispute | I-01, I-05, I-06, I-12 sampai I-14 hijau |
| 10 | Refactor modal ke `OrderFlowProvider`, hapus state redundan | E2E 8.4 hijau |
| 11 | Hardening: rate limit, header keamanan, audit log, E-xx sisa | Semua kriteria 8.5 terpenuhi |

---

## 10. Keputusan Terbuka

1. Auto-release dana setelah N hari tanpa konfirmasi customer (saat ini tidak ada).
2. Penyelesaian sengketa oleh admin: antarmuka admin atau cukup script internal.
3. Penyedia payment gateway produksi (Midtrans atau Xendit) dan biaya gateway: ditanggung platform atau customer.
4. Persentase `PLATFORM_FEE_BPS` final dan apakah fee dihitung dari ongkos jasa saja (asumsi dokumen ini) atau dari total.
5. Masa berlaku `OpenRequest` (asumsi 7 hari) dan batas jumlah postingan terbuka per customer.
6. Apakah verifikasi driver wajib sebelum membuka trip (`VERIFICATION_REQUIRED`).
