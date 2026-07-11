import { isKinguinEnabled, KINGUIN_CONFIG } from './config';
import { fetchAllProducts, purchaseProduct } from './client';
import { mapProductsToArcane } from './productMapper';
import { kinguinCache, CK } from './cache';
import { products as mockProducts } from '@/lib/mockData';
import type { Product } from '@/lib/types';
import type { SyncResult, KinguinPurchaseResult } from './types';

/* ─────────────────────────────────────────────────────────
   Kinguin service — business logic
   Real mode:  fetches from Kinguin's merchant API (cached)
   Mock mode:  returns lib/mockData products unchanged
───────────────────────────────────────────────────────── */

export async function getProducts(): Promise<Product[]> {
  if (!isKinguinEnabled()) return mockProducts;

  const cached = kinguinCache.get<Product[]>(CK.productList());
  if (cached) return cached;

  const items = await fetchAllProducts();
  const products = mapProductsToArcane(items);

  kinguinCache.set(CK.productList(), products, KINGUIN_CONFIG.cacheTtl.productList);
  return products;
}

export async function getProduct(idOrSlug: string): Promise<Product | null> {
  if (!isKinguinEnabled()) {
    return mockProducts.find(p => p.id === idOrSlug) ?? null;
  }

  const list = kinguinCache.get<Product[]>(CK.productList());
  if (list) {
    const found = list.find(p => p.id === idOrSlug);
    if (found) return found;
  }

  return mockProducts.find(p => p.id === idOrSlug) ?? null;
}

export async function syncProducts(): Promise<SyncResult> {
  const start = Date.now();

  if (!isKinguinEnabled()) {
    return {
      ok: false,
      synced: 0,
      failed: 0,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      error: 'Kinguin not configured. Set KINGUIN_MERCHANT_API_KEY.',
    };
  }

  kinguinCache.invalidatePrefix('kinguin:product');

  try {
    const items = await fetchAllProducts();
    const products = mapProductsToArcane(items);
    kinguinCache.set(CK.productList(), products, KINGUIN_CONFIG.cacheTtl.productList);

    const result: SyncResult = {
      ok: true,
      synced: products.length,
      failed: 0,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
    kinguinCache.set(CK.syncResult(), result, 3600);
    return result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[Kinguin] syncProducts error:', error);
    const result: SyncResult = {
      ok: false,
      synced: 0,
      failed: 1,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      error,
    };
    kinguinCache.set(CK.syncResult(), result, 60);
    return result;
  }
}

export function getLastSyncResult(): SyncResult | null {
  return kinguinCache.get<SyncResult>(CK.syncResult());
}

/**
 * Dropship purchase — called by lib/delivery/dropshipDeliver.ts at order
 * time. See lib/kinguin/client.ts's purchaseProduct() header comment.
 */
export async function purchaseKey(externalId: string): Promise<KinguinPurchaseResult> {
  if (!isKinguinEnabled()) {
    return { ok: false, error: 'Kinguin not configured' };
  }
  const kinguinId = Number(externalId);
  if (Number.isNaN(kinguinId)) {
    return { ok: false, error: `Invalid Kinguin product id: ${externalId}` };
  }

  // Kinguin's order API requires a specific offerId + price (it's a
  // marketplace — see lib/kinguin/types.ts header comment), not just a
  // kinguinId. Use the cheapest in-stock offer recorded at last sync.
  // If the cache is cold (sync never ran/expired), fail clearly instead
  // of ordering with a fabricated price or no offer reference.
  const productId = `kinguin-${kinguinId}`;
  const cachedProduct = kinguinCache.get<Product[]>(CK.productList())?.find(p => p.id === productId) as
    | (Product & { kinguinOfferId?: string; kinguinOfferPriceUsd?: number })
    | undefined;
  if (!cachedProduct?.kinguinOfferId || cachedProduct.kinguinOfferPriceUsd == null) {
    return { ok: false, error: `No cached offer for Kinguin product ${kinguinId} — run a catalog sync first` };
  }

  return purchaseProduct(kinguinId, cachedProduct.kinguinOfferPriceUsd, cachedProduct.kinguinOfferId);
}

export { isKinguinEnabled };
