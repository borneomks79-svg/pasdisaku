import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async findAllPublic() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: { where: { status: 'active' } } } },
      },
    });

    return categories.map((c) => ({
      id: c.id.toString(),
      parentId: c.parentId ? c.parentId.toString() : null,
      name: c.name,
      slug: c.slug,
      productCount: c._count.products,
    }));
  }

  create(name: string, slug: string, parentId?: string, autoRule?: any) {
    return this.prisma.category.create({
      data: {
        name,
        slug,
        parentId: parentId ? BigInt(parentId) : undefined,
        autoRule: autoRule ?? Prisma.JsonNull,
      },
    });
  }

  async update(id: string, name?: string, slug?: string, parentId?: string, autoRule?: any) {
    const existing = await this.prisma.category.findUnique({ where: { id: BigInt(id) } });
    if (!existing) throw new NotFoundException('Kategori tidak ditemukan');

    return this.prisma.category.update({
      where: { id: BigInt(id) },
      data: {
        name: name ?? undefined,
        slug: slug ?? undefined,
        parentId: parentId === undefined ? undefined : parentId ? BigInt(parentId) : null,
        autoRule: autoRule === undefined ? undefined : autoRule ?? Prisma.JsonNull,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id: BigInt(id) } });
    if (!existing) throw new NotFoundException('Kategori tidak ditemukan');

    await this.prisma.product.updateMany({
      where: { categoryId: BigInt(id) },
      data: { categoryId: null },
    });

    await this.prisma.category.updateMany({
      where: { parentId: BigInt(id) },
      data: { parentId: null },
    });

    return this.prisma.category.delete({ where: { id: BigInt(id) } });
  }

  /**
   * Mencocokkan nama produk terhadap auto_rule setiap kategori (keyword-based).
   * auto_rule contoh: { "keywords": ["hijab", "kerudung", "pashmina"] }
   * Dipanggil oleh import engine saat produk baru masuk tanpa kategori dari sumber.
   */
  async matchCategoryForProduct(productName: string): Promise<bigint | null> {
    const categories = await this.prisma.category.findMany({
      where: { autoRule: { not: Prisma.JsonNull } },
    });

    const lowerName = productName.toLowerCase();
    let bestMatch: { id: bigint; score: number } | null = null;

    for (const cat of categories) {
      const rule = cat.autoRule as any;
      const keywords: string[] = rule?.keywords || [];
      const score = keywords.filter((kw) => lowerName.includes(kw.toLowerCase())).length;
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { id: cat.id, score };
      }
    }

    return bestMatch ? bestMatch.id : null;
  }
}
