# Pasdisaku Auto Import & Catalog Sync

Sistem import produk massal (via API resmi supplier/marketplace), sinkronisasi harga & stok otomatis, auto markup, dashboard admin, manajemen pesanan, CRM WhatsApp, dan integrasi WooCommerce.

Baca `ARCHITECTURE.md` (terpisah) untuk detail arsitektur & alasan desain.

## Struktur Proyek

```
pasdisaku/
├── backend/           # NestJS API + worker BullMQ
│   ├── src/
│   ├── prisma/        # schema.prisma + seed.ts
│   └── .env.example
├── frontend/          # Next.js dashboard admin
├── nginx/              # reverse proxy config
└── docker-compose.yml
```

## Instalasi (Development Lokal)

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env: isi DATABASE_URL, JWT secrets, dll.

npm install
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts

npm run start:dev        # jalankan API di terminal 1
npm run worker:dev       # jalankan worker BullMQ di terminal 2 (WAJIB agar sync jalan)
```

Login default setelah seed: `admin@pasdisaku.local` / `ChangeMe123!` — **segera ganti password ini.**

### 2. Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
npm run dev
```

Buka `http://localhost:3000` → akan redirect ke halaman login.

## Deployment ke VPS (via Termius/SSH)

```bash
# di VPS
git clone <repo-anda> pasdisaku
cd pasdisaku

cp backend/.env.example backend/.env
nano backend/.env    # isi semua secret & kredensial produksi

echo "MYSQL_PASSWORD=xxxx" >> .env
echo "MYSQL_ROOT_PASSWORD=xxxx" >> .env

docker compose up -d --build

# jalankan migrasi & seed di dalam container backend
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx ts-node prisma/seed.ts
```

Setelah itu:
- API tersedia di `http://<domain-anda>/api`
- Dashboard admin di `http://<domain-anda>/`
- Untuk HTTPS, tambahkan certbot ke service `nginx` atau gunakan reverse proxy seperti Caddy.

## Menambah Supplier & Import Produk

1. Login ke dashboard admin.
2. Tambah supplier lewat endpoint `POST /api/suppliers` (UI khusus supplier belum dibuat di scaffold ini — bisa ditambahkan sebagai langkah berikutnya), contoh body:

```json
{
  "name": "Supplier Feed A",
  "sourceType": "csv_feed",
  "apiCredentials": { "feedUrl": "https://supplier-a.com/feed.csv" },
  "syncIntervalMinutes": 60
}
```

3. Trigger import awal: `POST /api/suppliers/:id/import` → job masuk antrian BullMQ, diproses oleh proses `worker`.
4. Sync harga/stok otomatis berjalan sesuai `syncIntervalMinutes` (didaftarkan otomatis saat worker start atau saat supplier baru dibuat).

## Menambah Konektor Marketplace Resmi (Shopee/Tokopedia)

Lihat komentar di `backend/src/suppliers/connectors/connector-registry.ts`. Setiap marketplace butuh:
1. Registrasi aplikasi di platform resmi mereka (Shopee Open Platform / Tokopedia Partner Center) untuk App ID & Secret.
2. Implementasi class baru yang mengikuti interface `SupplierConnector` (lihat `supplier-connector.interface.ts`), memakai signing/autentikasi sesuai dokumentasi resmi masing-masing.
3. Daftarkan connector baru tersebut di `ConnectorRegistry`.

## Catatan Penting

- Kredensial API supplier & WooCommerce disimpan di kolom JSON (`api_credentials`, `consumer_key/secret`) — **tambahkan enkripsi aplikasi-level (AES-256) sebelum produksi**, contoh lib: `crypto` bawaan Node dengan `CREDENTIALS_ENCRYPTION_KEY` di `.env`.
- WhatsApp: scaffold ini memakai WhatsApp Business Cloud API resmi (Meta). Untuk broadcast massal gunakan template message resmi, bukan free-form text, agar tidak melanggar kebijakan WhatsApp Business.
- Semua integrasi supplier/marketplace WAJIB memakai API resmi atau feed yang diizinkan ToS sumber data — jangan scraping HTML pada platform yang melarangnya.
