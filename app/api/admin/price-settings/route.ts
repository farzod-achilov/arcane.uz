import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuard';
import {
  getPriceSettings, upsertPriceSettings,
  getCurrencySettings, upsertCurrencySettings,
} from '@/lib/smartPricing/repository';
import { DEFAULT_PRICE_SETTINGS } from '@/lib/smartPricing/engine';
import type { PriceSettings as DbPriceSettings, UsdRoundType } from '@/lib/smartPricing/types';

export const dynamic = 'force-dynamic';

/**
 * Thin adapter over the real DB-backed settings in lib/smartPricing.
 *
 * This route (and the /admin/price-control UI built on it) used to hold its
 * own in-memory `PriceSettings` object with a comment "replace with DB in
 * production" — every save here silently vanished on the next deploy/restart
 * and had zero effect on the pricing engine that /admin/smart-pricing and
 * the games-pricing route actually use. It now reads/writes the same
 * price_settings + currency_settings rows, translated to this route's older
 * field names so the existing UI keeps working unchanged.
 */
export interface PriceSettings {
  globalMarkupPercent:        number;
  cheapGameThreshold:         number;
  fixedMarkupForCheap:        number;
  expensiveGamePercentMarkup: number;
  autoRoundEnabled:           boolean;
  roundType:                  '.99' | '.49' | 'integer';
  minimumProfitUsd:           number;
  autoUpdateEnabled:          boolean;
}

const ROUND_TYPE_TO_DB: Record<PriceSettings['roundType'], UsdRoundType> = {
  '.99':     'POINT_99',
  '.49':     'POINT_49',
  integer:   'INTEGER',
};
const ROUND_TYPE_FROM_DB: Record<UsdRoundType, PriceSettings['roundType']> = {
  POINT_99: '.99',
  POINT_49: '.49',
  INTEGER:  'integer',
};

async function toLegacyShape(): Promise<PriceSettings> {
  const [price, currency] = await Promise.all([getPriceSettings(), getCurrencySettings()]);
  return {
    globalMarkupPercent:        price.globalMarkupPercent,
    cheapGameThreshold:         price.cheapGamesThreshold,
    fixedMarkupForCheap:        price.cheapGamesFixedMarkup,
    expensiveGamePercentMarkup: price.expensiveGamesPercentMarkup,
    autoRoundEnabled:           price.autoRoundUsd,
    roundType:                  ROUND_TYPE_FROM_DB[price.usdRoundType],
    minimumProfitUsd:           price.minimumProfitUsd,
    autoUpdateEnabled:          currency.autoUpdateRate,
  };
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  return NextResponse.json({ success: true, data: await toLegacyShape() });
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await request.json() as Partial<PriceSettings>;

    if (body.globalMarkupPercent !== undefined && body.globalMarkupPercent < 0) {
      return NextResponse.json({ success: false, error: 'globalMarkupPercent must be >= 0' }, { status: 400 });
    }
    if (body.cheapGameThreshold !== undefined && body.cheapGameThreshold <= 0) {
      return NextResponse.json({ success: false, error: 'cheapGameThreshold must be > 0' }, { status: 400 });
    }
    if (body.fixedMarkupForCheap !== undefined && body.fixedMarkupForCheap < 0) {
      return NextResponse.json({ success: false, error: 'fixedMarkupForCheap must be >= 0' }, { status: 400 });
    }
    if (body.minimumProfitUsd !== undefined && body.minimumProfitUsd < 0) {
      return NextResponse.json({ success: false, error: 'minimumProfitUsd must be >= 0' }, { status: 400 });
    }

    const priceUpdate: Partial<DbPriceSettings> = {};
    if (body.globalMarkupPercent        !== undefined) priceUpdate.globalMarkupPercent         = body.globalMarkupPercent;
    if (body.cheapGameThreshold         !== undefined) priceUpdate.cheapGamesThreshold          = body.cheapGameThreshold;
    if (body.fixedMarkupForCheap        !== undefined) priceUpdate.cheapGamesFixedMarkup        = body.fixedMarkupForCheap;
    if (body.expensiveGamePercentMarkup !== undefined) priceUpdate.expensiveGamesPercentMarkup  = body.expensiveGamePercentMarkup;
    if (body.autoRoundEnabled           !== undefined) priceUpdate.autoRoundUsd                 = body.autoRoundEnabled;
    if (body.roundType                  !== undefined) priceUpdate.usdRoundType                 = ROUND_TYPE_TO_DB[body.roundType];
    if (body.minimumProfitUsd           !== undefined) priceUpdate.minimumProfitUsd             = body.minimumProfitUsd;

    if (Object.keys(priceUpdate).length > 0) await upsertPriceSettings(priceUpdate);
    if (body.autoUpdateEnabled !== undefined) await upsertCurrencySettings({ autoUpdateRate: body.autoUpdateEnabled });

    return NextResponse.json({ success: true, data: await toLegacyShape() });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}

export async function PUT() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id: _id, ...defaults } = DEFAULT_PRICE_SETTINGS;
  await upsertPriceSettings(defaults);

  return NextResponse.json({ success: true, data: await toLegacyShape() });
}
