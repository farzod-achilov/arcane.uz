/* ─────────────────────────────────────────────────────────
   Digiseller configuration — reads from env vars
   Set these in .env.local to enable real API mode
───────────────────────────────────────────────────────── */

export const DIGI_CONFIG = {
  /** Your Digiseller seller ID (numeric) */
  sellerId: process.env.DIGISELLER_SELLER_ID ?? '',

  /** Your Digiseller API password / key */
  apiKey: process.env.DIGISELLER_API_KEY ?? '',

  /** Digiseller API base URL */
  baseUrl: process.env.DIGISELLER_BASE_URL ?? 'https://api.digiseller.com/api',

  /** Digiseller storefront base (for purchase links) */
  storeUrl: process.env.DIGISELLER_STORE_URL ?? 'https://digiseller.com',

  /** Products per page when fetching full catalog */
  pageSize: Number(process.env.DIGISELLER_PAGE_SIZE ?? 50),

  /** USD → UZS exchange rate (update periodically) */
  usdToUzs: Number(process.env.USD_TO_UZS ?? 12700),

  /** Cache TTL in seconds */
  cacheTtl: {
    productList: Number(process.env.DIGI_CACHE_PRODUCTS_TTL ?? 300),   // 5 min
    singleProduct: Number(process.env.DIGI_CACHE_PRODUCT_TTL ?? 600),  // 10 min
    token: 11 * 60 * 60, // 11 hours (token valid 12h)
  },

  /** Low-stock threshold */
  lowStockThreshold: 5,
} as const;

/** Returns true when Digiseller is properly configured */
export function isDigisellerEnabled(): boolean {
  return Boolean(DIGI_CONFIG.sellerId && DIGI_CONFIG.apiKey);
}
