# Pasdisaku Auto Import & Catalog Sync — Dokumen Arsitektur

## 1. Ringkasan Sistem

Platform untuk mengimpor produk secara massal dari supplier/marketplace (via API resmi masing-masing platform, sesuai ToS), melakukan sinkronisasi harga & stok otomatis, menerapkan aturan markup keuntungan, mengelola pesanan, CRM WhatsApp, dan integrasi WooCommerce — dirancang untuk 10.000 produk awal, skalabel ke 100.000+.

**Prinsip penting:** semua impor data pihak ketiga HARUS melalui API resmi yang disediakan supplier/marketplace (mis. Shopee Open Platform API, Tokopedia Partner API, WooCommerce REST API, atau feed XML/CSV resmi supplier). Sistem tidak melakukan scraping HTML terhadap platform yang melarangnya di ToS.

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | NestJS (TypeScript) |
| Database | MySQL 8 |
| Cache / Queue broker | Redis |
| Job Queue | BullMQ |
| Frontend | Next.js (App Router, TypeScript) |
| ORM | Prisma atau TypeORM |
| Auth | JWT + refresh token, Passport.js |
| Search produk (skala besar) | MySQL FULLTEXT (10k) → Meilisearch/Elasticsearch opsional saat >50k |
| Container | Docker + Docker Compose |
| Deployment | VPS via Termius/SSH, Nginx reverse proxy, PM2/Docker |
| WhatsApp | WhatsApp Business Cloud API (resmi) atau Baileys (self-hosted, non-resmi — pertimbangkan risiko banned) |

## 3. Arsitektur Modular (NestJS Modules)

```
src/
├── auth/                 # Login admin, JWT, role-based guard
├── suppliers/            # Koneksi ke sumber data (Shopee/Tokopedia/CSV/API supplier)
│   ├── connectors/       # 1 connector class per sumber (strategy pattern)
│   └── import/           # Bulk import engine + validasi
├── products/              # CRUD produk, varian, gambar
├── categories/            # Kategori otomatis (rule-based + mapping dari sumber)
├── pricing/                # Markup engine, price rules
├── sync/                   # Cron jobs sinkronisasi harga/stok (BullMQ workers)
├── seo/                    # Auto-generate slug, meta title/description
├── orders/                 # Manajemen pesanan
├── crm-whatsapp/          # Kontak, campaign, log pesan WA
├── woocommerce/            # Integrasi WooCommerce REST API (push produk & tarik order)
├── dashboard/               # Aggregasi statistik admin
├── common/                  # Interceptors, filters, DTO validators, logger
└── queue/                   # Konfigurasi BullMQ, processor registrasi
```

**Prinsip desain:** setiap sumber data (Shopee, Tokopedia, supplier CSV, dsb.) diimplementasikan sebagai *connector* yang mengikuti interface yang sama (`SupplierConnector`), sehingga menambah sumber baru tidak mengubah core import engine.

## 4. Skema Database (MySQL)

```sql
-- ADMIN & AUTH
CREATE TABLE admin_users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin','operator','viewer') DEFAULT 'operator',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- SUPPLIER / SOURCE
CREATE TABLE suppliers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  source_type ENUM('shopee_api','tokopedia_api','csv_feed','custom_api') NOT NULL,
  api_credentials JSON,          -- terenkripsi di level aplikasi
  sync_interval_minutes INT DEFAULT 60,
  last_synced_at DATETIME NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORY
CREATE TABLE categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_id BIGINT UNSIGNED NULL,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(180) UNIQUE NOT NULL,
  auto_rule JSON NULL,           -- keyword/kategori-mapping utk auto-kategorisasi
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- PRODUCTS
CREATE TABLE products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  supplier_id BIGINT UNSIGNED NOT NULL,
  external_id VARCHAR(150) NOT NULL,      -- ID produk di sumber asal
  category_id BIGINT UNSIGNED NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(280) UNIQUE NOT NULL,
  description TEXT,
  base_price DECIMAL(15,2) NOT NULL,       -- harga asli dari supplier
  sale_price DECIMAL(15,2) NOT NULL,       -- harga setelah markup
  stock INT UNSIGNED DEFAULT 0,
  weight_gram INT UNSIGNED DEFAULT 0,
  images JSON,
  seo_title VARCHAR(255),
  seo_description VARCHAR(500),
  status ENUM('active','draft','out_of_stock','archived') DEFAULT 'draft',
  woocommerce_id BIGINT UNSIGNED NULL,     -- mapping ke produk WooCommerce
  last_synced_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_supplier_external (supplier_id, external_id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FULLTEXT KEY ft_name_desc (name, description),
  INDEX idx_status (status),
  INDEX idx_category (category_id)
);

-- PRICE & STOCK HISTORY (untuk audit & analitik tren)
CREATE TABLE product_sync_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  old_price DECIMAL(15,2),
  new_price DECIMAL(15,2),
  old_stock INT,
  new_stock INT,
  sync_status ENUM('success','failed') DEFAULT 'success',
  error_message TEXT NULL,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_time (product_id, synced_at)
);

-- MARKUP RULES
CREATE TABLE markup_rules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150),
  scope ENUM('global','category','supplier','product') NOT NULL,
  scope_ref_id BIGINT UNSIGNED NULL,   -- id kategori/supplier/produk tergantung scope
  rule_type ENUM('percentage','fixed_amount','tiered') NOT NULL,
  value DECIMAL(10,2) NOT NULL,        -- persen atau nominal
  tiered_config JSON NULL,             -- utk rule_type = tiered, mis. [{min:0,max:50000,markup:20},...]
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ORDERS
CREATE TABLE orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(150),
  customer_phone VARCHAR(30),
  customer_address TEXT,
  source ENUM('manual','woocommerce','marketplace') DEFAULT 'manual',
  status ENUM('pending','paid','processing','shipped','completed','cancelled') DEFAULT 'pending',
  total_amount DECIMAL(15,2) NOT NULL,
  woocommerce_order_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- CRM WHATSAPP
CREATE TABLE wa_contacts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150),
  phone VARCHAR(30) UNIQUE NOT NULL,
  tags JSON NULL,
  last_contacted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wa_messages_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  contact_id BIGINT UNSIGNED NOT NULL,
  campaign_name VARCHAR(150),
  message_content TEXT,
  status ENUM('sent','delivered','read','failed') DEFAULT 'sent',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES wa_contacts(id)
);

-- WOOCOMMERCE MAPPING / CONFIG
CREATE TABLE woocommerce_stores (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  store_url VARCHAR(255) NOT NULL,
  consumer_key VARCHAR(255) NOT NULL,
  consumer_secret VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at DATETIME NULL
);
```

