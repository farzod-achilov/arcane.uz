/* ─────────────────────────────────────────────────────────
   Kinguin eCommerce API — types.
   Auth + endpoint shapes verified against
   github.com/kinguinltdhk/Kinguin-eCommerce-API (the official
   reference implementation). Field-level shapes below additionally
   confirmed 2026-07-11 against a LIVE production response (real
   API key, GET /v1/products) — this is not a documentation guess.

   Kinguin's catalog is a marketplace: a product's top-level
   `price`/`qty` are reference/aggregate values, NOT what you order.
   Actual purchasing is per-`offer` — each offer has its own
   `offerId`, `price`, `availableQty`, `merchantName`. Ordering
   must reference a specific offerId (see KinguinOrderRequest).
───────────────────────────────────────────────────────── */

/** GET /v1/products — one item in `results` */
export interface KinguinProductItem {
  kinguinId: number;
  productId: string; // Mongo-style id, distinct from the numeric kinguinId
  name: string;
  price: number; // USD, major units — reference price, NOT orderable directly
  qty: number;   // aggregate across all offers — NOT orderable directly
  platform?: string; // single string, e.g. "Steam" | "Ubisoft" | "Origin"
  genres?: string[];
  images?: { cover?: { thumbnail?: string }; screenshots?: Array<{ url?: string; thumbnail?: string }> };
  offers?: Array<{
    offerId: string;
    price: number;
    qty: number;
    availableQty: number; // the actually-purchasable count for THIS offer
    merchantName?: string;
  }>;
}

/** GET /v1/products — response envelope */
export interface KinguinProductListResponse {
  results: KinguinProductItem[];
  item_count: number;
}

/** POST /order (v1) — request body */
export interface KinguinOrderRequest {
  products: Array<{
    kinguinId: number;
    qty: number;
    price: number;
    keyType?: string;
    offerId?: string;
  }>;
  orderExternalId?: string;
}

/** POST /order (v1) — response */
export interface KinguinOrderResponse {
  orderId: string;
  status: string; // e.g. "processing" | "completed"
  products: Array<{
    kinguinId: number;
    name: string;
    keys: Array<{ id: string; status: string }>; // status e.g. "DELIVERED" — id is NOT the redeemable code
  }>;
}

/** GET /v2/order/{orderId}/keys — one key object */
export interface KinguinKeyObject {
  id: string;
  serial: string; // the actual redeemable key/code
  type: string;   // e.g. "text/plain"
}

export interface KinguinNormalizedProduct {
  kinguinId: number;
  title: string;
  priceUsd: number;
  priceUzs: number;
  inStock: boolean;
  imageUrl: string;
  platform: string;
  purchaseUrl: string;
  lastSynced: string;
  /** Cheapest in-stock offer at sync time — what an order would actually reference */
  cheapestOfferId?: string;
  cheapestOfferPriceUsd?: number;
}

export interface SyncResult {
  ok: boolean;
  synced: number;
  failed: number;
  durationMs: number;
  timestamp: string;
  error?: string;
}

export interface KinguinPurchaseResult {
  ok: boolean;
  key?: string;
  error?: string;
}
