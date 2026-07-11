import { isG2aEnabled, G2A_CONFIG } from './config';
import { fetchAllProducts, purchaseProduct } from './client';
import { mapProductsToArcane } from './productMapper';
import { g2aCache, CK } from './cache';
import { products as mockProducts } from '@/lib/mockData';
import type { Product } from '@/lib/types';
import type { SyncResult, G2aPurchaseResult } from './types';

/* ─────────────────────────────────────────────────────────
   G2A service — ⚠ UNVERIFIED, see lib/g2a/config.ts header.
   Even when env vars are set (isG2aEnabled() true), every call
   into client.ts throws UnverifiedSupplierError — caught here and
   treated identically to "not configured": mock fallback, no
   silent failure, no partial/wrong data ever returned as real.
───────────────────────────────────────────────────────── */

export async function getProducts(): Promise<Product[]> {
  if (!isG2aEnabled()) return mockProducts;

  const cached = g2aCache.get<Product[]>(CK.productList());
  if (cached) return cached;

  try {
    const items = await fetchAllProducts();
    const products = mapProductsToArcane(items);
    g2aCache.set(CK.productList(), products, G2A_CONFIG.cacheTtl.productList);
    return products;
  } catch (err) {
    console.warn('[G2A] getProducts() falling back to mock:', err instanceof Error ? err.message : err);
    return mockProducts;
  }
}

export async function getProduct(idOrSlug: string): Promise<Product | null> {
  const list = g2aCache.get<Product[]>(CK.productList());
  if (list) {
    const found = list.find(p => p.id === idOrSlug);
    if (found) return found;
  }
  return mockProducts.find(p => p.id === idOrSlug) ?? null;
}

export async function syncProducts(): Promise<SyncResult> {
  const start = Date.now();

  if (!isG2aEnabled()) {
    return {
      ok: false,
      synced: 0,
      failed: 0,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      error: 'G2A not configured. Set G2A_CLIENT_ID and G2A_CLIENT_SECRET.',
    };
  }

  try {
    const items = await fetchAllProducts();
    const products = mapProductsToArcane(items);
    g2aCache.set(CK.productList(), products, G2A_CONFIG.cacheTtl.productList);

    const result: SyncResult = {
      ok: true,
      synced: products.length,
      failed: 0,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
    g2aCache.set(CK.syncResult(), result, 3600);
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
    g2aCache.set(CK.syncResult(), result, 60);
    return result;
  }
}

export function getLastSyncResult(): SyncResult | null {
  return g2aCache.get<SyncResult>(CK.syncResult());
}

export async function purchaseKey(externalId: string): Promise<G2aPurchaseResult> {
  if (!isG2aEnabled()) return { ok: false, error: 'G2A not configured' };
  return purchaseProduct(externalId);
}

export { isG2aEnabled };
