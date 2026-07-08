import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  create(name: string, slug: string, parentId?: string, autoRule?: any) {
    return this.prisma.category.create({
      data: {
        name,
        slug,
        parentId: parentId ? BigInt(parentId) : undefined,
        autoRule,
      },
    });
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
