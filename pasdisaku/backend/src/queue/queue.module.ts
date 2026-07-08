import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ImportProcessor, SyncProcessor } from './import.processor';
import { SyncSchedulerService } from './sync-scheduler.service';
import { ImportEngineModule } from '../suppliers/import/import-engine.module';

export const IMPORT_QUEUE = 'import-products';
export const SYNC_QUEUE = 'sync-price-stock';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue({ name: IMPORT_QUEUE }, { name: SYNC_QUEUE }),
    ImportEngineModule,
  ],
  providers: [ImportProcessor, SyncProcessor, SyncSchedulerService],
  exports: [BullModule],
})
export class QueueModule {}
