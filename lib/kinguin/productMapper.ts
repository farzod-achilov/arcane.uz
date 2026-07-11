import type { Product } from '@/lib/types';
import type { KinguinProductItem, KinguinNormalizedProduct } from './types';
import { usdToUzs } from './pricingMapper';
import { inferDeliveryType, inferCategory, inferPlatforms } from './deliveryMapper';
import { buildPurchaseUrl } from './client';

/* ─────────────────────────────────────────────────────────
   Product mapper — KinguinProductItem → Product
───────────────────────────────────────────────────────── */

export function normalizeProduct(item: KinguinProductItem): KinguinNormalizedProduct {
  // Kinguin is a marketplace — top-level price/qty are aggregate/reference
  // values, not directly orderable. Find the cheapest offer that actually
  // has stock; that offerId is what a real order must reference.
  const inStockOffers = (item.offers ?? []).filter(o => o.availableQty > 0);
  const cheapest = inStockOffers.length
    ? inStockOffers.reduce((a, b) => (b.price < a.price ? b : a))
    : undefined;

  return {
    kinguinId: item.kinguinId,
    title: item.name,
    priceUsd: cheapest?.price ?? item.price,
    priceUzs: usdToUzs(cheapest?.price ?? item.price),
    inStock: Boolean(cheapest),
    imageUrl: item.images?.cover?.thumbnail || `https://picsum.photos/seed/kinguin${item.kinguinId}/400/550`,
    platform: item.platform ?? 'PC',
    purchaseUrl: buildPurchaseUrl(item.kinguinId),
    lastSynced: new Date().toISOString(),
    cheapestOfferId: cheapest?.offerId,
    cheapestOfferPriceUsd: cheapest?.price,
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

export function mapProductsToArcane(items: KinguinProductItem[]): Product[] {
  return items.map(i => toArcaneProduct(normalizeProduct(i)));
}
