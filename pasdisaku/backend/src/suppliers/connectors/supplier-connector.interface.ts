/**
 * Kontrak yang harus diimplementasikan setiap konektor sumber data
 * (Shopee Open Platform, Tokopedia Partner API, CSV feed supplier, dll).
 *
 * PENTING: implementasi konektor WAJIB menggunakan API resmi / metode yang
 * diizinkan Terms of Service platform sumber. Jangan scraping HTML pada
 * platform yang melarangnya.
 */

export interface RawProductData {
  externalId: string;
  name: string;
  description?: string;
  price: number; // harga asli dari supplier (base_price)
  stock: number;
  weightGram?: number;
  images?: string[];
  categoryHint?: string; // nama/label kategori dari sumber, untuk auto-kategorisasi
}

export interface SupplierConnector {
  /** Identifier unik tipe konektor, harus sama dengan SourceType di Prisma schema */
  readonly sourceType: string;

  /**
   * Validasi kredensial API sebelum dipakai (dipanggil saat admin menyimpan supplier).
   */
  validateCredentials(credentials: Record<string, any>): Promise<boolean>;

  /**
   * Menarik seluruh produk dari sumber (untuk import awal / full resync).
   * Harus mendukung pagination di level implementasi agar tidak memuat semua
   * data sekaligus ke memori saat volume besar (10k-100k produk).
   */
  fetchAllProducts(
    credentials: Record<string, any>,
    onBatch: (batch: RawProductData[]) => Promise<void>,
    batchSize?: number,
  ): Promise<void>;

  /**
   * Menarik harga & stok terbaru untuk daftar externalId tertentu (dipakai
   * saat sync berkala, jauh lebih ringan daripada full fetch).
   */
  fetchPriceStock(
    credentials: Record<string, any>,
    externalIds: string[],
  ): Promise<{ externalId: string; price: number; stock: number }[]>;
}
