import type { Product } from '@/lib/types';
import type { KinguinProductItem, KinguinNormalizedProduct } from './types';
import { usdToUzs } from './pricingMapper';
import { inferDeliveryType, inferCategory, inferPlatforms } from './deliveryMapper';
import { buildPurchaseUrl } from './client';

/* ─────────────────────────────────────────────────────────
   Product mapper — KinguinProductItem → Product
───────────────────────────────────────────────────────── */

const UZBEKISTAN_ISO = 'UZ';

/**
 * True if this Kinguin product's key will NOT activate for a customer in
 * Uzbekistan. Caught live once already (Hollow Knight EU, kinguinId 56646,
 * had "UZ" in its country blacklist) before it ever reached a real order —
 * every call site that picks or buys a Kinguin product should check this
 * first. "REGION FREE" products have an empty countryLimitation and are
 * always safe.
 */
export function isBlockedInUzbekistan(item: KinguinProductItem): boolean {
  return (item.countryLimitation ?? []).includes(UZBEKISTAN_ISO);
}

/**
 * Kinguin is a marketplace — a product's top-level price/qty are aggregate/
 * reference values, not directly orderable. This finds the cheapest offer
 * that actually has stock; that offerId is what a real order must reference.
 * Shared between the catalog mapper below and kinguinService's purchaseKey().
 */
export function cheapestInStockOffer(item: KinguinProductItem) {
  const inStockOffers = (item.offers ?? []).filter(o => o.availableQty > 0);
  return inStockOffers.length
    ? inStockOffers.reduce((a, b) => (b.price < a.price ? b : a))
    : undefined;
}

/**
 * eurUsdRate — Kinguin's own price/offer.price fields are EUR (see
 * lib/shared/fxRate.ts header comment), converted to USD here since
 * everything downstream (KinguinNormalizedProduct.priceUsd, game_pricing,
 * Smart Pricing) assumes USD.
 */
export function normalizeProduct(item: KinguinProductItem, eurUsdRate: number): KinguinNormalizedProduct {
  const cheapest = cheapestInStockOffer(item);
  const priceEur = cheapest?.price ?? item.price;
  const priceUsd = priceEur * eurUsdRate;

  return {
    kinguinId: item.kinguinId,
    title: item.name,
    priceUsd,
    priceUzs: usdToUzs(priceUsd),
    inStock: Boolean(cheapest),
    imageUrl: item.images?.cover?.thumbnail || `https://picsum.photos/seed/kinguin${item.kinguinId}/400/550`,
    platform: item.platform ?? 'PC',
    purchaseUrl: buildPurchaseUrl(item.kinguinId),
    lastSynced: new Date().toISOString(),
    cheapestOfferId: cheapest?.offerId,
    cheapestOfferPriceUsd: cheapest ? cheapest.price * eurUsdRate : undefined,
  };
}

export function toArcaneProduct(norm: KinguinNormalizedProduct): Product {
  const deliveryType = inferDeliveryType(norm.title, norm.platform);
  const category = inferCategory(norm.title);
  const platforms = inferPlatforms(norm.platform, norm.title);

  return {
    id: `kinguin-${norm.kinguinId}`,
    title: norm.title,
    subtitle: category,
    price: norm.priceUzs,
    image: norm.imageUrl,
    category,
    platform: platforms,
    rating: 4.5 + Math.random() * 0.4,
    reviews: 0,
    inStock: norm.inStock,
    description: norm.title,
    features: [],
    tags: [category],
    deliveryType,
    // Kinguin extension fields (compatible with Product via intersection)
    kinguinId: norm.kinguinId,
    kinguinPurchaseUrl: norm.purchaseUrl,
    kinguinLastSynced: norm.lastSynced,
    kinguinInStock: norm.inStock,
    kinguinOfferId: norm.cheapestOfferId,
    kinguinOfferPriceUsd: norm.cheapestOfferPriceUsd,
  } as Product & {
    kinguinId: number;
    kinguinPurchaseUrl: string;
    kinguinLastSynced: string;
    kinguinInStock: boolean;
    kinguinOfferId?: string;
    kinguinOfferPriceUsd?: number;
  };
}

export function mapProductsToArcane(items: KinguinProductItem[], eurUsdRate: number): Product[] {
  return items.map(i => toArcaneProduct(normalizeProduct(i, eurUsdRate)));
}
