import type { Product } from '@/lib/types';
import type { GamivoProductItem, GamivoNormalizedProduct } from './types';
import { usdToUzs } from './pricingMapper';
import { inferDeliveryType, inferCategory, inferPlatforms } from './deliveryMapper';
import { buildPurchaseUrl } from './client';

export function normalizeProduct(item: GamivoProductItem): GamivoNormalizedProduct {
  return {
    gamivoId: item.id,
    title: item.name,
    priceUsd: item.price,
    priceUzs: usdToUzs(item.price),
    inStock: item.available !== false && item.qty > 0,
    imageUrl: item.coverImage || `https://picsum.photos/seed/gamivo${item.id}/400/550`,
    platform: item.platform ?? 'PC',
    purchaseUrl: buildPurchaseUrl(item.id),
    lastSynced: new Date().toISOString(),
  };
}

export function toArcaneProduct(norm: GamivoNormalizedProduct): Product {
  const deliveryType = inferDeliveryType(norm.title, norm.platform);
  const category = inferCategory(norm.title);
  const platforms = inferPlatforms(norm.platform, norm.title);

  return {
    id: `gamivo-${norm.gamivoId}`,
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
    gamivoId: norm.gamivoId,
    gamivoPurchaseUrl: norm.purchaseUrl,
    gamivoLastSynced: norm.lastSynced,
    gamivoInStock: norm.inStock,
  } as Product & { gamivoId: string; gamivoPurchaseUrl: string; gamivoLastSynced: string; gamivoInStock: boolean };
}

export function mapProductsToArcane(items: GamivoProductItem[]): Product[] {
  return items.map(i => toArcaneProduct(normalizeProduct(i)));
}
