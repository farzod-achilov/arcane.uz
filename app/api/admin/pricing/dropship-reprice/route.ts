import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PriceEngineService } from '@/lib/smartPricing/engine';
import { getPriceSettings, getCurrencySettings, upsertGamePricing } from '@/lib/smartPricing/repository';
import type { PricingStrategy, SmartMarkupType } from '@/lib/smartPricing/types';
import { fetchProductById } from '@/lib/kinguin/client';
import { cheapestInStockOffer } from '@/lib/kinguin/productMapper';
import { isKinguinEnabled } from '@/lib/kinguin';
import { requireAdmin } from '@/lib/apiGuard';

/* ─────────────────────────────────────────────────────────
   POST /api/admin/pricing/dropship-reprice

   Профит-звено dropship-модели: тянет ТЕКУЩУЮ закупочную цену
   каждой активной kinguin-игры (самый дешёвый доступный оффер),
   пишет её в game_pricing.supplierPriceUsd и прогоняет через
   Smart Pricing (стратегия + глобальная наценка + округление +
   минимальная прибыль) → games.priceUzs.

   Без этого цена на витрине = голая конвертация закупки, т.е.
   маржа ноль; а если закупка у Kinguin вырастет — продажа уходит
   в минус. Вызывается кроном arcane-api (x-sync-secret) и вручную
   из админки. Игры со стратегией MANUAL не трогаются.

   ?dryRun=1 — только посчитать и показать, ничего не записывать.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const secret   = request.headers.get('x-sync-secret');
  const expected = process.env.SYNC_SECRET;
  const secretOk = expected && secret === expected;
  if (!secretOk) {
    const guard = await requireAdmin();
    if (guard) return guard;
  }

  if (!isKinguinEnabled()) {
    return NextResponse.json({ ok: false, error: 'Kinguin is not configured' });
  }

  const dryRun = new URL(request.url).searchParams.get('dryRun') === '1';

  const games = await prisma.games.findMany({
    where: {
      isActive:           true,
      dropshipSource:     'kinguin',
      dropshipExternalId: { not: null },
    },
    select: { id: true, title: true, priceUsd: true, priceUzs: true, dropshipExternalId: true },
  });
  if (games.length === 0) return NextResponse.json({ ok: true, updated: 0, items: [] });

  // Games with active purchase variants (game_variants) have their own
  // per-variant pricing/dropship SKUs — games.priceUzs there is a synced
  // "starting from" minimum (see lib/db/gameVariants.ts), not something
  // this single-SKU reprice should ever overwrite directly.
  const variantCounts = await prisma.game_variants.groupBy({
    by:     ['gameId'],
    where:  { gameId: { in: games.map(g => g.id) }, isActive: true },
    _count: { _all: true },
  });
  const gamesWithVariants = new Set(variantCounts.map(v => v.gameId));

  const pricingRows = await prisma.game_pricing.findMany({
    where: { gameId: { in: games.map(g => g.id) } },
  });
  const pricingMap = new Map(pricingRows.map(p => [p.gameId, p]));

  const [settings, currency] = await Promise.all([getPriceSettings(), getCurrencySettings()]);
  const engine = new PriceEngineService(settings, currency);

  type Item = {
    title: string; costUsd: number | null;
    oldPriceUzs: number; newPriceUzs: number;
    marginPercent: number | null;
    skipped?: string;
  };
  const items: Item[] = [];
  let updated = 0;

  for (const game of games) {
    const p        = pricingMap.get(game.id);
    const strategy = (p?.pricingStrategy ?? settings.defaultStrategy) as PricingStrategy;
    const oldUzs   = Number(game.priceUzs ?? 0);

    // ручную цену админа автоматика не перетирает
    if (strategy === 'MANUAL') {
      items.push({ title: game.title, costUsd: null, oldPriceUzs: oldUzs, newPriceUzs: oldUzs, marginPercent: null, skipped: 'MANUAL strategy' });
      continue;
    }

    // has purchase variants — priceUzs here is a synced minimum, not this
    // game's own single SKU's price; repricing per-variant is a deferred v2
    if (gamesWithVariants.has(game.id)) {
      items.push({ title: game.title, costUsd: null, oldPriceUzs: oldUzs, newPriceUzs: oldUzs, marginPercent: null, skipped: 'has purchase variants' });
      continue;
    }

    let costUsd: number;
    try {
      const product = await fetchProductById(Number(game.dropshipExternalId));
      const offer   = cheapestInStockOffer(product);
      costUsd       = offer?.price ?? product.price;
      if (!costUsd || costUsd <= 0) throw new Error('supplier returned zero price');
    } catch (err) {
      items.push({
        title: game.title, costUsd: null, oldPriceUzs: oldUzs, newPriceUzs: oldUzs,
        marginPercent: null, skipped: err instanceof Error ? err.message : 'fetch failed',
      });
      continue;
    }

    const result = engine.calculateFinalGamePrice({
      gameId:                game.id,
      supplierPriceUsd:      costUsd,
      steamPriceUsd:         p ? Number(p.steamPriceUsd)         || null : null,
      steamDiscountPriceUsd: p ? Number(p.steamDiscountPriceUsd) || null : null,
      pricingStrategy:       strategy,
      customPricingEnabled:  p?.customPricingEnabled ?? false,
      customMarkupType:      (p?.customMarkupType ?? null) as SmartMarkupType | null,
      customMarkupValue:     p?.customMarkupValue != null ? Number(p.customMarkupValue) : null,
      customFinalPrice:      p?.customFinalPrice  != null ? Number(p.customFinalPrice)  : null,
    });

    const newUzs = Math.round(result.finalPriceUzs);
    items.push({
      title: game.title, costUsd,
      oldPriceUzs: oldUzs, newPriceUzs: newUzs,
      marginPercent: result.marginPercent,
    });

    if (!dryRun && newUzs !== oldUzs) {
      await upsertGamePricing(
        game.id,
        {
          supplierPriceUsd: costUsd,
          finalPriceUsd:    result.finalPriceUsd,
          finalPriceUzs:    newUzs,
          youSaveAmount:    result.youSaveAmount,
          youSavePercent:   result.youSavePercent,
          marginPercent:    result.marginPercent,
          pricingStrategy:  strategy,
          steamPriceUsd:    p?.steamPriceUsd ?? null,
          steamDiscountPriceUsd: p?.steamDiscountPriceUsd ?? null,
        },
        {
          event:           'dropship_reprice',
          previousUsd:     Number(game.priceUsd ?? 0),
          newUsd:          result.finalPriceUsd,
          previousUzs:     oldUzs,
          newUzs,
          appliedStrategy: strategy,
          appliedRules:    result.appliedRules,
        },
      );
      await prisma.games.update({
        where: { id: game.id },
        data:  { priceUsd: result.finalPriceUsd, priceUzs: newUzs },
      });
      updated++;
    }
  }

  return NextResponse.json({ ok: true, dryRun, total: games.length, updated, items });
}
