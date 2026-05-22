import { Rarity } from '@prisma/client';
import type { NormalizedGame, usdToUzs } from './games.normalizer';
import { usdToUzs as convert } from './games.normalizer';

// ── Rarity thresholds ─────────────────────────────────────────────────────────
//
//   COMMON     — cheap or low-rated games, great for high-volume drops
//   RARE       — mid-tier: decent price or solid rating
//   EPIC       — premium: high price + good rating
//   LEGENDARY  — AAA: expensive AND highly rated
//
const THRESHOLDS = {
  legendary: { minPriceUsd: 50, minRating: 85 },
  epic:      { minPriceUsd: 25, minRating: 75 },
  rare:      { minPriceUsd: 10, minRating: 60 },
} as const;

export function assignRarity(game: NormalizedGame): Rarity {
  const { priceUsd, rating } = game;
  const p = priceUsd ?? 0;
  const r = rating ?? 0;

  if (p >= THRESHOLDS.legendary.minPriceUsd && r >= THRESHOLDS.legendary.minRating)
    return Rarity.LEGENDARY;
  if (p >= THRESHOLDS.epic.minPriceUsd && r >= THRESHOLDS.epic.minRating)
    return Rarity.EPIC;
  if (p >= THRESHOLDS.rare.minPriceUsd || r >= THRESHOLDS.rare.minRating)
    return Rarity.RARE;
  return Rarity.COMMON;
}

// ── Sell value in ARC coins ───────────────────────────────────────────────────
//
//   Base = game price converted to UZS, then divided by a coin rate (1 coin ≈ 100 UZS)
//   Multiplied by rating and rarity bonuses.
//
const COIN_RATE = 100; // 1 ARC coin = 100 UZS base

export function calculateSellValue(game: NormalizedGame): number {
  const priceUzs = game.priceUsd != null ? convert(game.priceUsd) : 0;
  const baseCoins = Math.max(Math.round(priceUzs / COIN_RATE), 10);

  const rarity = assignRarity(game);
  const rarityMultiplier: Record<Rarity, number> = {
    COMMON: 1,
    RARE: 1.5,
    EPIC: 2.5,
    LEGENDARY: 5,
  };

  const ratingBonus = game.rating ? 1 + (game.rating - 60) / 200 : 1;
  const value = Math.round(baseCoins * rarityMultiplier[rarity] * Math.max(ratingBonus, 1));

  // Enforce sane minimums per rarity
  const minimums: Record<Rarity, number> = {
    COMMON: 50,
    RARE: 150,
    EPIC: 400,
    LEGENDARY: 1000,
  };

  return Math.max(value, minimums[rarity]);
}

// ── Drop chance per rarity ────────────────────────────────────────────────────

export const DEFAULT_DROP_CHANCES: Record<Rarity, number> = {
  COMMON: 70,
  RARE: 20,
  EPIC: 9,
  LEGENDARY: 1,
};

export function getDropChance(rarity: Rarity): number {
  return DEFAULT_DROP_CHANCES[rarity];
}

// ── Filter helpers ────────────────────────────────────────────────────────────

export function filterForRarity(games: NormalizedGame[], rarity: Rarity): NormalizedGame[] {
  return games.filter((g) => assignRarity(g) === rarity);
}

export function filterActive(games: NormalizedGame[]): NormalizedGame[] {
  return games.filter((g) => g.title && g.cover);
}

export function sortByRating(games: NormalizedGame[]): NormalizedGame[] {
  return [...games].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
}

export function sortByPrice(games: NormalizedGame[]): NormalizedGame[] {
  return [...games].sort((a, b) => (b.priceUsd ?? 0) - (a.priceUsd ?? 0));
}
