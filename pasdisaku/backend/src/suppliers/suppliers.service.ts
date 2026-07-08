import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { IMPORT_QUEUE, SYNC_QUEUE } from '../queue/queue.constants';

@Injectable()
export class SuppliersService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(IMPORT_QUEUE) private importQueue: Queue,
    @InjectQueue(SYNC_QUEUE) private syncQueue: Queue,
  ) {}

  findAll() {
    return this.prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(data: {
    name: string;
    sourceType: string;
    apiCredentials: any;
    syncIntervalMinutes?: number;
  }) {
    const supplier = await this.prisma.supplier.create({
      data: {
        name: data.name,
        sourceType: data.sourceType as any,
        apiCredentials: data.apiCredentials,
        syncIntervalMinutes: data.syncIntervalMinutes || 60,
      },
    });

    // Daftarkan repeatable sync job untuk supplier baru
    await this.syncQueue.add(
      'sync-price-stock',
      { supplierId: supplier.id.toString() },
      {
        jobId: `sync-supplier-${supplier.id}`,
        repeat: { every: supplier.syncIntervalMinutes * 60 * 1000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    return supplier;
  }

  /** Trigger import awal (bulk) secara manual lewat dashboard admin */
  async triggerImport(supplierId: string) {
    const job = await this.importQueue.add(
      'import-products',
      { supplierId },
      { removeOnComplete: 20, removeOnFail: 20 },
    );
    return { jobId: job.id, status: 'queued' };
  }

  /** Trigger sync harga/stok secara manual (di luar jadwal) */
  async triggerSync(supplierId: string) {
    const job = await this.syncQueue.add(
      'sync-price-stock',
      { supplierId },
      { removeOnComplete: 20, removeOnFail: 20 },
    );
    return { jobId: job.id, status: 'queued' };
  }
}
