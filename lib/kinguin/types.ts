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

   CORRECTED 2026-07-13: both `price` fields below are EUR, not USD —
   confirmed against the same reference repo's api/products/v1/README.md
   ("Cheapest offer price in EUR" / "Offer price in EUR") and against a
   live comparison (this API returned 10.47 for a product a human had just
   seen listed as €10.46 on kinguin.net). Every call site that reads these
   now converts through lib/shared/fxRate.ts's getEurUsdRate() before
   treating the result as USD — except the raw value handed back to
   POST /v1/order, which must echo Kinguin's own EUR number unconverted.
───────────────────────────────────────────────────────── */

/** GET /v1/products — one item in `results` */
export interface KinguinProductItem {
  kinguinId: number;
  productId: string; // Mongo-style id, distinct from the numeric kinguinId
  name: string;
  price: number; // EUR, major units — reference price, NOT orderable directly
  qty: number;   // aggregate across all offers — NOT orderable directly
  platform?: string; // single string, e.g. "Steam" | "Ubisoft" | "Origin"
  genres?: string[];
  images?: { cover?: { thumbnail?: string }; screenshots?: Array<{ url?: string; thumbnail?: string }> };
  offers?: Array<{
    offerId: string;
    price: number; // EUR, major units — see header comment
    qty: number;
    availableQty: number; // the actually-purchasable count for THIS offer
    merchantName?: string;
  }>;
  /**
   * Region lock — a PRODUCT-level property (a region-locked SKU is a
   * different kinguinId entirely, e.g. "Hollow Knight EU..." vs plain
   * "Hollow Knight..."), not per-offer. "REGION FREE" + empty
   * countryLimitation means no restriction. Otherwise countryLimitation
   * is a BLACKLIST of ISO country codes where the key will NOT activate —
   * confirmed live: a "EUROPE" product's list included "UZ" alongside
   * ~150 other non-EU countries. See isBlockedInUzbekistan().
   */
  regionalLimitations?: string;
  countryLimitation?: string[];
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
