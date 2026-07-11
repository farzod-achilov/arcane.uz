/* ─────────────────────────────────────────────────────────
   Kinguin configuration — reads from env vars.

   CORRECTED 2026-07-11: the real Kinguin eCommerce API (verified
   against github.com/kinguinltdhk/Kinguin-eCommerce-API — the
   official reference implementation) uses a SINGLE `X-Api-Key`
   header, NOT OAuth2 client_credentials. The earlier version of
   this file assumed OAuth2 based on a secondhand web search result
   that turned out to describe a different/older auth scheme —
   left in place until the user pointed at the real reference repo.

   Two separate credential tiers still exist, just both single-key:
     - "search" tier (KINGUIN_API_KEY) — already used by
       app/api/admin/market-prices/route.ts against the older
       Integration API (api.kinguin.net/integration/v1). NOT read
       here — kept fully separate.
     - "merchant" tier (KINGUIN_MERCHANT_API_KEY) — the eCommerce
       API (gateway.kinguin.net/esa/api), required for catalog sync
       + dropship ordering. Obtained via kinguin.net/integration →
       "APPLY FOR ACCESS" → Kinguin ID account → approval →
       Dashboard → "MY STORES". This is what gates isKinguinEnabled().
───────────────────────────────────────────────────────── */

export const KINGUIN_CONFIG = {
  /** Single API key from Dashboard → MY STORES (eCommerce API) */
  apiKey: process.env.KINGUIN_MERCHANT_API_KEY ?? '',

  /** 'sandbox' | 'production' — selects the API host. Credentials differ per environment. */
  env: (process.env.KINGUIN_MERCHANT_ENV === 'production' ? 'production' : 'sandbox') as
    | 'sandbox'
    | 'production',

  /** Verified against the official reference implementation's docs */
  apiBaseUrl:
    process.env.KINGUIN_API_BASE_URL ??
    (process.env.KINGUIN_MERCHANT_ENV === 'production'
      ? 'https://gateway.kinguin.net/esa/api'
      : 'https://gateway.sandbox.kinguin.net/esa/api'),

  usdToUzs: Number(process.env.USD_TO_UZS ?? 12700),

  cacheTtl: {
    productList: Number(process.env.KINGUIN_CACHE_PRODUCTS_TTL ?? 300),
    singleProduct: Number(process.env.KINGUIN_CACHE_PRODUCT_TTL ?? 600),
  },

  lowStockThreshold: 5,
} as const;

/** True once the merchant API key is set (catalog sync + ordering) */
export function isKinguinEnabled(): boolean {
  return Boolean(KINGUIN_CONFIG.apiKey);
}
