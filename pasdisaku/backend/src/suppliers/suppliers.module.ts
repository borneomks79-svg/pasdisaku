import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { IMPORT_QUEUE, SYNC_QUEUE } from '../queue/queue.module';

@Module({
  imports: [BullModule.registerQueue({ name: IMPORT_QUEUE }, { name: SYNC_QUEUE })],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
