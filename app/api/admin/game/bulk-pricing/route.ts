import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PriceEngineService } from '@/lib/smartPricing/engine';
import { getPriceSettings, getCurrencySettings, upsertGamePricing } from '@/lib/smartPricing/repository';
import type { PricingStrategy, SmartMarkupType } from '@/lib/smartPricing/types';

export const dynamic = 'force-dynamic';

type BulkBody = {
  strategy:   PricingStrategy;
  filters: {
    isActive?: boolean;
    source?:   string;
    gameIds?:  string[];
  };
  dryRun: boolean;
};

export async function POST(req: Request) {
  try {
    const body = await req.json() as BulkBody;
    const { strategy, filters = {}, dryRun } = body;

    const where: Record<string, unknown> = {};
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.source)                 where.source   = filters.source;
    if (filters.gameIds?.length)        where.id       = { in: filters.gameIds };

    const games = await prisma.games.findMany({
      where,
      select: { id: true, title: true, priceUsd: true, priceUzs: true },
      orderBy: { title: 'asc' },
    });

    const pricingRows = await prisma.game_pricing.findMany({
      where: { gameId: { in: games.map((g) => g.id) } },
    });
    const pricingMap = new Map(pricingRows.map((p) => [p.gameId, p]));

    const [settings, currency] = await Promise.all([getPriceSettings(), getCurrencySettings()]);
    const engine = new PriceEngineService(settings, currency);

    type PreviewItem = {
      id:          string;
      title:       string;
      oldPriceUsd: number;
      newPriceUsd: number;
      oldPriceUzs: number;
      newPriceUzs: number;
      changePct:   number;
      skipped:     boolean;
    };

    const preview: PreviewItem[] = [];
    let updated = 0;

    for (const game of games) {
      const p = pricingMap.get(game.id);

      const supplierPrice = p ? Number(p.supplierPriceUsd) : 0;
      if (!supplierPrice) {
        preview.push({
          id:          game.id,
          title:       game.title,
          oldPriceUsd: Number(game.priceUsd ?? 0),
          newPriceUsd: Number(game.priceUsd ?? 0),
          oldPriceUzs: Number(game.priceUzs ?? 0),
          newPriceUzs: Number(game.priceUzs ?? 0),
          changePct:   0,
          skipped:     true,
        });
        continue;
      }

      const result = engine.calculateFinalGamePrice({
        gameId:               game.id,
        supplierPriceUsd:     supplierPrice,
        steamPriceUsd:        p ? Number(p.steamPriceUsd)         : null,
        steamDiscountPriceUsd: p ? Number(p.steamDiscountPriceUsd) : null,
        pricingStrategy:      strategy,
        customPricingEnabled: false,
        customMarkupType:     null,
        customMarkupValue:    null,
        customFinalPrice:     null,
      });

      const newPriceUzs = Math.round(result.finalPriceUzs);
      const oldPriceUzs = Number(game.priceUzs ?? 0);
      const oldPriceUsd = Number(game.priceUsd ?? 0);
      const changePct   = oldPriceUsd > 0
        ? Math.round(((result.finalPriceUsd - oldPriceUsd) / oldPriceUsd) * 100)
        : 0;

      preview.push({
        id:          game.id,
        title:       game.title,
        oldPriceUsd,
        newPriceUsd: result.finalPriceUsd,
        oldPriceUzs,
        newPriceUzs,
        changePct,
        skipped:     false,
      });

      if (!dryRun) {
        await upsertGamePricing(
          game.id,
          {
            supplierPriceUsd: result.supplierPriceUsd,
            finalPriceUsd:    result.finalPriceUsd,
            finalPriceUzs:    newPriceUzs,
            youSaveAmount:    result.youSaveAmount,
            youSavePercent:   result.youSavePercent,
            marginPercent:    result.marginPercent,
            pricingStrategy:  strategy,
            steamPriceUsd:    p ? p.steamPriceUsd : null,
            steamDiscountPriceUsd: p ? p.steamDiscountPriceUsd : null,
          },
          {
            event:           'bulk_update',
            previousUsd:     oldPriceUsd,
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
      }
    }

    return NextResponse.json({
      success:  true,
      total:    games.length,
      affected: dryRun ? preview.filter((p) => !p.skipped).length : updated,
      skipped:  preview.filter((p) => p.skipped).length,
      preview:  preview.slice(0, 50),
      dryRun,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
