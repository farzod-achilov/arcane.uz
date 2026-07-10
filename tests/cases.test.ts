import { describe, it, expect } from 'vitest';
import { CASES, CASES_LIST, pickWeightedReward } from '@/lib/casesData';

describe('case reward tables', () => {
  it.each(CASES_LIST.map(c => [c.id, c] as const))('%s probabilities sum to 100', (_id, c) => {
    const total = c.rewards.reduce((s, r) => s + r.probability, 0);
    expect(total).toBe(100);
  });

  it.each(CASES_LIST.map(c => [c.id, c] as const))('%s reward ids are unique', (_id, c) => {
    const ids = c.rewards.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('pickWeightedReward', () => {
  it('always returns a reward from the table', () => {
    const rewards = CASES.silver.rewards;
    for (let i = 0; i < 500; i++) {
      expect(rewards).toContain(pickWeightedReward(rewards));
    }
  });

  it('respects weights within statistical tolerance', () => {
    const rewards = CASES.silver.rewards;
    const n = 20_000;
    const counts = new Map<string, number>();
    for (let i = 0; i < n; i++) {
      const r = pickWeightedReward(rewards);
      counts.set(r.id, (counts.get(r.id) ?? 0) + 1);
    }
    // The most common reward (28%) must dominate the rarest (1%) decisively
    const common = counts.get('s-coins-100') ?? 0;
    const rare   = counts.get('s-arcane')    ?? 0;
    expect(common / n).toBeGreaterThan(0.24);
    expect(common / n).toBeLessThan(0.32);
    expect(rare   / n).toBeLessThan(0.03);
  });
});
