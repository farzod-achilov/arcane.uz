import { UsdRoundType, UzsRoundType } from './types';

/**
 * USD smart rounding
 *
 * POINT_99: Math.round(price) - 0.01
 *   17.12 → 16.99 | 18.44 → 17.99 | 24.10 → 23.99
 *
 * POINT_49: Math.round(price) - 0.51
 *   17.12 → 16.49 | 18.44 → 17.49
 *
 * INTEGER: Math.round(price)
 */
export function roundUsd(price: number, type: UsdRoundType): number {
  switch (type) {
    case 'POINT_99': return Math.max(0.99, Math.round(price) - 0.01);
    case 'POINT_49': return Math.max(0.49, Math.round(price) - 0.51);
    case 'INTEGER':  return Math.round(price);
  }
}

/**
 * UZS smart rounding
 *
 * NEAREST_1000: standard nearest-1000
 *   99 123 → 99 000 | 187 234 → 187 000
 *
 * NEAREST_9000: Math.ceil(price / 10 000) × 10 000 − 1 000
 *   187 234 → 189 000 | 99 123 → 99 000 | 212 455 → 219 000
 *
 * NEAREST_99000: Math.ceil(price / 100 000) × 100 000 − 1 000
 *   187 234 → 199 000 | 212 455 → 299 000
 */
export function roundUzs(price: number, type: UzsRoundType): number {
  switch (type) {
    case 'NEAREST_1000':
      return Math.round(price / 1000) * 1000;
    case 'NEAREST_9000':
      return Math.ceil(price / 10_000) * 10_000 - 1_000;
    case 'NEAREST_99000':
      return Math.ceil(price / 100_000) * 100_000 - 1_000;
  }
}

export function usdRoundLabel(type: UsdRoundType): string {
  return { POINT_99: '.99 prices', POINT_49: '.49 prices', INTEGER: 'Integer' }[type];
}

export function uzsRoundLabel(type: UzsRoundType): string {
  return {
    NEAREST_1000:  'Nearest 1 000',
    NEAREST_9000:  'Nearest X9 000',
    NEAREST_99000: 'Nearest X99 000',
  }[type];
}
