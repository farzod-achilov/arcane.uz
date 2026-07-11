/* ─────────────────────────────────────────────────────────
   Shared currency conversion — used by every supplier's
   pricingMapper.ts. Reads the same USD_TO_UZS env var that
   lib/digiseller/config.ts already reads, so all suppliers
   move together when the rate is updated.
───────────────────────────────────────────────────────── */

const DEFAULT_USD_TO_UZS = 12700;

export function getUsdToUzsRate(): number {
  return Number(process.env.USD_TO_UZS ?? DEFAULT_USD_TO_UZS);
}

/** Convert USD → UZS, rounded to nearest 1000 сум */
export function usdToUzs(usd: number, rate: number = getUsdToUzsRate()): number {
  const raw = usd * rate;
  return Math.round(raw / 1000) * 1000;
}

/** Format UZS with thousands separator */
export function formatUzs(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' сум';
}
