/* ─────────────────────────────────────────────────────────
   Gamivo — ⚠ UNVERIFIED. Placeholder shapes only. Do not treat
   as a confirmed contract — see lib/gamivo/config.ts.
───────────────────────────────────────────────────────── */

export interface GamivoProductItem {
  id: string;
  name: string;
  price: number; // USD, major units
  qty: number;
  platform?: string;
  available?: boolean;
  coverImage?: string;
}

export interface GamivoNormalizedProduct {
  gamivoId: string;
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

export interface GamivoPurchaseResult {
  ok: boolean;
  key?: string;
  error?: string;
}
