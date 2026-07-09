import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConnectorRegistry } from '../connectors/connector-registry';
import { RawProductData } from '../connectors/supplier-connector.interface';
import { PricingService } from '../../pricing/pricing.service';
import { CategoriesService } from '../../categories/categories.service';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private prisma: PrismaService,
    private connectorRegistry: ConnectorRegistry,
    private pricingService: PricingService,
    private categoriesService: CategoriesService,
  ) {}

  /**
   * Import awal (bulk) seluruh produk dari supplier tertentu.
   * Dipanggil dari BullMQ processor, bukan langsung dari HTTP request,
   * supaya import 10k+ produk tidak memblokir request/timeout.
   */
  async importFromSupplier(supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: BigInt(supplierId) } });
    if (!supplier) throw new Error(`Supplier ${supplierId} tidak ditemukan`);

    const connector = this.connectorRegistry.get(supplier.sourceType);
    const credentials = (supplier.apiCredentials as any) || {};

    let totalImported = 0;

    await connector.fetchAllProducts(credentials, async (batch) => {
      await this.processBatch(supplier.id, batch);
      totalImported += batch.length;
      this.logger.log(`Supplier ${supplier.name}: ${totalImported} produk diproses`);
    });

    await this.prisma.supplier.update({
      where: { id: supplier.id },
      data: { lastSyncedAt: new Date() },
    });

    return { totalImported };
  }

  private async processBatch(supplierId: bigint, batch: RawProductData[]) {
    for (const item of batch) {
      try {
        const categoryId = item.categoryHint
          ? await this.categoriesService.matchCategoryForProduct(item.categoryHint)
          : await this.categoriesService.matchCategoryForProduct(item.name);

        const salePrice = await this.pricingService.calculateSalePrice({
          basePrice: item.price,
          categoryId,
          supplierId,
        });

        const slug = this.generateSlug(item.name, item.externalId);
        const seoTitle = item.name.slice(0, 255);
        const seoDescription = (item.description || item.name).slice(0, 155);

        const existing = await this.prisma.product.findUnique({
          where: { uq_supplier_external: { supplierId, externalId: item.externalId } },
        });

        if (existing) {
          const priceChanged = Number(existing.basePrice) !== item.price;
          const stockChanged = existing.stock !== item.stock;

          await this.prisma.product.update({
            where: { id: existing.id },
            data: {
              basePrice: item.price,
              salePrice,
              stock: item.stock,
              // Kalau produk lama belum punya kategori (mis. kategori barunya
              // baru dibuat setelah produk ini pertama kali diimpor), coba
              // cocokkan ulang di setiap import/sync berikutnya.
              categoryId: existing.categoryId ?? categoryId,
              lastSyncedAt: new Date(),
              status: item.stock > 0 ? 'active' : 'out_of_stock',
            },
          });

          if (priceChanged || stockChanged) {
            await this.prisma.productSyncLog.create({
              data: {
                productId: existing.id,
                oldPrice: existing.basePrice,
                newPrice: item.price,
                oldStock: existing.stock,
                newStock: item.stock,
                syncStatus: 'success',
              },
            });
          }
        } else {
          await this.prisma.product.create({
            data: {
              supplierId,
              externalId: item.externalId,
              categoryId,
              name: item.name,
              slug,
              description: item.description,
              basePrice: item.price,
              salePrice,
              stock: item.stock,
              weightGram: item.weightGram || 0,
              images: item.images || [],
              seoTitle,
              seoDescription,
              status: item.stock > 0 ? 'active' : 'out_of_stock',
              lastSyncedAt: new Date(),
            },
          });
        }
      } catch (err) {
        this.logger.error(`Gagal proses produk ${item.externalId}: ${err.message}`);
      }
    }
  }

  /**
   * Sync ringan (harga & stok saja) untuk supplier yang sudah punya produk.
   * Dipanggil oleh cron/repeatable job sesuai sync_interval_minutes.
   * Juga mencoba re-kategorisasi produk yang masih belum punya kategori,
   * berdasarkan namanya sendiri (berguna kalau kategori baru dibuat belakangan).
   */
  async syncPriceStock(supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: BigInt(supplierId) } });
    if (!supplier) throw new Error(`Supplier ${supplierId} tidak ditemukan`);

    const connector = this.connectorRegistry.get(supplier.sourceType);
    const credentials = (supplier.apiCredentials as any) || {};

    const existingProducts = await this.prisma.product.findMany({
      where: { supplierId: supplier.id },
      select: { id: true, externalId: true, name: true, basePrice: true, stock: true, categoryId: true },
    });

    const externalIds = existingProducts.map((p) => p.externalId);
    if (externalIds.length === 0) return { updated: 0 };

    // Proses per-chunk agar tidak mengirim ribuan ID sekaligus ke API supplier
    const chunkSize = 200;
    let updated = 0;

    for (let i = 0; i < externalIds.length; i += chunkSize) {
      const chunk = externalIds.slice(i, i + chunkSize);
      const latest = await connector.fetchPriceStock(credentials, chunk);

      for (const item of latest) {
        const existing = existingProducts.find((p) => p.externalId === item.externalId);
        if (!existing) continue;

        const priceChanged = Number(existing.basePrice) !== item.price;
        const stockChanged = existing.stock !== item.stock;

        let categoryId = existing.categoryId;
        let categoryReassigned = false;
        if (!categoryId) {
          categoryId = await this.categoriesService.matchCategoryForProduct(existing.name);
          if (categoryId) categoryReassigned = true;
        }

        if (!priceChanged && !stockChanged && !categoryReassigned) continue;

        const salePrice = await this.pricingService.calculateSalePrice({
          basePrice: item.price,
          categoryId,
          supplierId: supplier.id,
        });

        await this.prisma.product.update({
          where: { id: existing.id },
          data: {
            basePrice: item.price,
            salePrice,
            stock: item.stock,
            categoryId,
            lastSyncedAt: new Date(),
            status: item.stock > 0 ? 'active' : 'out_of_stock',
          },
        });

        if (priceChanged || stockChanged) {
          await this.prisma.productSyncLog.create({
            data: {
              productId: existing.id,
              oldPrice: existing.basePrice,
              newPrice: item.price,
              oldStock: existing.stock,
              newStock: item.stock,
              syncStatus: 'success',
            },
          });
        }

        updated++;
      }
    }

    await this.prisma.supplier.update({
      where: { id: supplier.id },
      data: { lastSyncedAt: new Date() },
    });

    return { updated };
  }

  private generateSlug(name: string, externalId: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return `${base}-${externalId}`.slice(0, 280);
  }
}
