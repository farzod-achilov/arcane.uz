import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/apiGuard';
import { syncGameFromVariants } from '@/lib/db/gameVariants';
import { fetchProductById } from '@/lib/kinguin/client';
import { cheapestInStockOffer } from '@/lib/kinguin/productMapper';
import { PriceEngineService } from '@/lib/smartPricing/engine';
import { getPriceSettings, getCurrencySettings, getGamePricing } from '@/lib/smartPricing/repository';
import { getEurUsdRate } from '@/lib/shared/fxRate';
import type { PricingStrategy } from '@/lib/smartPricing/types';

export const dynamic = 'force-dynamic';

/* ─────────────────────────────────────────────────────────
   POST /api/admin/game-variants/[id]/refresh-price

   Pulls the variant's CURRENT Kinguin cost and recomputes its price
   through Smart Pricing — the per-variant equivalent of
   /api/admin/pricing/dropship-reprice, which explicitly skips any game
   that has active variants (each needs its own supplier lookup, see that
   route's "has purchase variants" branch). Uses the VARIANT's own
   pricingStrategy (each variant can run a different strategy — e.g. "Ключ"
   priced Aggressive, "Аккаунт" priced Global) and the game's shared
   game_pricing.steamPriceUsd (Steam sells one canonical version regardless
   of which Kinguin delivery format the customer buys from us).
───────────────────────────────────────────────────────── */

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const variant = await prisma.game_variants.findUnique({ where: { id: params.id } });
  if (!variant) {
    return NextResponse.json({ ok: false, error: 'Вариант не найден' }, { status: 404 });
  }
  if (variant.dropshipSource !== 'kinguin' || !variant.dropshipExternalId) {
    return NextResponse.json({ ok: false, error: 'У варианта нет привязки к Kinguin' }, { status: 400 });
  }
  // resolveStrategy() has no MANUAL case — it silently falls through to
  // GLOBAL's markup rule, which would recompute a "manual" price out from
  // under the admin without any signal. Variants have no customFinalPrice
  // field to hand-set through this endpoint, so refuse instead of guessing.
  if (variant.pricingStrategy === 'MANUAL') {
    return NextResponse.json(
      { ok: false, error: 'Стратегия Manual — цена не пересчитывается автоматически, отредактируйте поле цены вручную' },
      { status: 400 },
    );
  }

  let costUsd: number;
  try {
    const product = await fetchProductById(Number(variant.dropshipExternalId));
    const offer   = cheapestInStockOffer(product);
    const costEur = offer?.price ?? product.price;
    if (!costEur || costEur <= 0) throw new Error('Kinguin вернул нулевую цену');
    // Kinguin's price/offer.price are EUR — see lib/kinguin/types.ts header comment
    costUsd = costEur * (await getEurUsdRate());
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Не удалось получить цену с Kinguin' },
      { status: 502 },
    );
  }

  const [settings, currency, gamePricing] = await Promise.all([
    getPriceSettings(),
    getCurrencySettings(),
    getGamePricing(variant.gameId),
  ]);
  const strategy = (variant.pricingStrategy as PricingStrategy | undefined) ?? settings.defaultStrategy;
  const engine   = new PriceEngineService(settings, currency);

  const result = engine.calculateFinalGamePrice({
    gameId:                variant.gameId,
    supplierPriceUsd:      costUsd,
    steamPriceUsd:         gamePricing ? Number(gamePricing.steamPriceUsd) || null : null,
    steamDiscountPriceUsd: gamePricing ? Number(gamePricing.steamDiscountPriceUsd) || null : null,
    pricingStrategy:       strategy,
    customPricingEnabled:  false,
    customMarkupType:      null,
    customMarkupValue:     null,
    customFinalPrice:      null,
  });

  const newPriceUzs = Math.round(result.finalPriceUzs);

  const updated = await prisma.$transaction(async tx => {
    const u = await tx.game_variants.update({
      where: { id: params.id },
      data:  { priceUzs: newPriceUzs, priceUsd: result.finalPriceUsd },
    });
    await syncGameFromVariants(tx, variant.gameId);
    return u;
  });

  return NextResponse.json({
    ok: true,
    variant: { id: updated.id, priceUzs: updated.priceUzs, priceUsd: updated.priceUsd },
    costUsd,
    marginPercent: result.marginPercent,
  });
}
