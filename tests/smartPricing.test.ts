import { describe, it, expect } from 'vitest';
import { roundUsd, roundUzs } from '@/lib/smartPricing/rounding';
import { PriceEngineService, DEFAULT_PRICE_SETTINGS, DEFAULT_CURRENCY_SETTINGS } from '@/lib/smartPricing/engine';

describe('roundUzs', () => {
  it('rounds to the nearest thousand', () => {
    expect(roundUzs(99123, 'NEAREST_1000')).toBe(99000);
    expect(roundUzs(187234, 'NEAREST_1000')).toBe(187000);
  });

  it('produces X9 000 prices', () => {
    expect(roundUzs(187234, 'NEAREST_9000')).toBe(189000);
    expect(roundUzs(99123, 'NEAREST_9000')).toBe(99000);
  });

  it('never goes to zero or negative for tiny/zero inputs', () => {
    expect(roundUzs(0, 'NEAREST_1000')).toBeGreaterThan(0);
    expect(roundUzs(0, 'NEAREST_9000')).toBeGreaterThan(0);
    expect(roundUzs(0, 'NEAREST_99000')).toBeGreaterThan(0);
    expect(roundUzs(-500, 'NEAREST_9000')).toBeGreaterThan(0);
  });
});

describe('roundUsd', () => {
  it('never goes below the floor for near-zero prices', () => {
    expect(roundUsd(0, 'POINT_99')).toBe(0.99);
    expect(roundUsd(0, 'POINT_49')).toBe(0.49);
  });
});

describe('PriceEngineService MANUAL override', () => {
  const engine = new PriceEngineService(DEFAULT_PRICE_SETTINGS, DEFAULT_CURRENCY_SETTINGS);

  it('rejects a zero or negative custom final price', () => {
    expect(() => engine.calculateFinalGamePrice({
      gameId: 'g1', supplierPriceUsd: 10, steamPriceUsd: null, steamDiscountPriceUsd: null,
      pricingStrategy: 'MANUAL', customPricingEnabled: true,
      customMarkupType: null, customMarkupValue: null, customFinalPrice: 0,
    })).toThrow();

    expect(() => engine.calculateFinalGamePrice({
      gameId: 'g1', supplierPriceUsd: 10, steamPriceUsd: null, steamDiscountPriceUsd: null,
      pricingStrategy: 'MANUAL', customPricingEnabled: true,
      customMarkupType: null, customMarkupValue: null, customFinalPrice: -5,
    })).toThrow();
  });

  it('accepts a valid positive custom final price', () => {
    const result = engine.calculateFinalGamePrice({
      gameId: 'g1', supplierPriceUsd: 10, steamPriceUsd: null, steamDiscountPriceUsd: null,
      pricingStrategy: 'MANUAL', customPricingEnabled: true,
      customMarkupType: null, customMarkupValue: null, customFinalPrice: 15,
    });
    expect(result.finalPriceUsd).toBe(15);
    expect(result.finalPriceUzs).toBeGreaterThan(0);
  });
});
