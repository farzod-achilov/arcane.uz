import { isGamivoEnabled, GAMIVO_CONFIG } from './config';
import { fetchAllProducts, purchaseProduct } from './client';
import { mapProductsToArcane } from './productMapper';
import { gamivoCache, CK } from './cache';
import { products as mockProducts } from '@/lib/mockData';
import type { Product } from '@/lib/types';
import type { SyncResult, GamivoPurchaseResult } from './types';

/* ─────────────────────────────────────────────────────────
   Gamivo service — ⚠ UNVERIFIED, see lib/gamivo/config.ts header.
   Even when env vars are set, every call into client.ts throws
   UnverifiedSupplierError — caught here and treated identically
   to "not configured": mock fallback, no silent failure.
───────────────────────────────────────────────────────── */

export async function getProducts(): Promise<Product[]> {
  if (!isGamivoEnabled()) return mockProducts;

  const cached = gamivoCache.get<Product[]>(CK.productList());
  if (cached) return cached;

  try {
    const items = await fetchAllProducts();
    const products = mapProductsToArcane(items);
    gamivoCache.set(CK.productList(), products, GAMIVO_CONFIG.cacheTtl.productList);
    return products;
  } catch (err) {
    console.warn('[Gamivo] getProducts() falling back to mock:', err instanceof Error ? err.message : err);
    return mockProducts;
  }
}

export async function getProduct(idOrSlug: string): Promise<Product | null> {
  const list = gamivoCache.get<Product[]>(CK.productList());
  if (list) {
    const found = list.find(p => p.id === idOrSlug);
    if (found) return found;
  }
  return mockProducts.find(p => p.id === idOrSlug) ?? null;
}

export async function syncProducts(): Promise<SyncResult> {
  const start = Date.now();

  if (!isGamivoEnabled()) {
    return {
      ok: false,
      synced: 0,
      failed: 0,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      error: 'Gamivo not configured. Set GAMIVO_API_KEY and GAMIVO_CLIENT_SECRET.',
    };
  }

  try {
    const items = await fetchAllProducts();
    const products = mapProductsToArcane(items);
    gamivoCache.set(CK.productList(), products, GAMIVO_CONFIG.cacheTtl.productList);

    const result: SyncResult = {
      ok: true,
      synced: products.length,
      failed: 0,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
    gamivoCache.set(CK.syncResult(), result, 3600);
    return result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const result: SyncResult = {
      ok: false,
      synced: 0,
      failed: 1,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      error,
    };
    gamivoCache.set(CK.syncResult(), result, 60);
    return result;
  }
}

export function getLastSyncResult(): SyncResult | null {
  return gamivoCache.get<SyncResult>(CK.syncResult());
}

export async function purchaseKey(externalId: string): Promise<GamivoPurchaseResult> {
  if (!isGamivoEnabled()) return { ok: false, error: 'Gamivo not configured' };
  return purchaseProduct(externalId);
}

export { isGamivoEnabled };
