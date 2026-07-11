/* ─────────────────────────────────────────────────────────
   G2A — ⚠ UNVERIFIED. Placeholder shapes only, modeled loosely
   on G2A's publicly described "Products Import API". Do not
   treat as a confirmed contract — see lib/g2a/config.ts.
───────────────────────────────────────────────────────── */

export interface G2aProductItem {
  id: string;
  name: string;
  price: number; // USD, major units
  qty: number;
  platform?: string;
  available?: boolean;
  coverImage?: string;
}

export interface G2aNormalizedProduct {
  g2aId: string;
  title: string;
  priceUsd: number;
  priceUzs: number;
  inStock: boolean;
  imageUrl: string;
  platform: string;
  purchaseUrl: string;
  lastSynced: string;
}

export interface SyncResult {
  ok: boolean;
  synced: number;
  failed: number;
  durationMs: number;
  timestamp: string;
  error?: string;
}

export interface G2aPurchaseResult {
  ok: boolean;
  key?: string;
  error?: string;
}
