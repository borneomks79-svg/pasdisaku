import { Module } from '@nestjs/common';
import { CrmWhatsappService } from './crm-whatsapp.service';
import { CrmWhatsappController } from './crm-whatsapp.controller';

@Module({
  controllers: [CrmWhatsappController],
  providers: [CrmWhatsappService],
  exports: [CrmWhatsappService],
})
export class CrmWhatsappModule {}
