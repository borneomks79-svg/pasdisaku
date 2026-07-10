import { Module } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BackupController],
})
export class BackupModule {}
