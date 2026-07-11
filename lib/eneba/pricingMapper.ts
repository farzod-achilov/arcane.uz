import { usdToUzs as sharedUsdToUzs, formatUzs } from '@/lib/shared/currency';

/* ─────────────────────────────────────────────────────────
   Pricing utilities — thin re-export of the shared currency
   helper so lib/eneba/productMapper.ts can import locally,
   matching the per-supplier module shape of lib/digiseller/.
───────────────────────────────────────────────────────── */

export function usdToUzs(usd: number): number {
  return sharedUsdToUzs(usd);
}

export { formatUzs };
