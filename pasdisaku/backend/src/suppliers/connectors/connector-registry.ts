import { Injectable } from '@nestjs/common';
import { SupplierConnector } from './supplier-connector.interface';
import { CsvFeedConnector } from './csv-feed.connector';

/**
 * Registry sederhana untuk memetakan source_type -> implementasi connector.
 *
 * Untuk menambah Shopee/Tokopedia API resmi:
 * 1. Daftarkan aplikasi di Shopee Open Platform / Tokopedia Partner Center
 *    untuk mendapatkan App ID & Secret.
 * 2. Buat class baru (mis. ShopeeApiConnector) yang implement SupplierConnector,
 *    memakai HMAC signing sesuai dokumentasi resmi masing-masing platform.
 * 3. Daftarkan instance-nya di constructor registry ini.
 */
@Injectable()
export class ConnectorRegistry {
  private connectors: Map<string, SupplierConnector> = new Map();

  constructor(private csvFeedConnector: CsvFeedConnector) {
    this.register(csvFeedConnector);
    // this.register(shopeeApiConnector);      // TODO: implementasi API resmi Shopee
    // this.register(tokopediaApiConnector);   // TODO: implementasi API resmi Tokopedia
  }

  private register(connector: SupplierConnector) {
    this.connectors.set(connector.sourceType, connector);
  }

  get(sourceType: string): SupplierConnector {
    const connector = this.connectors.get(sourceType);
    if (!connector) {
      throw new Error(`Tidak ada connector terdaftar untuk source_type: ${sourceType}`);
    }
    return connector;
  }
}
