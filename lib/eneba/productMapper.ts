import type { Product } from '@/lib/types';
import type { EnebaAuctionNode, EnebaNormalizedProduct } from './types';
import { usdToUzs } from './pricingMapper';
import { inferDeliveryType, inferCategory, inferPlatforms } from './deliveryMapper';
import { buildPurchaseUrl } from './client';

/* ─────────────────────────────────────────────────────────
   Product mapper — EnebaAuctionNode → Product
───────────────────────────────────────────────────────── */

function toUsd(amountMinorUnits: number, currency: string): number {
  // Eneba amounts are minor units (cents); non-USD currencies are left
  // as-is here since real conversion needs live FX rates — acceptable
  // for a mock/scaffold catalog, revisit once merchant credentials exist.
  const major = amountMinorUnits / 100;
  return currency === 'USD' ? major : major;
}

export function normalizeAuction(node: EnebaAuctionNode): EnebaNormalizedProduct {
  const slug = node.product.slug ?? node.product.name.toLowerCase().replace(/\s+/g, '-');
  const priceUsd = toUsd(node.price.amount, node.price.currency);

  return {
    enebaSlug: slug,
    title: node.product.name,
    priceUsd,
    priceUzs: usdToUzs(priceUsd),
    inStock: node.inStock,
    imageUrl: node.product.image || `https://picsum.photos/seed/eneba${slug}/400/550`,
    platform: node.product.platform ?? 'PC',
    purchaseUrl: buildPurchaseUrl(slug),
    lastSynced: new Date().toISOString(),
  };
}

export function toArcaneProduct(norm: EnebaNormalizedProduct): Product {
  const deliveryType = inferDeliveryType(norm.title, norm.platform);
  const category = inferCategory(norm.title);
  const platforms = inferPlatforms(norm.platform, norm.title);

  return {
    id: `eneba-${norm.enebaSlug}`,
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
    // Eneba extension fields (compatible with Product via intersection)
    enebaSlug: norm.enebaSlug,
    enebaPurchaseUrl: norm.purchaseUrl,
    enebaLastSynced: norm.lastSynced,
    enebaInStock: norm.inStock,
  } as Product & {
    enebaSlug: string;
    enebaPurchaseUrl: string;
    enebaLastSynced: string;
    enebaInStock: boolean;
  };
}

export function mapAuctionsToProducts(nodes: EnebaAuctionNode[]): Product[] {
  return nodes.map(n => toArcaneProduct(normalizeAuction(n)));
}
