/* ─────────────────────────────────────────────────────────
   Digiseller API v3 — exact types from Swagger spec
   https://api.digiseller.com/swagger/ui/index
───────────────────────────────────────────────────────── */

/* ── Auth ─────────────────────────────────────────────── */

/** POST /api/apilogin — request body */
export interface DigiLoginRequest {
  seller_id: number;
  timestamp: number;
  sign: string; // SHA256( SHA256(api_key) + timestamp )
}

/** POST /api/apilogin — response (DigiAPI.Models.ApiLoginResponse) */
export interface DigiLoginResponse {
  retval:    number;
  retdesc?:  string;  // legacy alias
  desc?:     string;  // Russian error description
  endesc?:   string;  // English error description
  token:     string;
  seller_id: number;
  valid_thru?: string;
}

/* ── Agents offer (product list) ──────────────────────── */

/** GET /api/agents/offer — one product item */
export interface DigiOfferItem {
  product_id:         number;
  name:               string;
  price:              number;
  currency:           string;
  num_in_stock:       number;   // -1 = unlimited, 0 = out of stock
  preview_url:        string;
  seller_id:          number;
  commission_percent: number;
  // Extended fields present when token belongs to the seller:
  info?:              string;   // HTML description
  categories?:        DigiCategory[];
  preview_imgs?:      string[];
  cnt_sells?:         number;
}

/** GET /api/agents/offer — paginated response wrapper */
export interface DigiOffersResponse {
  retval?:        number;
  retdesc?:       string;
  page?:          number;
  count?:         number;
  total_count?:   number;
  total_pages?:   number;
  has_next_page?: boolean;
  rows?:          DigiOfferItem[];   // some versions use "rows"
  items?:         DigiOfferItem[];   // some versions use "items"
  // Direct array fallback (API sometimes returns array at root)
  [index: number]: DigiOfferItem | unknown;
}

/* ── Single product ───────────────────────────────────── */

/** GET /api/products/{product_id}/data — response */
export interface DigiProductDataResponse {
  retval?:       number;
  retdesc?:      string;
  // Fields returned at root level or nested under "product":
  product_id?:   number;
  id_goods?:     number;   // legacy alias
  name?:         string;
  info?:         string;   // HTML description
  price?:        number;
  currency?:     string;
  num_in_stock?: number;
  preview_url?:  string;
  preview_imgs?: string[];
  categories?:   DigiCategory[];
  product?: {
    product_id:    number;
    name:          string;
    info:          string;
    price:         number;
    currency:      string;
    num_in_stock:  number;
    preview_url?:  string;
    preview_imgs?: string[];
    categories?:   DigiCategory[];
  };
}

/* ── Batch product list ───────────────────────────────── */

/** POST /api/products/list — request body */
export interface DigiProductListRequest {
  ids:    number[];
  lang?:  string;
  token?: string;
}

/* ── Sales / orders ───────────────────────────────────── */

/** POST /api/seller-sells/v2 — request body */
export interface DigiSellerSalesRequest {
  date_start?:    string; // ISO datetime
  date_end?:      string;
  page:           number;
  count:          number;
  product_id?:    number;
  status_filter?: string[];
}

/** One sale item in the sales response */
export interface DigiSaleItem {
  inv:          number;   // invoice ID
  id_goods:     number;
  product_name: string;
  amount:       number;
  currency:     string;
  date_pay:     string;
  buyer_email?: string;
  status:       string;
}

export interface DigiSalesResponse {
  retval?:     number;
  retdesc?:    string;
  rows?:       DigiSaleItem[];
  total_count?: number;
  pages?:      number;
}

/* ── Shared ───────────────────────────────────────────── */

export interface DigiCategory {
  id:   number;
  name: string;
}

export interface DigiToken {
  value:     string;
  expiresAt: number; // unix ms
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

/* ── Normalized product (internal, framework-agnostic) ── */
export interface DigiNormalizedProduct {
  digiGoodId:          number;
  title:               string;
  description:         string;
  priceUsd:            number;
  priceUzs:            number;
  discountPct:         number;
  originalPriceUzs?:   number;
  inStock:             StockStatus;
  cntGoods:            number;
  totalSold:           number;
  imageUrl:            string;
  screenshotUrls:      string[];
  categories:          DigiCategory[];
  purchaseUrl:         string;
  lastSynced:          string;
}

export interface SyncResult {
  ok:         boolean;
  synced:     number;
  failed:     number;
  durationMs: number;
  timestamp:  string;
  error?:     string;
}
