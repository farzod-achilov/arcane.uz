import { prisma }                      from '@/lib/prisma';
import { PriceSettings, CurrencySettings } from './types';
import { DEFAULT_PRICE_SETTINGS, DEFAULT_CURRENCY_SETTINGS } from './engine';
import { getUsdUzsRate } from '@/lib/shared/fxRate';

// How often an autoUpdateRate=true read is allowed to persist a fresh
// live rate to the DB — matches fxRate.ts's own in-memory cache TTL, so
// this doesn't write on every single price calculation.
const AUTO_RATE_REFRESH_MS = 60 * 60 * 1000;

// ─── Price Settings ───────────────────────────────────────────────────────────

export async function getPriceSettings(): Promise<PriceSettings> {
  const row = await prisma.price_settings.findFirst();
  if (!row) return DEFAULT_PRICE_SETTINGS;

  return {
    id:                          row.id,
    globalMarkupPercent:         Number(row.globalMarkupPercent),
    cheapGamesThreshold:         Number(row.cheapGamesThreshold),
    cheapGamesFixedMarkup:       Number(row.cheapGamesFixedMarkup),
    expensiveGamesPercentMarkup: Number(row.expensiveGamesPercentMarkup),
    autoRoundUsd:                row.autoRoundUsd,
    usdRoundType:                row.usdRoundType as PriceSettings['usdRoundType'],
    autoRoundUzs:                row.autoRoundUzs,
    uzsRoundType:                row.uzsRoundType as PriceSettings['uzsRoundType'],
    minimumProfitUsd:            Number(row.minimumProfitUsd),
    aggressiveMarkupPercent:     Number(row.aggressiveMarkupPercent),
    competitiveMarkupPercent:    Number(row.competitiveMarkupPercent),
    highProfitMarkupPercent:     Number(row.highProfitMarkupPercent),
    defaultStrategy:             row.defaultStrategy as PriceSettings['defaultStrategy'],
  };
}

export async function upsertPriceSettings(data: Partial<PriceSettings>): Promise<PriceSettings> {
  const existing = await prisma.price_settings.findFirst();

  const row = existing
    ? await prisma.price_settings.update({ where: { id: existing.id }, data })
    : await prisma.price_settings.create({
        data: { ...DEFAULT_PRICE_SETTINGS, id: undefined, ...data },
      });

  return getPriceSettings();
}

// ─── Currency Settings ────────────────────────────────────────────────────────

export async function getCurrencySettings(): Promise<CurrencySettings> {
  const row = await prisma.currency_settings.findFirst();
  if (!row) return DEFAULT_CURRENCY_SETTINGS;

  if (!row.autoUpdateRate) {
    return {
      id:             row.id,
      exchangeRate:   Number(row.exchangeRate),
      autoUpdateRate: row.autoUpdateRate,
      lastUpdated:    row.lastUpdated.toISOString(),
    };
  }

  // Auto-update is on — always price off the live rate, but only write it
  // (+ log an exchange_rates snapshot) at most once per refresh window so
  // a busy catalog page doesn't hammer the DB on every read.
  const liveRate = await getUsdUzsRate();
  const isStale  = Date.now() - row.lastUpdated.getTime() > AUTO_RATE_REFRESH_MS;

  if (isStale && Math.round(liveRate) !== Number(row.exchangeRate)) {
    await prisma.$transaction([
      prisma.currency_settings.update({
        where: { id: row.id },
        data:  { exchangeRate: liveRate, lastUpdated: new Date() },
      }),
      prisma.exchange_rates.create({
        data: { currency: 'UZS', rate: liveRate, source: 'live' },
      }),
    ]);
  }

  return {
    id:             row.id,
    exchangeRate:   liveRate,
    autoUpdateRate: row.autoUpdateRate,
    lastUpdated:    isStale ? new Date().toISOString() : row.lastUpdated.toISOString(),
  };
}

export async function upsertCurrencySettings(data: Partial<CurrencySettings>): Promise<CurrencySettings> {
  const existing = await prisma.currency_settings.findFirst();

  if (existing) {
    await prisma.currency_settings.update({
      where: { id: existing.id },
      data:  {
        ...(data.exchangeRate   != null && { exchangeRate: data.exchangeRate }),
        ...(data.autoUpdateRate != null && { autoUpdateRate: data.autoUpdateRate }),
        lastUpdated: new Date(),
      },
    });
  } else {
    await prisma.currency_settings.create({
      data: {
        exchangeRate:   data.exchangeRate   ?? 12700,
        autoUpdateRate: data.autoUpdateRate ?? false,
        lastUpdated:    new Date(),
      },
    });
  }

  // Record snapshot in exchange_rates history
  if (data.exchangeRate != null) {
    await prisma.exchange_rates.create({
      data: { currency: 'UZS', rate: data.exchangeRate, source: 'manual' },
    });
  }

  return getCurrencySettings();
}

// ─── Game Pricing ─────────────────────────────────────────────────────────────

export async function getGamePricing(gameId: string) {
  return prisma.game_pricing.findUnique({
    where:   { gameId },
    include: { pricing_logs: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });
}

export async function upsertGamePricing(
  gameId: string,
  data:   Record<string, unknown>,
  log?:   { event: string; previousUsd?: number | null; newUsd?: number | null; previousUzs?: number | null; newUzs?: number | null; appliedStrategy?: string; appliedRules?: string[] },
) {
  const existing = await prisma.game_pricing.findUnique({ where: { gameId } });

  const record = existing
    ? await prisma.game_pricing.update({ where: { gameId }, data })
    : await prisma.game_pricing.create({ data: { gameId, ...data } });

  if (log) {
    await prisma.pricing_logs.create({
      data: {
        gamePricingId: record.id,
        event:         log.event,
        previousUsd:   log.previousUsd   ?? null,
        newUsd:        log.newUsd        ?? null,
        previousUzs:   log.previousUzs   ?? null,
        newUzs:        log.newUzs        ?? null,
        appliedStrategy: log.appliedStrategy ?? null,
        appliedRules:  log.appliedRules ? { rules: log.appliedRules } : undefined,
      },
    });
  }

  return record;
}
