import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ImportProcessor, SyncProcessor } from './import.processor';
import { ImportEngineModule } from '../suppliers/import/import-engine.module';
import { IMPORT_QUEUE, SYNC_QUEUE } from './queue.constants';
import { SyncSchedulerService } from './sync-scheduler.service';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    BullModule.registerQueue({ name: IMPORT_QUEUE }, { name: SYNC_QUEUE }),
    ImportEngineModule,
  ],
  providers: [ImportProcessor, SyncProcessor, SyncSchedulerService],
  exports: [BullModule],
})
export class QueueModule {}
