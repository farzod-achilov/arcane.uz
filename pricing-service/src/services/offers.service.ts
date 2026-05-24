import Decimal from 'decimal.js';
import { Offer } from '@prisma/client';
import { OffersRepository }         from '../repositories/offers.repository';
import { PricingService }           from './pricing.service';
import { CreateOfferDto, UpdateOfferDto, ListOffersDto } from '../dto/offers.dto';
import { NotFoundError }            from '../middleware/error.middleware';
import { toDecimal }                from '../utils/decimal';
import { PaginatedResult }          from '../types';

export class OffersService {
  constructor(
    private readonly repo:    OffersRepository,
    private readonly pricing: PricingService,
  ) {}

  // ─── List ──────────────────────────────────────────────────────────────────

  async list(filters: ListOffersDto): Promise<PaginatedResult<Offer>> {
    const { data, total } = await this.repo.findMany(filters);
    return { data, total, page: filters.page, limit: filters.limit };
  }

  // ─── Get one ───────────────────────────────────────────────────────────────

  async getById(id: string): Promise<Offer> {
    const offer = await this.repo.findById(id);
    if (!offer) throw new NotFoundError(`Offer ${id}`);
    return offer;
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateOfferDto): Promise<Offer> {
    const supplierPrice = toDecimal(dto.supplierPrice);
    const markupValue   = toDecimal(dto.markupValue);

    const { globalMarkupPercent, activeRules } = await this.fetchPricingContext();

    const { finalPrice } = this.pricing.calculateFinalPrice({
      supplierPrice,
      markupType: dto.markupType,
      markupValue,
      globalMarkupPercent,
      activeRules,
    });

    return this.repo.create({
      gameId:        dto.gameId,
      supplierId:    dto.supplierId,
      supplierPrice,
      markupType:    dto.markupType,
      markupValue,
      finalPrice,
      currency:      dto.currency ?? 'USD',
      isActive:      dto.isActive ?? true,
    });
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateOfferDto): Promise<Offer> {
    const existing = await this.getById(id);

    // Merge incoming values with existing ones
    const supplierPrice = toDecimal(dto.supplierPrice ?? existing.supplierPrice.toString());
    const markupType    = dto.markupType ?? (existing.markupType as 'percent' | 'fixed');
    const markupValue   = toDecimal(dto.markupValue   ?? existing.markupValue.toString());

    const { globalMarkupPercent, activeRules } = await this.fetchPricingContext();

    const { finalPrice } = this.pricing.calculateFinalPrice({
      supplierPrice,
      markupType,
      markupValue,
      globalMarkupPercent,
      activeRules,
    });

    return this.repo.update(id, {
      ...(dto.supplierPrice !== undefined && { supplierPrice }),
      ...(dto.markupType    !== undefined && { markupType }),
      ...(dto.markupValue   !== undefined && { markupValue }),
      ...(dto.currency      !== undefined && { currency: dto.currency }),
      ...(dto.isActive      !== undefined && { isActive: dto.isActive }),
      finalPrice, // always recalculated
    });
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async delete(id: string): Promise<{ id: string }> {
    await this.getById(id); // ensure exists
    await this.repo.delete(id);
    return { id };
  }

  // ─── Bulk recalculate (used by cron job) ──────────────────────────────────

  async recalculateAll(): Promise<{ updated: number }> {
    const offers = await this.repo.findAllActive();
    const { globalMarkupPercent, activeRules } = await this.fetchPricingContext();

    const updates = offers.map((offer) => {
      const { finalPrice } = this.pricing.calculateFinalPrice({
        supplierPrice:       toDecimal(offer.supplierPrice.toString()),
        markupType:          offer.markupType as 'percent' | 'fixed',
        markupValue:         toDecimal(offer.markupValue.toString()),
        globalMarkupPercent,
        activeRules,
      });
      return { id: offer.id, finalPrice };
    });

    await this.repo.bulkUpdateFinalPrice(updates);
    return { updated: updates.length };
  }

  // ─── Global config helpers ─────────────────────────────────────────────────

  async setGlobalMarkup(percent: number): Promise<void> {
    await this.repo.upsertGlobalConfig(toDecimal(percent));
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private async fetchPricingContext(): Promise<{
    globalMarkupPercent: Decimal;
    activeRules:         Awaited<ReturnType<OffersRepository['findActiveRules']>>;
  }> {
    const [config, activeRules] = await Promise.all([
      this.repo.getGlobalConfig(),
      this.repo.findActiveRules(),
    ]);

    const globalMarkupPercent = config
      ? toDecimal(config.globalMarkupPercent.toString())
      : new Decimal(0);

    return { globalMarkupPercent, activeRules };
  }
}
