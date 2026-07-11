/* ─────────────────────────────────────────────────────────
   G2A configuration — ⚠ UNVERIFIED INTEGRATION.
   G2A's Integration/Import API docs did not load (empty/JS-rendered
   content on repeated fetch attempts), so the auth scheme below is
   unconfirmed. isG2aEnabled() still checks env vars for admin-panel
   consistency, but lib/g2a/auth.ts always throws UnverifiedSupplierError
   — no network call is ever attempted until this is confirmed and
   the client rewritten against real docs/a dev account.
───────────────────────────────────────────────────────── */

export const G2A_CONFIG = {
  /** Placeholder — exact credential shape (API key? OAuth2? hash-signing?) unconfirmed */
  clientId: process.env.G2A_CLIENT_ID ?? '',
  clientSecret: process.env.G2A_CLIENT_SECRET ?? '',

  apiBaseUrl: process.env.G2A_API_BASE_URL ?? 'https://api.g2a.com/v1',

  usdToUzs: Number(process.env.USD_TO_UZS ?? 12700),

  cacheTtl: {
    productList: Number(process.env.G2A_CACHE_PRODUCTS_TTL ?? 300),
    singleProduct: Number(process.env.G2A_CACHE_PRODUCT_TTL ?? 600),
  },

  lowStockThreshold: 5,
} as const;

/** Env vars present ≠ integration usable — see file header */
export function isG2aEnabled(): boolean {
  return Boolean(G2A_CONFIG.clientId && G2A_CONFIG.clientSecret);
}
