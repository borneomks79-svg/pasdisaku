import { Controller, Get, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public/products')
export class PublicProductsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(@Query('page') page = '1', @Query('pageSize') pageSize = '12', @Query('search') search?: string) {
    const p = parseInt(page, 10);
    const ps = Math.min(parseInt(pageSize, 10), 50);

    const where: any = { status: 'active' };
    if (search) {
      where.OR = [{ name: { contains: search } }, { description: { contains: search } }];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (p - 1) * ps,
        take: ps,
        orderBy: { updatedAt: 'desc' },
        include: { category: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((i) => ({ ...i, id: i.id.toString(), supplierId: i.supplierId.toString(), categoryId: i.categoryId?.toString() ?? null })),
      pagination: { page: p, pageSize: ps, total, totalPages: Math.ceil(total / ps) },
    };
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!product || product.status !== 'active') return null;
    return { ...product, id: product.id.toString(), supplierId: product.supplierId.toString(), categoryId: product.categoryId?.toString() ?? null };
  }
}
