import type { Product } from '@/lib/types';
import type { DigiOfferItem, DigiProductDataResponse, DigiNormalizedProduct, StockStatus } from './types';
import { usdToUzs } from './pricingMapper';
import { inferDeliveryType, inferCategory, inferPlatforms } from './deliveryMapper';
import { buildPurchaseUrl } from './client';
import { DIGI_CONFIG } from './config';

/* ─────────────────────────────────────────────────────────
   Product mapper — aligned with real Swagger field names:
   product_id, preview_url, num_in_stock
───────────────────────────────────────────────────────── */

function stripHtml(html: string): string {
  return (html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function mapStockStatus(numInStock: number): StockStatus {
  if (numInStock === 0) return 'out_of_stock';
  if (numInStock === -1) return 'in_stock'; // unlimited
  if (numInStock <= DIGI_CONFIG.lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

/** DigiOfferItem (from /api/agents/offer) → DigiNormalizedProduct */
export function normalizeOffer(item: DigiOfferItem): DigiNormalizedProduct {
  const priceUzs = usdToUzs(item.price);

  return {
    digiGoodId:     item.product_id,
    title:          item.name,
    description:    stripHtml(item.info ?? ''),
    priceUsd:       item.price,
    priceUzs,
    discountPct:    0,
    inStock:        mapStockStatus(item.num_in_stock),
    cntGoods:       item.num_in_stock,
    totalSold:      item.cnt_sells ?? 0,
    imageUrl:       item.preview_url || `https://picsum.photos/seed/digi${item.product_id}/400/550`,
    screenshotUrls: item.preview_imgs ?? [],
    categories:     item.categories ?? [],
    purchaseUrl:    buildPurchaseUrl(item.product_id),
    lastSynced:     new Date().toISOString(),
  };
}

/** DigiProductDataResponse (from /api/products/{id}/data) → DigiNormalizedProduct */
export function normalizeProductData(data: DigiProductDataResponse): DigiNormalizedProduct {
  // The API can return fields at root level OR under a "product" key
  const p = data.product ?? data;
  const id = p.product_id ?? (data as DigiProductDataResponse).id_goods ?? 0;

  return {
    digiGoodId:     id,
    title:          p.name ?? '',
    description:    stripHtml(p.info ?? ''),
    priceUsd:       p.price ?? 0,
    priceUzs:       usdToUzs(p.price ?? 0),
    discountPct:    0,
    inStock:        mapStockStatus(p.num_in_stock ?? -1),
    cntGoods:       p.num_in_stock ?? -1,
    totalSold:      0,
    imageUrl:       p.preview_url || `https://picsum.photos/seed/digi${id}/400/550`,
    screenshotUrls: p.preview_imgs ?? [],
    categories:     p.categories ?? [],
    purchaseUrl:    buildPurchaseUrl(id),
    lastSynced:     new Date().toISOString(),
  };
}

/** DigiNormalizedProduct → ARCANE Product */
export function toArcaneProduct(norm: DigiNormalizedProduct): Product {
  const deliveryType = inferDeliveryType(norm.title, norm.description, norm.categories);
  const category     = inferCategory(norm.categories, norm.title);
  const platforms    = inferPlatforms(norm.title, norm.description);

  const badge: Product['badge'] =
    norm.totalSold < 5 ? 'new'
    : norm.discountPct >= 20 ? 'sale'
    : norm.inStock === 'low_stock' ? 'hot'
    : undefined;

  return {
    id:           String(norm.digiGoodId),
    title:        norm.title,
    subtitle:     norm.categories[0]?.name ?? category,
    price:        norm.priceUzs,
    originalPrice: norm.originalPriceUzs,
    discount:     norm.discountPct || undefined,
    image:        norm.imageUrl,
    screenshots:  norm.screenshotUrls.length ? norm.screenshotUrls : undefined,
    category,
    platform:     platforms,
    rating:       4.5 + Math.random() * 0.4,
    reviews:      norm.totalSold,
    badge,
    inStock:      norm.inStock !== 'out_of_stock',
    description:  norm.description || norm.title,
    features:     [],
    tags:         norm.categories.map(c => c.name.toLowerCase()),
    deliveryType,
    // Digiseller extension fields (compatible with Product via intersection)
    digiGoodId:     norm.digiGoodId,
    digiPurchaseUrl: norm.purchaseUrl,
    digiLastSynced: norm.lastSynced,
    digiInStock:    norm.inStock,
  } as Product & {
    digiGoodId:      number;
    digiPurchaseUrl: string;
    digiLastSynced:  string;
    digiInStock:     StockStatus;
  };
}

/** Bulk map DigiOfferItems → ARCANE Products */
export function mapOffersToProducts(items: DigiOfferItem[]): Product[] {
  return items.map(i => toArcaneProduct(normalizeOffer(i)));
}
