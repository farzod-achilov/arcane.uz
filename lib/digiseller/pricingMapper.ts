import { DIGI_CONFIG } from './config';

/* ─────────────────────────────────────────────────────────
   Pricing utilities
   Converts Digiseller USD prices → UZS for the storefront
───────────────────────────────────────────────────────── */

/** Convert USD → UZS, rounded to nearest 1000 сум */
export function usdToUzs(usd: number): number {
  const raw = usd * DIGI_CONFIG.usdToUzs;
  return Math.round(raw / 1000) * 1000;
}

/**
 * Detect if a product appears discounted by comparing USD price
 * to a "market" price. Digiseller doesn't expose original price
 * directly, so we estimate discount from category floor prices.
 */
export function estimateDiscount(
  currentUsd: number,
  baseUsd?: number,
): { discount: number; originalPriceUzs?: number } {
  if (!baseUsd || currentUsd >= baseUsd) return { discount: 0 };
  const pct = Math.round((1 - currentUsd / baseUsd) * 100);
  return {
    discount: pct,
    originalPriceUzs: usdToUzs(baseUsd),
  };
}

/** Format UZS with thousands separator */
export function formatUzs(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' сум';
}
