import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

function toSafeJson(value: any): any {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v)),
  );
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('backup')
export class BackupController {
  constructor(private prisma: PrismaService) {}

  @Get('export')
  @Roles('super_admin')
  async exportBackup(@Res() res: Response) {
    const [
      categories,
      products,
      orders,
      orderItems,
      suppliers,
      markupRules,
      waContacts,
    ] = await Promise.all([
      this.prisma.category.findMany(),
      this.prisma.product.findMany(),
      this.prisma.order.findMany(),
      this.prisma.orderItem.findMany(),
      this.prisma.supplier.findMany(),
      this.prisma.markupRule.findMany(),
      this.prisma.waContact.findMany(),
    ]);

    const backup = toSafeJson({
      exportedAt: new Date().toISOString(),
      categories,
      products,
      orders,
      orderItems,
      suppliers,
      markupRules,
      waContacts,
    });

    const filename = `pasdisaku-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(backup, null, 2));
  }
}
