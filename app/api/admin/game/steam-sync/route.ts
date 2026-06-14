import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PriceEngineService } from '@/lib/smartPricing/engine';
import { getPriceSettings, getCurrencySettings, upsertGamePricing } from '@/lib/smartPricing/repository';
import type { PricingStrategy } from '@/lib/smartPricing/types';
import { requireAdmin } from '@/lib/apiGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function fetchSteamPrice(appId: string): Promise<{ priceUsd: number | null; discountUsd: number | null } | null> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=uz&l=english`,
      { cache: 'no-store', signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return null;
    const raw   = await res.json();
    const entry = raw[appId];
    if (!entry?.success || !entry.data) return null;
    const d = entry.data;
    if (d.is_free) return { priceUsd: 0, discountUsd: null };
    if (!d.price_overview) return { priceUsd: null, discountUsd: null };
    const final    = d.price_overview.final    / 100;
    const initial  = d.price_overview.initial  / 100;
    const discount = d.price_overview.discount_percent > 0 ? initial : null;
    return { priceUsd: final, discountUsd: discount };
  } catch {
    return null;
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const games = await prisma.games.findMany({
      where:  { source: 'steam', externalId: { not: null } },
      select: { id: true, title: true, externalId: true, priceUsd: true, priceUzs: true },
      orderBy: { title: 'asc' },
    });

    if (games.length === 0) {
      return NextResponse.json({ success: true, total: 0, updated: 0, failed: 0, skipped: 0 });
    }

    const pricingRows = await prisma.game_pricing.findMany({
      where: { gameId: { in: games.map((g) => g.id) } },
    });
    const pricingMap = new Map(pricingRows.map((p) => [p.gameId, p]));

    const [settings, currency] = await Promise.all([getPriceSettings(), getCurrencySettings()]);
    const engine = new PriceEngineService(settings, currency);

    let updated = 0;
    let failed  = 0;
    let skipped = 0;

    const details: Array<{ id: string; title: string; status: 'updated' | 'failed' | 'skipped'; oldUzs: number; newUzs: number }> = [];

    for (const game of games) {
      const steamData = await fetchSteamPrice(game.externalId!);
      await delay(250);

      if (!steamData || steamData.priceUsd === null) {
        failed++;
        details.push({ id: game.id, title: game.title, status: 'failed', oldUzs: Number(game.priceUzs ?? 0), newUzs: Number(game.priceUzs ?? 0) });
        continue;
      }

      const existing  = pricingMap.get(game.id);
      const supplierPrice = existing ? Number(existing.supplierPriceUsd) : 0;

      if (!supplierPrice) {
        skipped++;
        details.push({ id: game.id, title: game.title, status: 'skipped', oldUzs: Number(game.priceUzs ?? 0), newUzs: Number(game.priceUzs ?? 0) });
        continue;
      }

      const strategy = (existing?.pricingStrategy as PricingStrategy) ?? 'GLOBAL';

      const result = engine.calculateFinalGamePrice({
        gameId:               game.id,
        supplierPriceUsd:     supplierPrice,
        steamPriceUsd:        steamData.priceUsd,
        steamDiscountPriceUsd: steamData.discountUsd,
        pricingStrategy:      strategy,
        customPricingEnabled: existing?.customPricingEnabled ?? false,
        customMarkupType:     null,
        customMarkupValue:    null,
        customFinalPrice:     null,
      });

      const newPriceUzs = Math.round(result.finalPriceUzs);
      const oldPriceUzs = Number(game.priceUzs ?? 0);

      await upsertGamePricing(
        game.id,
        {
          steamPriceUsd:         steamData.priceUsd,
          steamDiscountPriceUsd: steamData.discountUsd,
          finalPriceUsd:         result.finalPriceUsd,
          finalPriceUzs:         newPriceUzs,
          youSaveAmount:         result.youSaveAmount,
          youSavePercent:        result.youSavePercent,
          marginPercent:         result.marginPercent,
          supplierPriceUsd:      supplierPrice,
          pricingStrategy:       strategy,
        },
        {
          event:           'steam_sync',
          previousUsd:     Number(game.priceUsd ?? 0),
          newUsd:          result.finalPriceUsd,
          previousUzs:     oldPriceUzs,
          newUzs:          newPriceUzs,
          appliedStrategy: strategy,
          appliedRules:    result.appliedRules,
        },
      );

      await prisma.games.update({
        where: { id: game.id },
        data:  { priceUsd: result.finalPriceUsd, priceUzs: newPriceUzs },
      });

      updated++;
      details.push({ id: game.id, title: game.title, status: 'updated', oldUzs: oldPriceUzs, newUzs: newPriceUzs });
    }

    return NextResponse.json({
      success: true,
      total:   games.length,
      updated,
      failed,
      skipped,
      details: details.slice(0, 100),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