## 5. Alur Import & Sinkronisasi

1. **Import awal (bulk):** Admin memasukkan kredensial API supplier/marketplace → job `ImportProductsQueue` ditarik via connector → data dinormalisasi → insert batch (chunk 500 produk/batch) ke `products`.
2. **Auto-kategorisasi:** saat insert, jalankan matching terhadap `categories.auto_rule` (keyword-based) atau mapping kategori bawaan dari sumber.
3. **Auto markup:** `PricingService` menghitung `sale_price` dari `base_price` berdasarkan `markup_rules` dengan prioritas: product-specific → category → supplier → global.
4. **Auto SEO:** generate `slug`, `seo_title`, `seo_description` dari nama produk + kategori (template-based, bisa ditingkatkan pakai LLM API terpisah bila diperlukan).
5. **Sync berkala (cron):** BullMQ repeatable job per supplier sesuai `sync_interval_minutes` → bandingkan harga/stok baru vs lama → update + catat di `product_sync_logs` → jika berubah, trigger push ke WooCommerce.
6. **WooCommerce sync:** two-way — push produk (create/update via REST API `products` endpoint) dan tarik order masuk (`orders` endpoint) secara periodik.

## 6. Strategi Performa untuk Skala 10k → 100k Produk

- **Batch processing**: semua bulk insert/update pakai chunking (500–1000 baris), bukan query per-baris.
- **Queue-based sync**: setiap supplier sync jadi job terpisah di BullMQ, jalan paralel dengan concurrency terbatas (mis. 5 worker) agar tidak membanjiri API pihak ketiga (rate limit).
- **Index yang tepat**: composite index `(supplier_id, external_id)`, `(status)`, `(category_id)`, FULLTEXT untuk pencarian nama/deskripsi.
- **Redis cache**: kategori, markup_rules, dan hasil query dashboard yang jarang berubah di-cache 5–15 menit.
- **Read replica** (opsional saat >100k): pisahkan query dashboard/reporting dari write path sync.
- **Pagination cursor-based** (bukan OFFSET) untuk listing produk di angka besar.
- **Job idempotency**: setiap job sync punya lock (Redis) per supplier agar tidak dobel jalan jika cron overlap.

## 7. Autentikasi & Keamanan

- JWT access token (15 menit) + refresh token (7 hari) disimpan httpOnly cookie.
- Role-based guard: `super_admin`, `operator`, `viewer`.
- Kredensial API supplier & WooCommerce dienkripsi (AES-256) sebelum disimpan di kolom JSON.
- Rate limiting di endpoint publik (`@nestjs/throttler`).

## 8. Rencana Deployment (VPS via Termius)

```
docker-compose.yml
├── app (NestJS)       — port 3001
├── web (Next.js)      — port 3000
├── mysql              — volume persisten
├── redis
└── nginx              — reverse proxy + SSL (certbot)
```

Cron/BullMQ worker jalan sebagai proses terpisah (`worker` service) di compose yang sama, supaya proses sync tidak membebani proses API utama.

## 9. Modul yang Perlu Kredensial/ToS Resmi

| Sumber | Metode resmi |
|---|---|
| Shopee | Shopee Open Platform (Partner API) — perlu App ID & Partner Key terdaftar |
| Tokopedia | Tokopedia Partner API |
| Supplier lain | CSV/XML feed resmi atau API yang disediakan supplier |
| WooCommerce | REST API (Consumer Key/Secret dari toko WooCommerce) |
| WhatsApp | WhatsApp Business Cloud API (resmi, Meta) — direkomendasikan dibanding library non-resmi untuk menghindari risiko pemblokiran nomor |

---

**Langkah selanjutnya yang bisa saya kerjakan:**
1. Scaffold struktur folder NestJS + Next.js awal
2. Implementasi modul `auth` + `products` CRUD dulu
3. Implementasi `SupplierConnector` interface + 1 contoh connector (CSV feed)
4. Setup BullMQ queue dasar untuk sync

Beri tahu urutan mana yang ingin dikerjakan dulu.
