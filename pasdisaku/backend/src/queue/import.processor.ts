import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ImportService } from '../suppliers/import/import.service';
import { IMPORT_QUEUE, SYNC_QUEUE } from './queue.module';

interface ImportJobData {
  supplierId: string;
}

@Processor(IMPORT_QUEUE)
export class ImportProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportProcessor.name);

  constructor(private importService: ImportService) {
    super();
  }

  async process(job: Job<ImportJobData>): Promise<any> {
    this.logger.log(`Mulai import supplier ${job.data.supplierId} (job ${job.id})`);
    const result = await this.importService.importFromSupplier(job.data.supplierId);
    this.logger.log(`Selesai import supplier ${job.data.supplierId}: ${result.totalImported} produk`);
    return result;
  }
}

@Processor(SYNC_QUEUE)
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(private importService: ImportService) {
    super();
  }

  async process(job: Job<ImportJobData>): Promise<any> {
    this.logger.log(`Mulai sync harga/stok supplier ${job.data.supplierId} (job ${job.id})`);
    const result = await this.importService.syncPriceStock(job.data.supplierId);
    this.logger.log(`Selesai sync supplier ${job.data.supplierId}: ${result.updated} produk diperbarui`);
    return result;
  }
}
