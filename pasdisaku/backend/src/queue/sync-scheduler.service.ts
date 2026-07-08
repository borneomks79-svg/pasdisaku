import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { SYNC_QUEUE } from './queue.module';

@Injectable()
export class SyncSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SyncSchedulerService.name);

  constructor(
    @InjectQueue(SYNC_QUEUE) private syncQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.registerRepeatableJobs();
  }

  /**
   * Mendaftarkan repeatable job untuk setiap supplier aktif sesuai
   * sync_interval_minutes masing-masing. Dipanggil saat worker start,
   * dan bisa dipanggil ulang lewat endpoint admin saat supplier baru ditambah.
   */
  async registerRepeatableJobs() {
    const suppliers = await this.prisma.supplier.findMany({ where: { isActive: true } });

    for (const supplier of suppliers) {
      const jobId = `sync-supplier-${supplier.id}`;
      await this.syncQueue.add(
        'sync-price-stock',
        { supplierId: supplier.id.toString() },
        {
          jobId,
          repeat: { every: supplier.syncIntervalMinutes * 60 * 1000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );
      this.logger.log(
        `Registered sync job untuk ${supplier.name} setiap ${supplier.syncIntervalMinutes} menit`,
      );
    }
  }
}
