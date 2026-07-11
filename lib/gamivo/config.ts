/* ─────────────────────────────────────────────────────────
   Gamivo configuration — ⚠ UNVERIFIED INTEGRATION.
   Gamivo's own public API documentation page is explicitly titled
   "under development". A basic API key exists (Account → API
   Settings → Generate new API token), but real B2B/dropship access
   goes through a separate "Wholesale API" gated by IP whitelist and
   manual approval — not self-serve. isGamivoEnabled() still checks
   env vars for admin-panel consistency, but lib/gamivo/auth.ts
   always throws UnverifiedSupplierError — no network call is ever
   attempted until this is confirmed.
───────────────────────────────────────────────────────── */

export const GAMIVO_CONFIG = {
  /** Placeholder — basic API key tier vs gated Wholesale API tier unconfirmed */
  apiKey: process.env.GAMIVO_API_KEY ?? '',
  clientSecret: process.env.GAMIVO_CLIENT_SECRET ?? '',

  apiBaseUrl: process.env.GAMIVO_API_BASE_URL ?? 'https://www.gamivo.com/api',

  usdToUzs: Number(process.env.USD_TO_UZS ?? 12700),

  cacheTtl: {
    productList: Number(process.env.GAMIVO_CACHE_PRODUCTS_TTL ?? 300),
    singleProduct: Number(process.env.GAMIVO_CACHE_PRODUCT_TTL ?? 600),
  },

  lowStockThreshold: 5,
} as const;

/** Env vars present ≠ integration usable — see file header */
export function isGamivoEnabled(): boolean {
  return Boolean(GAMIVO_CONFIG.apiKey && GAMIVO_CONFIG.clientSecret);
}
