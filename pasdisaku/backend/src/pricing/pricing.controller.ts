import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('markup-rules')
export class PricingController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.markupRule.findMany({ orderBy: { priority: 'desc' } });
  }

  @Post()
  @Roles('super_admin', 'operator')
  create(@Body() body: any) {
    return this.prisma.markupRule.create({ data: body });
  }

  @Delete(':id')
  @Roles('super_admin')
  remove(@Param('id') id: string) {
    return this.prisma.markupRule.delete({ where: { id: BigInt(id) } });
  }
}
