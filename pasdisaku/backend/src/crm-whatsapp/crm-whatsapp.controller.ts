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

  @Post('contacts/bulk-import')
  bulkImport(@Body('contacts') contacts: { name: string; phone: string }[]) {
    return this.crmService.bulkImportContacts(contacts);
  }

  @Delete('contacts/:id')
  deleteContact(@Param('id') id: string) {
    return this.crmService.deleteContact(id);
  }

  @Post('contacts/:id/mark-sent')
  markSent(@Param('id') id: string, @Body('message') message: string) {
    return this.crmService.markContacted(id, message);
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
