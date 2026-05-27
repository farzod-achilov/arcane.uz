import { NextResponse } from 'next/server';
import { PriceEngineService }           from '@/lib/smartPricing/engine';
import { getPriceSettings, getCurrencySettings, getGamePricing, upsertGamePricing } from '@/lib/smartPricing/repository';
import { prisma } from '@/lib/prisma';
import { notifyWishlistPriceDrop } from '@/lib/delivery/notify';
import type { PricingStrategy, SmartMarkupType } from '@/lib/smartPricing/types';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const [pricing, game] = await Promise.all([
      getGamePricing(params.id),
      prisma.games.findUnique({ where: { id: params.id }, select: { productType: true } }),
    ]);
    return NextResponse.json({ success: true, data: { ...pricing, productType: game?.productType ?? 'KEY' } });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const body = await req.json() as {
      supplierPriceUsd?:      number;
      steamPriceUsd?:         number | null;
      steamDiscountPriceUsd?: number | null;
      pricingStrategy?:       PricingStrategy;
      customPricingEnabled?:  boolean;
      customMarkupType?:      SmartMarkupType | null;
      customMarkupValue?:     number | null;
      customFinalPrice?:      number | null;
      notes?:                 string;
      productType?:           'KEY' | 'GIFT' | 'ACCOUNT';
    };

    const { productType, ...pricingBody } = body;

    const existing = await getGamePricing(params.id);

    // Merge incoming + existing to have full input for the engine
    const supplierPrice = pricingBody.supplierPriceUsd
      ?? Number(existing?.supplierPriceUsd ?? 0);

    const [settings, currency] = await Promise.all([getPriceSettings(), getCurrencySettings()]);
    const engine = new PriceEngineService(settings, currency);

    const strategy: PricingStrategy = pricingBody.pricingStrategy
      ?? (existing?.pricingStrategy as PricingStrategy)
      ?? 'GLOBAL';

    const result = engine.calculateFinalGamePrice({
      gameId:               params.id,
      supplierPriceUsd:     supplierPrice,
      steamPriceUsd:        pricingBody.steamPriceUsd         ?? Number(existing?.steamPriceUsd)         ?? null,
      steamDiscountPriceUsd: pricingBody.steamDiscountPriceUsd ?? Number(existing?.steamDiscountPriceUsd) ?? null,
      pricingStrategy:      strategy,
      customPricingEnabled: pricingBody.customPricingEnabled   ?? existing?.customPricingEnabled ?? false,
      customMarkupType:     pricingBody.customMarkupType       ?? (existing?.customMarkupType as SmartMarkupType) ?? null,
      customMarkupValue:    pricingBody.customMarkupValue       ?? Number(existing?.customMarkupValue)     ?? null,
      customFinalPrice:     pricingBody.customFinalPrice        ?? Number(existing?.customFinalPrice)       ?? null,
    });

    const newPriceUzs = Math.round(result.finalPriceUzs);
    const oldPriceUzs = existing ? Number(existing.finalPriceUzs) : null;

    const saved = await upsertGamePricing(
      params.id,
      {
        ...pricingBody,
        supplierPriceUsd:  result.supplierPriceUsd,
        finalPriceUsd:     result.finalPriceUsd,
        finalPriceUzs:     newPriceUzs,
        youSaveAmount:     result.youSaveAmount,
        youSavePercent:    result.youSavePercent,
        marginPercent:     result.marginPercent,
        pricingStrategy:   strategy,
      },
      {
        event:           'price_calculated',
        previousUsd:     existing ? Number(existing.finalPriceUsd) : null,
        newUsd:          result.finalPriceUsd,
        previousUzs:     oldPriceUzs,
        newUzs:          newPriceUzs,
        appliedStrategy: strategy,
        appliedRules:    result.appliedRules,
      },
    );

    // Sync price (and productType if provided) to games table
    const game = await prisma.games.update({
      where: { id: params.id },
      data:  {
        priceUzs: newPriceUzs,
        priceUsd: result.finalPriceUsd,
        ...(productType ? { productType } : {}),
      },
      select: { id: true, title: true, slug: true },
    });

    // Notify wishlist users if price dropped by more than 5%
    if (oldPriceUzs && newPriceUzs < oldPriceUzs * 0.95) {
      notifyWishlistPriceDrop({
        gameId:    params.id,
        gameTitle: game.title,
        gameSlug:  game.slug,
        oldPrice:  oldPriceUzs,
        newPrice:  newPriceUzs,
      }).catch(() => null);
    }

    return NextResponse.json({ success: true, data: saved, calculated: result });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
