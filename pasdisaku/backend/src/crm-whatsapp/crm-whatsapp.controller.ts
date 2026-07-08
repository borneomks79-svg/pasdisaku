import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmWhatsappService } from './crm-whatsapp.service';

@UseGuards(JwtAuthGuard)
@Controller('crm-whatsapp')
export class CrmWhatsappController {
  constructor(private crmService: CrmWhatsappService) {}

  @Get('contacts')
  findAllContacts() {
    return this.crmService.findAllContacts();
  }

  @Post('contacts')
  upsertContact(@Body('name') name: string, @Body('phone') phone: string, @Body('tags') tags?: string[]) {
    return this.crmService.upsertContact(name, phone, tags);
  }

  @Delete('contacts/:id')
  deleteContact(@Param('id') id: string) {
    return this.crmService.deleteContact(id);
  }

  @Post('send')
  sendMessage(
    @Body('phone') phone: string,
    @Body('message') message: string,
    @Body('campaignName') campaignName?: string,
  ) {
    return this.crmService.sendMessage(phone, message, campaignName);
  }

  @Get('logs')
  getLogs(@Query('contactId') contactId?: string) {
    return this.crmService.getMessageLogs(contactId);
  }
}
