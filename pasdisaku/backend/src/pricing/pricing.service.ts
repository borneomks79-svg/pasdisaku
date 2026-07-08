import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface PricingContext {
  basePrice: number;
  productId?: bigint;
  categoryId?: bigint | null;
  supplierId?: bigint;
}

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Menghitung sale_price dari base_price berdasarkan markup_rules.
   * Prioritas: product-specific > category > supplier > global.
   * Rule dengan `priority` tertinggi pada scope yang sama menang.
   */
  async calculateSalePrice(ctx: PricingContext): Promise<number> {
    const rules = await this.prisma.markupRule.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });

    const scopeOrder = ['product', 'category', 'supplier', 'global'];

    for (const scope of scopeOrder) {
      const refId =
        scope === 'product' ? ctx.productId :
        scope === 'category' ? ctx.categoryId :
        scope === 'supplier' ? ctx.supplierId :
        undefined;

      const matching = rules.filter((r) => {
        if (r.scope !== scope) return false;
        if (scope === 'global') return true;
        return refId != null && r.scopeRefId === refId;
      });

      if (matching.length > 0) {
        return this.applyRule(ctx.basePrice, matching[0]);
      }
    }

    // Fallback jika tidak ada rule sama sekali
    return ctx.basePrice;
  }

  private applyRule(basePrice: number, rule: any): number {
    switch (rule.ruleType) {
      case 'percentage':
        return Math.round(basePrice * (1 + Number(rule.value) / 100));
      case 'fixed_amount':
        return Math.round(basePrice + Number(rule.value));
      case 'tiered': {
        const tiers: { min: number; max: number; markup: number }[] = rule.tieredConfig || [];
        const tier = tiers.find((t) => basePrice >= t.min && basePrice <= t.max);
        const markup = tier ? tier.markup : 0;
        return Math.round(basePrice * (1 + markup / 100));
      }
      default:
        return basePrice;
    }
  }
}
