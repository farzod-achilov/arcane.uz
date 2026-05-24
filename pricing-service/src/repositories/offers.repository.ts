import { PrismaClient, Offer, PricingRule, GlobalConfig, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { ListOffersDto } from '../dto/offers.dto';

const prisma = new PrismaClient();

export class OffersRepository {
  // ─── Offers ─────────────────────────────────────────────────────────────────

  async findMany(filters: ListOffersDto): Promise<{ data: Offer[]; total: number }> {
    const where: Prisma.OfferWhereInput = {
      ...(filters.gameId     && { gameId:     filters.gameId }),
      ...(filters.supplierId && { supplierId: filters.supplierId }),
      ...(filters.currency   && { currency:   filters.currency }),
      ...(filters.isActive   !== undefined && { isActive: filters.isActive }),
    };

    const [data, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        skip:    (filters.page - 1) * filters.limit,
        take:    filters.limit,
        orderBy: { createdAt: 'desc' },
        include: { game: true, supplier: true },
      }),
      prisma.offer.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Offer | null> {
    return prisma.offer.findUnique({
      where:   { id },
      include: { game: true, supplier: true },
    });
  }

  async create(data: {
    gameId:        string;
    supplierId:    string;
    supplierPrice: Decimal;
    markupType:    'percent' | 'fixed';
    markupValue:   Decimal;
    finalPrice:    Decimal;
    currency:      string;
    isActive:      boolean;
  }): Promise<Offer> {
    return prisma.offer.create({ data: data as Prisma.OfferCreateInput });
  }

  async update(
    id:   string,
    data: Partial<{
      supplierPrice: Decimal;
      markupType:    'percent' | 'fixed';
      markupValue:   Decimal;
      finalPrice:    Decimal;
      currency:      string;
      isActive:      boolean;
    }>,
  ): Promise<Offer> {
    return prisma.offer.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Offer> {
    return prisma.offer.delete({ where: { id } });
  }

  // Used by the cron job — fetch all active offers in batches
  async findAllActive(): Promise<Offer[]> {
    return prisma.offer.findMany({ where: { isActive: true } });
  }

  // Bulk finalPrice update (used by cron)
  async bulkUpdateFinalPrice(
    updates: { id: string; finalPrice: Decimal }[],
  ): Promise<void> {
    await prisma.$transaction(
      updates.map(({ id, finalPrice }) =>
        prisma.offer.update({ where: { id }, data: { finalPrice } }),
      ),
    );
  }

  // ─── Pricing rules ───────────────────────────────────────────────────────────

  async findActiveRules(): Promise<PricingRule[]> {
    return prisma.pricingRule.findMany({
      where:   { isActive: true },
      orderBy: { priority: 'desc' },
    });
  }

  async createRule(data: Prisma.PricingRuleCreateInput): Promise<PricingRule> {
    return prisma.pricingRule.create({ data });
  }

  // ─── Global config ───────────────────────────────────────────────────────────

  async getGlobalConfig(): Promise<GlobalConfig | null> {
    return prisma.globalConfig.findFirst();
  }

  async upsertGlobalConfig(globalMarkupPercent: Decimal): Promise<GlobalConfig> {
    const existing = await this.getGlobalConfig();
    if (existing) {
      return prisma.globalConfig.update({
        where: { id: existing.id },
        data:  { globalMarkupPercent },
      });
    }
    return prisma.globalConfig.create({ data: { globalMarkupPercent } });
  }
}
