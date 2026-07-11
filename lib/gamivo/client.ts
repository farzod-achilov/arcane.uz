import { getGamivoToken } from './auth';
import type { GamivoProductItem, GamivoPurchaseResult } from './types';

/* ─────────────────────────────────────────────────────────
   Gamivo client — ⚠ UNVERIFIED, see lib/gamivo/config.ts header.
   Every function calls getGamivoToken() first, which always
   throws UnverifiedSupplierError — no request is ever sent.
───────────────────────────────────────────────────────── */

export async function fetchAllProducts(): Promise<GamivoProductItem[]> {
  await getGamivoToken(); // always throws — see file header
  return [];
}

export async function purchaseProduct(_gamivoId: string): Promise<GamivoPurchaseResult> {
  try {
    await getGamivoToken(); // always throws — see file header
    return { ok: false, error: 'unreachable' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown Gamivo error' };
  }
}

export function buildPurchaseUrl(gamivoId: string): string {
  return `https://www.gamivo.com/product/${gamivoId}`;
}
