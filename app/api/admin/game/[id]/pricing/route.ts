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
    const pricing = await getGamePricing(params.id);
    return NextResponse.json({ success: true, data: pricing });
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
    };

    const existing = await getGamePricing(params.id);

    // Merge incoming + existing to have full input for the engine
    const supplierPrice = body.supplierPriceUsd
      ?? Number(existing?.supplierPriceUsd ?? 0);

    const [settings, currency] = await Promise.all([getPriceSettings(), getCurrencySettings()]);
    const engine = new PriceEngineService(settings, currency);

    const strategy: PricingStrategy = body.pricingStrategy
      ?? (existing?.pricingStrategy as PricingStrategy)
      ?? 'GLOBAL';

    const result = engine.calculateFinalGamePrice({
      gameId:               params.id,
      supplierPriceUsd:     supplierPrice,
      steamPriceUsd:        body.steamPriceUsd         ?? Number(existing?.steamPriceUsd)         ?? null,
      steamDiscountPriceUsd: body.steamDiscountPriceUsd ?? Number(existing?.steamDiscountPriceUsd) ?? null,
      pricingStrategy:      strategy,
      customPricingEnabled: body.customPricingEnabled   ?? existing?.customPricingEnabled ?? false,
      customMarkupType:     body.customMarkupType       ?? (existing?.customMarkupType as SmartMarkupType) ?? null,
      customMarkupValue:    body.customMarkupValue       ?? Number(existing?.customMarkupValue)     ?? null,
      customFinalPrice:     body.customFinalPrice        ?? Number(existing?.customFinalPrice)       ?? null,
    });

    const newPriceUzs = Math.round(result.finalPriceUzs);
    const oldPriceUzs = existing ? Number(existing.finalPriceUzs) : null;

    const saved = await upsertGamePricing(
      params.id,
      {
        ...body,
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

    // Sync price to games table so storefront shows the updated price
    const game = await prisma.games.update({
      where: { id: params.id },
      data:  { priceUzs: newPriceUzs, priceUsd: result.finalPriceUsd },
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
