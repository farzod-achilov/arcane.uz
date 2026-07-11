/* ─────────────────────────────────────────────────────────
   Eneba configuration — reads from env vars
   Two separate credential tiers:
     - "search" tier (ENEBA_API_KEY) — already used by
       app/api/admin/market-prices/route.ts for read-only price
       comparison. NOT read here — kept fully separate.
     - "merchant" tier (ENEBA_AUTH_ID/SECRET) — OAuth2
       client_credentials, required for catalog sync + dropship
       ordering. This is what gates isEnebaEnabled().
───────────────────────────────────────────────────────── */

export const ENEBA_CONFIG = {
  /** OAuth2 client_credentials — from Eneba merchant dashboard */
  authId: process.env.ENEBA_AUTH_ID ?? '',
  authSecret: process.env.ENEBA_AUTH_SECRET ?? '',

  /** 'sandbox' | 'production' — selects token + API host */
  env: (process.env.ENEBA_MERCHANT_ENV === 'production' ? 'production' : 'sandbox') as
    | 'sandbox'
    | 'production',

  /** OAuth2 token endpoints (verified against Eneba's official API docs) */
  tokenUrl:
    process.env.ENEBA_MERCHANT_ENV === 'production'
      ? 'https://user.eneba.com/oauth/token'
      : 'https://api-sandbox.eneba.com/oauth/token',

  /**
   * GraphQL merchant API base.
   * Sandbox confirmed from official docs. Production inferred from the
   * same domain pattern (api.eneba.com hosts the docs) — confirm the
   * exact host once real credentials are issued.
   */
  graphqlUrl:
    process.env.ENEBA_API_BASE_URL ??
    (process.env.ENEBA_MERCHANT_ENV === 'production'
      ? 'https://api.eneba.com/graphql/'
      : 'https://api-sandbox.eneba.com/graphql/'),

  usdToUzs: Number(process.env.USD_TO_UZS ?? 12700),

  cacheTtl: {
    productList: Number(process.env.ENEBA_CACHE_PRODUCTS_TTL ?? 300),
    singleProduct: Number(process.env.ENEBA_CACHE_PRODUCT_TTL ?? 600),
    tokenFallback: 3600, // used only if the token response omits expires_in
  },

  lowStockThreshold: 5,
} as const;

/** True once merchant OAuth2 credentials are set (catalog sync + ordering) */
export function isEnebaEnabled(): boolean {
  return Boolean(ENEBA_CONFIG.authId && ENEBA_CONFIG.authSecret);
}
