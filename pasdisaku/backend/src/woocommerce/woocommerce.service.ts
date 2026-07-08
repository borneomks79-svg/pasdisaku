import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WoocommerceService {
  private readonly logger = new Logger(WoocommerceService.name);

  constructor(private prisma: PrismaService) {}

  private async getActiveStore() {
    const store = await this.prisma.woocommerceStore.findFirst({ where: { isActive: true } });
    if (!store) throw new Error('Tidak ada toko WooCommerce aktif dikonfigurasi');
    return store;
  }

  private authHeader(consumerKey: string, consumerSecret: string) {
    const token = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    return `Basic ${token}`;
  }

  /**
   * Push satu produk ke WooCommerce lewat REST API resmi.
   * Dipanggil setelah import/sync mendeteksi perubahan harga/stok,
   * atau secara batch dari cron job terpisah.
   */
  async pushProduct(productId: string) {
    const store = await this.getActiveStore();
    const product = await this.prisma.product.findUnique({ where: { id: BigInt(productId) } });
    if (!product) throw new Error('Produk tidak ditemukan');

    const payload = {
      name: product.name,
      regular_price: String(product.salePrice),
      description: product.description || '',
      short_description: product.seoDescription || '',
      manage_stock: true,
      stock_quantity: product.stock,
      status: product.status === 'active' ? 'publish' : 'draft',
      images: ((product.images as any) || []).map((url: string) => ({ src: url })),
    };

    const endpoint = product.woocommerceId
      ? `${store.storeUrl}/wp-json/wc/v3/products/${product.woocommerceId}`
      : `${store.storeUrl}/wp-json/wc/v3/products`;

    const res = await fetch(endpoint, {
      method: product.woocommerceId ? 'PUT' : 'POST',
      headers: {
        Authorization: this.authHeader(store.consumerKey, store.consumerSecret),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`WooCommerce push gagal (${res.status}): ${errText}`);
    }

    const data = await res.json();

    if (!product.woocommerceId) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: { woocommerceId: BigInt(data.id) },
      });
    }

    return { success: true, woocommerceId: data.id };
  }

  /** Push batch produk yang berubah sejak waktu tertentu (dipanggil dari cron) */
  async pushChangedProducts(since: Date) {
    const products = await this.prisma.product.findMany({
      where: { updatedAt: { gte: since } },
      take: 500, // batasi per-batch agar tidak membanjiri WooCommerce API
    });

    let success = 0;
    let failed = 0;

    for (const product of products) {
      try {
        await this.pushProduct(product.id.toString());
        success++;
      } catch (err) {
        this.logger.error(`Gagal push produk ${product.id}: ${err.message}`);
        failed++;
      }
    }

    return { success, failed, total: products.length };
  }

  /** Tarik order baru dari WooCommerce dan simpan ke tabel orders lokal */
  async pullOrders() {
    const store = await this.getActiveStore();

    const res = await fetch(`${store.storeUrl}/wp-json/wc/v3/orders?per_page=50&orderby=date&order=desc`, {
      headers: { Authorization: this.authHeader(store.consumerKey, store.consumerSecret) },
    });

    if (!res.ok) throw new Error(`Gagal tarik order WooCommerce (${res.status})`);

    const wcOrders = await res.json();
    let imported = 0;

    for (const wcOrder of wcOrders) {
      const existing = await this.prisma.order.findFirst({
        where: { woocommerceOrderId: BigInt(wcOrder.id) },
      });
      if (existing) continue;

      await this.prisma.order.create({
        data: {
          orderNumber: `WC-${wcOrder.id}`,
          customerName: `${wcOrder.billing?.first_name || ''} ${wcOrder.billing?.last_name || ''}`.trim(),
          customerPhone: wcOrder.billing?.phone || '',
          customerAddress: wcOrder.billing?.address_1 || '',
          source: 'woocommerce',
          status: this.mapWcStatus(wcOrder.status),
          totalAmount: parseFloat(wcOrder.total),
          woocommerceOrderId: BigInt(wcOrder.id),
        },
      });
      imported++;
    }

    await this.prisma.woocommerceStore.update({
      where: { id: store.id },
      data: { lastSyncedAt: new Date() },
    });

    return { imported };
  }

  private mapWcStatus(wcStatus: string): any {
    const map: Record<string, string> = {
      pending: 'pending',
      processing: 'paid',
      'on-hold': 'pending',
      completed: 'completed',
      cancelled: 'cancelled',
      refunded: 'cancelled',
      failed: 'cancelled',
      shipped: 'shipped',
    };
    return map[wcStatus] || 'pending';
  }
}
