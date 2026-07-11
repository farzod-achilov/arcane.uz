import type { Product } from '@/lib/types';
import type { G2aProductItem, G2aNormalizedProduct } from './types';
import { usdToUzs } from './pricingMapper';
import { inferDeliveryType, inferCategory, inferPlatforms } from './deliveryMapper';
import { buildPurchaseUrl } from './client';

/* Dead code today (fetchAllProducts() always returns []) — kept for
   structural parity, see lib/g2a/config.ts header comment. */

export function normalizeProduct(item: G2aProductItem): G2aNormalizedProduct {
  return {
    g2aId: item.id,
    title: item.name,
    priceUsd: item.price,
    priceUzs: usdToUzs(item.price),
    inStock: item.available !== false && item.qty > 0,
    imageUrl: item.coverImage || `https://picsum.photos/seed/g2a${item.id}/400/550`,
    platform: item.platform ?? 'PC',
    purchaseUrl: buildPurchaseUrl(item.id),
    lastSynced: new Date().toISOString(),
  };
}

export function toArcaneProduct(norm: G2aNormalizedProduct): Product {
  const deliveryType = inferDeliveryType(norm.title, norm.platform);
  const category = inferCategory(norm.title);
  const platforms = inferPlatforms(norm.platform, norm.title);

  return {
    id: `g2a-${norm.g2aId}`,
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
    g2aId: norm.g2aId,
    g2aPurchaseUrl: norm.purchaseUrl,
    g2aLastSynced: norm.lastSynced,
    g2aInStock: norm.inStock,
  } as Product & { g2aId: string; g2aPurchaseUrl: string; g2aLastSynced: string; g2aInStock: boolean };
}

export function mapProductsToArcane(items: G2aProductItem[]): Product[] {
  return items.map(i => toArcaneProduct(normalizeProduct(i)));
}
