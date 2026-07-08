import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CrmWhatsappService {
  private readonly logger = new Logger(CrmWhatsappService.name);

  constructor(private prisma: PrismaService) {}

  async findAllContacts() {
    const contacts = await this.prisma.waContact.findMany({ orderBy: { createdAt: 'desc' } });
    return contacts.map((c) => ({ ...c, id: c.id.toString() }));
  }

  async upsertContact(name: string, phone: string, tags?: string[]) {
    const contact = await this.prisma.waContact.upsert({
      where: { phone },
      update: { name, tags },
      create: { name, phone, tags },
    });
    return { ...contact, id: contact.id.toString() };
  }

  /**
   * Mengirim pesan lewat WhatsApp Business Cloud API (resmi, Meta).
   * Perlu WA_PHONE_NUMBER_ID & WA_ACCESS_TOKEN di .env.
   * Untuk broadcast massal, gunakan template message resmi (bukan free-form)
   * agar sesuai kebijakan WhatsApp Business.
   */
  async sendMessage(contactPhone: string, message: string, campaignName?: string) {
    const contact = await this.prisma.waContact.upsert({
      where: { phone: contactPhone },
      update: {},
      create: { phone: contactPhone },
    });

    const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
    const accessToken = process.env.WA_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      this.logger.warn('WA_PHONE_NUMBER_ID/WA_ACCESS_TOKEN belum diset, pesan tidak benar-benar terkirim');
      return this.logMessage(contact.id, message, campaignName, 'failed');
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: contactPhone,
          type: 'text',
          text: { body: message },
        }),
      });

      const status = res.ok ? 'sent' : 'failed';
      await this.prisma.waContact.update({
        where: { id: contact.id },
        data: { lastContactedAt: new Date() },
      });
      return this.logMessage(contact.id, message, campaignName, status);
    } catch (err) {
      this.logger.error(`Gagal kirim WA ke ${contactPhone}: ${err.message}`);
      return this.logMessage(contact.id, message, campaignName, 'failed');
    }
  }

  private logMessage(contactId: bigint, content: string, campaignName?: string, status = 'sent') {
    return this.prisma.waMessageLog.create({
      data: { contactId, messageContent: content, campaignName, status },
    });
  }

  getMessageLogs(contactId?: string) {
    return this.prisma.waMessageLog.findMany({
      where: contactId ? { contactId: BigInt(contactId) } : undefined,
      orderBy: { sentAt: 'desc' },
      take: 200,
    });
  }
}
