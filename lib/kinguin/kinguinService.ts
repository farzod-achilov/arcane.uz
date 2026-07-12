import { isKinguinEnabled, KINGUIN_CONFIG } from './config';
import { fetchAllProducts, fetchProductById, purchaseProduct, fetchBalance, buildTopUpUrl } from './client';
import { mapProductsToArcane, cheapestInStockOffer, isBlockedInUzbekistan } from './productMapper';
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
  // marketplace — see lib/kinguin/types.ts header comment). Look this
  // product up directly rather than relying on the full-catalog cache:
  // with only a handful of games actually dropship-linked, there's no
  // reason a purchase should depend on whether this specific product
  // happened to land within the catalog sync's page cap (2000 items) —
  // this was a real, repeated failure mode before this fix.
  let product;
  try {
    product = await fetchProductById(kinguinId);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : `Failed to look up Kinguin product ${kinguinId}` };
  }

  // Safety net, not the primary defense — the add-form already excludes
  // region-locked products from being linked in the first place. This
  // catches the case where a product's own region policy changes AFTER
  // it was linked (Kinguin controls that, not us). Failing here routes
  // the order to WAITING_MANUAL instead of ever buying a dead key.
  if (isBlockedInUzbekistan(product)) {
    return { ok: false, error: `Kinguin product ${kinguinId} is region-locked and will not activate in Uzbekistan` };
  }

  const cheapest = cheapestInStockOffer(product);
  if (!cheapest) {
    return { ok: false, error: `Kinguin product ${kinguinId} has no in-stock offers` };
  }

  return purchaseProduct(kinguinId, cheapest.price, cheapest.offerId);
}

/** Current merchant account balance (USD) — null if not configured or the lookup fails */
export async function getBalance(): Promise<number | null> {
  if (!isKinguinEnabled()) return null;
  try {
    return await fetchBalance();
  } catch (err) {
    console.warn('[Kinguin] getBalance() failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

export { isKinguinEnabled, buildTopUpUrl };
