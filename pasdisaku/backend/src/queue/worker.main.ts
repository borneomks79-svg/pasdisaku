import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { QueueModule } from './queue.module';

/**
 * Entrypoint terpisah untuk proses worker (cron/BullMQ).
 * Dijalankan sebagai service Docker/PM2 terpisah dari API utama:
 *   npm run worker
 * agar sync 10k-100k produk tidak memblokir request HTTP di proses API.
 */
@Module({
  imports: [QueueModule],
})
class WorkerModule {}

async function bootstrapWorker() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  console.log('Pasdisaku worker (BullMQ) berjalan...');
  await app.init();
}

bootstrapWorker();
