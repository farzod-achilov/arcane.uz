import { isEnebaEnabled, ENEBA_CONFIG } from './config';
import { searchCatalog, purchaseProduct } from './client';
import { mapAuctionsToProducts } from './productMapper';
import { enebaCache, CK } from './cache';
import { products as mockProducts } from '@/lib/mockData';
import type { Product } from '@/lib/types';
import type { SyncResult, EnebaPurchaseResult } from './types';

/* ─────────────────────────────────────────────────────────
   Eneba service — business logic
   Real mode:  fetches from Eneba's merchant GraphQL API (cached)
   Mock mode:  returns lib/mockData products unchanged
───────────────────────────────────────────────────────── */

// Eneba's verified catalog query requires a search term (no confirmed
// "list everything" endpoint) — an empty string is a best-effort
// "browse all" query; falls back to mock on any failure regardless.
const BROWSE_ALL_QUERY = '';
const BROWSE_ALL_LIMIT = 100;

export async function getProducts(): Promise<Product[]> {
  if (!isEnebaEnabled()) return mockProducts;

  const cached = enebaCache.get<Product[]>(CK.productList());
  if (cached) return cached;

  const nodes = await searchCatalog(BROWSE_ALL_QUERY, BROWSE_ALL_LIMIT);
  const products = mapAuctionsToProducts(nodes);

  enebaCache.set(CK.productList(), products, ENEBA_CONFIG.cacheTtl.productList);
  return products;
}

export async function getProduct(idOrSlug: string): Promise<Product | null> {
  if (!isEnebaEnabled()) {
    return mockProducts.find(p => p.id === idOrSlug) ?? null;
  }

  const slug = idOrSlug.startsWith('eneba-') ? idOrSlug.slice('eneba-'.length) : idOrSlug;

  const cached = enebaCache.get<Product>(CK.product(slug));
  if (cached) return cached;

  const list = enebaCache.get<Product[]>(CK.productList());
  if (list) {
    const found = list.find(p => p.id === idOrSlug || p.id === `eneba-${slug}`);
    if (found) return found;
  }

  return mockProducts.find(p => p.id === idOrSlug) ?? null;
}

export async function syncProducts(): Promise<SyncResult> {
  const start = Date.now();

  if (!isEnebaEnabled()) {
    return {
      ok: false,
      synced: 0,
      failed: 0,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      error: 'Eneba not configured. Set ENEBA_AUTH_ID and ENEBA_AUTH_SECRET.',
    };
  }

  enebaCache.invalidatePrefix('eneba:product');

  try {
    const nodes = await searchCatalog(BROWSE_ALL_QUERY, BROWSE_ALL_LIMIT);
    const products = mapAuctionsToProducts(nodes);
    enebaCache.set(CK.productList(), products, ENEBA_CONFIG.cacheTtl.productList);

    const result: SyncResult = {
      ok: true,
      synced: products.length,
      failed: 0,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
    enebaCache.set(CK.syncResult(), result, 3600);
    return result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[Eneba] syncProducts error:', error);
    const result: SyncResult = {
      ok: false,
      synced: 0,
      failed: 1,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      error,
    };
    enebaCache.set(CK.syncResult(), result, 60);
    return result;
  }
}

export function getLastSyncResult(): SyncResult | null {
  return enebaCache.get<SyncResult>(CK.syncResult());
}

/**
 * Dropship purchase — called by lib/delivery/dropshipDeliver.ts at order
 * time. See lib/eneba/client.ts's purchaseProduct() header comment: the
 * underlying mutation is unverified, so any failure here is expected to
 * be handled as "waiting for manual fulfillment" by the caller.
 */
export async function purchaseKey(externalSlug: string): Promise<EnebaPurchaseResult> {
  if (!isEnebaEnabled()) {
    return { ok: false, error: 'Eneba not configured' };
  }
  return purchaseProduct(externalSlug);
}

export { isEnebaEnabled };
