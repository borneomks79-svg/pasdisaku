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
    whatsappNumber?: string;
    sourceType: string;
    apiCredentials: any;
    syncIntervalMinutes?: number;
  }) {
    const supplier = await this.prisma.supplier.create({
      data: {
        name: data.name,
        whatsappNumber: data.whatsappNumber ? this.normalizePhone(data.whatsappNumber) : null,
        sourceType: data.sourceType as any,
        apiCredentials: data.apiCredentials,
        syncIntervalMinutes: data.syncIntervalMinutes || 60,
      },
    });

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

  async update(id: string, data: { name?: string; whatsappNumber?: string }) {
    return this.prisma.supplier.update({
      where: { id: BigInt(id) },
      data: {
        name: data.name ?? undefined,
        whatsappNumber:
          data.whatsappNumber !== undefined
            ? (data.whatsappNumber ? this.normalizePhone(data.whatsappNumber) : null)
            : undefined,
      },
    });
  }

  async triggerImport(supplierId: string) {
    const job = await this.importQueue.add(
      'import-products',
      { supplierId },
      { removeOnComplete: 20, removeOnFail: 20 },
    );
    return { jobId: job.id, status: 'queued' };
  }

  async triggerSync(supplierId: string) {
    const job = await this.syncQueue.a
