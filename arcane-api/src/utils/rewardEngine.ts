import crypto from 'crypto';
import { Rarity } from '@prisma/client';

// ── Weighted random ───────────────────────────────────────────────────────────
//
//   Uses crypto.randomBytes to ensure server-side entropy.
//   Client NEVER participates in reward generation — this runs only on backend.

interface WeightedItem<T> {
  item: T;
  weight: number;
}

export function weightedRandom<T>(items: WeightedItem<T>[]): T {
  if (items.length === 0) throw new Error('Reward pool is empty');

  const totalWeight = items.reduce((sum, { weight }) => sum + weight, 0);
  if (totalWeight <= 0) throw new Error('All reward weights are zero');

  // Cryptographically secure random float [0, 1)
  const randomBytes = crypto.randomBytes(4);
  const randomUint = randomBytes.readUInt32BE(0);
  const randomFloat = randomUint / 0x100000000;

  let threshold = randomFloat * totalWeight;

  for (const { item, weight } of items) {
    threshold -= weight;
    if (threshold <= 0) return item;
  }

  // Fallback — should never reach here but satisfies type checker
  return items[items.length - 1].item;
}

// ── Rarity roll ───────────────────────────────────────────────────────────────

const RARITY_WEIGHTS: Record<Rarity, number> = {
  COMMON: 70,
  RARE: 20,
  EPIC: 9,
  LEGENDARY: 1,
};

export function rollRarity(
  customWeights?: Partial<Record<Rarity, number>>
): Rarity {
  const weights = { ...RARITY_WEIGHTS, ...customWeights };
  const items = Object.entries(weights).map(([rarity, weight]) => ({
    item: rarity as Rarity,
    weight,
  }));
  return weightedRandom(items);
}

// ── Drop reward selection ─────────────────────────────────────────────────────

export interface RewardCandidate {
  id: string;
  rarity: Rarity;
  dropChance: number;
}

export function selectReward(rewards: RewardCandidate[]): RewardCandidate {
  if (rewards.length === 0) throw new Error('No active rewards in drop pool');

  const weighted = rewards.map((r) => ({ item: r, weight: r.dropChance }));
  return weightedRandom(weighted);
}

// ── Jackpot contribution ──────────────────────────────────────────────────────

export function calcJackpotContribution(price: number, percent: number): number {
  return Math.max(Math.floor((price * percent) / 100), 1);
}

// ── XP gain per drop ─────────────────────────────────────────────────────────

const RARITY_XP: Record<Rarity, number> = {
  COMMON: 10,
  RARE: 25,
  EPIC: 75,
  LEGENDARY: 200,
};

export function calcXpGain(rarity: Rarity): number {
  return RARITY_XP[rarity];
}

// ── Level-up threshold ────────────────────────────────────────────────────────

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function calcLevelFromXp(totalXp: number): number {
  let level = 1;
  while (totalXp >= xpForLevel(level + 1)) level++;
  return level;
}
