import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const pageSize = Math.min(parseInt(query.pageSize || '25', 10), 100);

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = BigInt(query.categoryId);
    if (query.supplierId) where.supplierId = BigInt(query.supplierId);
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: { category: true, supplier: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map(this.serialize),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: BigInt(id) },
      include: { category: true, supplier: true, syncLogs: { take: 10, orderBy: { syncedAt: 'desc' } } },
    });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return this.serialize(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id: BigInt(id) } });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');

    const data: any = { ...dto };
    if (dto.categoryId !== undefined) data.categoryId = BigInt(dto.categoryId);

    const updated = await this.prisma.product.update({
      where: { id: BigInt(id) },
      data,
    });
    return this.serialize(updated);
  }

  async remove(id: string) {
    await this.prisma.product.delete({ where: { id: BigInt(id) } });
    return { success: true };
  }

  async dashboardStats() {
    const [totalProducts, activeProducts, outOfStock, totalOrders, pendingOrders] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { status: 'active' } }),
      this.prisma.product.count({ where: { status: 'out_of_stock' } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'pending' } }),
    ]);
    return { totalProducts, activeProducts, outOfStock, totalOrders, pendingOrders };
  }

  // Prisma returns BigInt fields which don't serialize to JSON by default
  private serialize(product: any) {
    return {
      ...product,
      id: product.id?.toString(),
      supplierId: product.supplierId?.toString(),
      categoryId: product.categoryId?.toString() ?? null,
      woocommerceId: product.woocommerceId?.toString() ?? null,
    };
  }
}
