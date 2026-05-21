import { isDigisellerEnabled, DIGI_CONFIG } from './config';
import { fetchAllOffers, fetchProductData, buildPurchaseUrl } from './client';
import { mapOffersToProducts, normalizeProductData, toArcaneProduct } from './productMapper';
import { digiCache, CK } from './cache';
import { products as mockProducts } from '@/lib/mockData';
import type { Product } from '@/lib/types';
import type { SyncResult } from './types';

/* ─────────────────────────────────────────────────────────
   Digiseller service — business logic
   Real mode:  fetches from Digiseller API (with cache)
   Mock mode:  returns lib/mockData products unchanged
───────────────────────────────────────────────────────── */

/**
 * Get the full product catalog.
 * Returns cached result when available.
 */
export async function getProducts(): Promise<Product[]> {
  if (!isDigisellerEnabled()) return mockProducts;

  const cached = digiCache.get<Product[]>(CK.productList());
  if (cached) return cached;

  const items = await fetchAllOffers();
  const products = mapOffersToProducts(items);

  digiCache.set(CK.productList(), products, DIGI_CONFIG.cacheTtl.productList);
  return products;
}

/**
 * Get a single product by Digiseller product_id or ARCANE slug.
 * Digiseller IDs are numeric strings; ARCANE slugs are like "cyberpunk-2077".
 */
export async function getProduct(idOrSlug: string): Promise<Product | null> {
  if (!isDigisellerEnabled()) {
    return mockProducts.find(p => p.id === idOrSlug) ?? null;
  }

  const numericId = Number(idOrSlug);
  const isNumeric = !Number.isNaN(numericId) && numericId > 0;

  if (isNumeric) {
    const cached = digiCache.get<Product>(CK.product(numericId));
    if (cached) return cached;

    try {
      const data = await fetchProductData(numericId);
      const norm = normalizeProductData(data);
      const product = toArcaneProduct(norm);
      digiCache.set(CK.product(numericId), product, DIGI_CONFIG.cacheTtl.singleProduct);
      return product;
    } catch (err) {
      console.warn(`[Digiseller] getProduct(${numericId}) failed:`, err);
    }
  }

  // Fallback: search product list cache
  const list = digiCache.get<Product[]>(CK.productList());
  if (list) return list.find(p => p.id === idOrSlug) ?? null;

  return mockProducts.find(p => p.id === idOrSlug) ?? null;
}

/**
 * Force a full re-sync from Digiseller API.
 * Clears caches then re-fetches all products.
 */
export async function syncProducts(): Promise<SyncResult> {
  const start = Date.now();

  if (!isDigisellerEnabled()) {
    return {
      ok:         false,
      synced:     0,
      failed:     0,
      durationMs: Date.now() - start,
      timestamp:  new Date().toISOString(),
      error:      'Digiseller not configured. Set DIGISELLER_SELLER_ID and DIGISELLER_API_KEY.',
    };
  }

  digiCache.invalidatePrefix('digi:product');

  try {
    const items = await fetchAllOffers();
    const products = mapOffersToProducts(items);
    digiCache.set(CK.productList(), products, DIGI_CONFIG.cacheTtl.productList);

    const result: SyncResult = {
      ok:         true,
      synced:     products.length,
      failed:     0,
      durationMs: Date.now() - start,
      timestamp:  new Date().toISOString(),
    };
    digiCache.set(CK.syncResult(), result, 3600);
    return result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[Digiseller] syncProducts error:', error);
    const result: SyncResult = {
      ok:         false,
      synced:     0,
      failed:     1,
      durationMs: Date.now() - start,
      timestamp:  new Date().toISOString(),
      error,
    };
    digiCache.set(CK.syncResult(), result, 60);
    return result;
  }
}

/** Get the last sync result from cache */
export function getLastSyncResult(): SyncResult | null {
  return digiCache.get<SyncResult>(CK.syncResult());
}

/** Get purchase URL for a Digiseller product */
export function getPurchaseUrl(productId: number): string {
  return buildPurchaseUrl(productId);
}

export { isDigisellerEnabled };
