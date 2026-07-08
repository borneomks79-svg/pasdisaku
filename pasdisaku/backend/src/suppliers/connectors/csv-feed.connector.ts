import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { SupplierConnector, RawProductData } from './supplier-connector.interface';

/**
 * Konektor untuk supplier yang menyediakan feed CSV resmi (mis. lewat URL
 * feed publik yang mereka sediakan sebagai bagian dari kerja sama dropship).
 *
 * credentials yang diharapkan:
 * { feedUrl: string, columnMapping?: { name, price, stock, sku, description } }
 */
@Injectable()
export class CsvFeedConnector implements SupplierConnector {
  readonly sourceType = 'csv_feed';

  async validateCredentials(credentials: Record<string, any>): Promise<boolean> {
    if (!credentials?.feedUrl) return false;
    try {
      const res = await fetch(credentials.feedUrl, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async fetchAllProducts(
    credentials: Record<string, any>,
    onBatch: (batch: RawProductData[]) => Promise<void>,
    batchSize = 500,
  ): Promise<void> {
    const res = await fetch(credentials.feedUrl);
    if (!res.ok) throw new Error(`Gagal mengambil feed CSV: ${res.status}`);

    const mapping = credentials.columnMapping || {
      name: 'name',
      price: 'price',
      stock: 'stock',
      sku: 'sku',
      description: 'description',
    };

    const body = await res.text();
    const parser = Readable.from(body).pipe(
      parse({ columns: true, skip_empty_lines: true, trim: true }),
    );

    let buffer: RawProductData[] = [];

    for await (const row of parser) {
      buffer.push({
        externalId: String(row[mapping.sku] ?? row.sku ?? row.id),
        name: String(row[mapping.name] ?? row.name),
        description: row[mapping.description] ?? row.description ?? '',
        price: parseFloat(row[mapping.price] ?? row.price ?? '0'),
        stock: parseInt(row[mapping.stock] ?? row.stock ?? '0', 10),
        weightGram: row.weight ? parseInt(row.weight, 10) : 0,
        images: row.images ? String(row.images).split('|') : [],
        categoryHint: row.category || row.categoryHint || undefined,
      });

      if (buffer.length >= batchSize) {
        await onBatch(buffer);
        buffer = [];
      }
    }

    if (buffer.length > 0) {
      await onBatch(buffer);
    }
  }

  async fetchPriceStock(
    credentials: Record<string, any>,
    externalIds: string[],
  ): Promise<{ externalId: string; price: number; stock: number }[]> {
    // Untuk CSV feed, cara paling sederhana & sesuai ToS supplier adalah
    // menarik ulang feed lengkap lalu filter. Untuk feed besar, supplier
    // yang lebih baik biasanya juga menyediakan endpoint delta/price-only.
    const results: { externalId: string; price: number; stock: number }[] = [];
    const idsSet = new Set(externalIds);

    await this.fetchAllProducts(credentials, async (batch) => {
      for (const item of batch) {
        if (idsSet.has(item.externalId)) {
          results.push({ externalId: item.externalId, price: item.price, stock: item.stock });
        }
      }
    });

    return results;
  }
}
