import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PriceEngineService } from '@/lib/smartPricing/engine';
import { getPriceSettings, getCurrencySettings } from '@/lib/smartPricing/repository';
import { syncGameFromVariants } from '@/lib/db/gameVariants';
import type { PricingStrategy } from '@/lib/smartPricing/types';
import { fetchProductById } from '@/lib/kinguin/client';
import { cheapestInStockOffer } from '@/lib/kinguin/productMapper';
import { isKinguinEnabled } from '@/lib/kinguin';
import { requireAdmin } from '@/lib/apiGuard';
import { getEurUsdRate } from '@/lib/shared/fxRate';

/* ─────────────────────────────────────────────────────────
   POST /api/admin/pricing/dropship-variant-reprice

   The bulk/cron equivalent of POST /api/admin/game-variants/[id]/refresh-price
   (which only ever runs one variant at a time, by hand, from the admin UI).
   /api/admin/pricing/dropship-reprice explicitly skips any game that has
   active game_variants — this route is what actually keeps THOSE prices
   current, so a variant's margin doesn't just sit stale between manual
   clicks as Kinguin's own cost drifts.

   Each variant keeps its own pricingStrategy (see game_variants schema) —
   MANUAL-strategy variants are skipped, same rule as the single-variant
   route. Steam comparison price is read from the shared game_pricing row
   (Steam sells one canonical version regardless of which Kinguin delivery
   format the customer buys). Deliberately does NOT call upsertGamePricing()
   — game_pricing.gameId is unique, one row per GAME not per variant — only
   game_variants.priceUzs/priceUsd get written, then syncGameFromVariants()
   keeps the parent game's own priceUzs/deliveryType/dropshipSource in sync
   with whichever variant is now cheapest.

   ?dryRun=1 — only compute and report, write nothing.
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

  const variants = await prisma.game_variants.findMany({
    where: {
      isActive:           true,
      dropshipSource:     'kinguin',
      dropshipExternalId: { not: null },
      game:               { isActive: true },
    },
    select: {
      id: true, label: true, priceUsd: true, priceUzs: true,
      dropshipExternalId: true, pricingStrategy: true, gameId: true,
      game: { select: { title: true } },
    },
  });
  if (variants.length === 0) return NextResponse.json({ ok: true, updated: 0, items: [] });

  const gamePricingRows = await prisma.game_pricing.findMany({
    where: { gameId: { in: Array.from(new Set(variants.map(v => v.gameId))) } },
  });
  const gamePricingMap = new Map(gamePricingRows.map(p => [p.gameId, p]));

  const [settings, currency, eurUsdRate] = await Promise.all([getPriceSettings(), getCurrencySettings(), getEurUsdRate()]);
  const engine = new PriceEngineService(settings, currency);

  type Item = {
    label: string; gameTitle: string; costUsd: number | null;
    oldPriceUzs: number; newPriceUzs: number;
    marginPercent: number | null;
    skipped?: string;
  };
  const items: Item[] = [];
  let updated = 0;
  // Games touched this run — re-sync each exactly once at the end rather
  // than once per variant, since a game can have several variants.
  const touchedGameIds = new Set<string>();

  for (const variant of variants) {
    const oldUzs   = variant.priceUzs;
    const strategy = (variant.pricingStrategy as PricingStrategy) ?? settings.defaultStrategy;

    if (strategy === 'MANUAL') {
      items.push({ label: variant.label, gameTitle: variant.game.title, costUsd: null, oldPriceUzs: oldUzs, newPriceUzs: oldUzs, marginPercent: null, skipped: 'MANUAL strategy' });
      continue;
    }

    let costUsd: number;
    try {
      const product = await fetchProductById(Number(variant.dropshipExternalId));
      const offer   = cheapestInStockOffer(product);
      const costEur = offer?.price ?? product.price;
      if (!costEur || costEur <= 0) throw new Error('supplier returned zero price');
      // Kinguin's price/offer.price are EUR — see lib/kinguin/types.ts header comment
      costUsd = costEur * eurUsdRate;
    } catch (err) {
      items.push({
        label: variant.label, gameTitle: variant.game.title, costUsd: null,
        oldPriceUzs: oldUzs, newPriceUzs: oldUzs, marginPercent: null,
        skipped: err instanceof Error ? err.message : 'fetch failed',
      });
      continue;
    }

    const gp = gamePricingMap.get(variant.gameId);
    const result = engine.calculateFinalGamePrice({
      gameId:                variant.gameId,
      supplierPriceUsd:      costUsd,
      steamPriceUsd:         gp ? Number(gp.steamPriceUsd)         || null : null,
      steamDiscountPriceUsd: gp ? Number(gp.steamDiscountPriceUsd) || null : null,
      pricingStrategy:       strategy,
      customPricingEnabled:  false,
      customMarkupType:      null,
      customMarkupValue:     null,
      customFinalPrice:      null,
    });

    const newUzs = Math.round(result.finalPriceUzs);
    items.push({
      label: variant.label, gameTitle: variant.game.title, costUsd,
      oldPriceUzs: oldUzs, newPriceUzs: newUzs,
      marginPercent: result.marginPercent,
    });

    if (!dryRun && newUzs !== oldUzs) {
      await prisma.game_variants.update({
        where: { id: variant.id },
        data:  { priceUzs: newUzs, priceUsd: result.finalPriceUsd },
      });
      touchedGameIds.add(variant.gameId);
      updated++;
    }
  }

  if (!dryRun && touchedGameIds.size > 0) {
    await prisma.$transaction(async tx => {
      for (const gameId of Array.from(touchedGameIds)) {
        await syncGameFromVariants(tx, gameId);
      }
    });
  }

  return NextResponse.json({ ok: true, dryRun, total: variants.length, updated, items });
}
