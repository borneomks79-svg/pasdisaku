import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ImportProcessor, SyncProcessor } from './import.processor';
import { ImportEngineModule } from '../suppliers/import/import-engine.module';
import { IMPORT_QUEUE, SYNC_QUEUE } from './queue.constants';

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
  providers: [ImportProcessor, SyncProcessor],
  exports: [BullModule],
})
export class QueueModule {}
