import { getG2aToken } from './auth';
import type { G2aProductItem, G2aPurchaseResult } from './types';

/* ─────────────────────────────────────────────────────────
   G2A client — ⚠ UNVERIFIED, see lib/g2a/config.ts header.
   Every function here calls getG2aToken() first, which always
   throws UnverifiedSupplierError — so no request is ever sent.
   Kept in this shape so the rest of the module (productMapper,
   g2aService, API routes) is structurally identical to the
   verified suppliers and just needs auth.ts + these bodies
   filled in once G2A's real API is confirmed.
───────────────────────────────────────────────────────── */

export async function fetchAllProducts(): Promise<G2aProductItem[]> {
  await getG2aToken(); // always throws — see file header
  return [];
}

export async function purchaseProduct(_g2aId: string): Promise<G2aPurchaseResult> {
  try {
    await getG2aToken(); // always throws — see file header
    return { ok: false, error: 'unreachable' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown G2A error' };
  }
}

export function buildPurchaseUrl(g2aId: string): string {
  return `https://www.g2a.com/product/${g2aId}`;
}
