/* ─────────────────────────────────────────────────────────
   Eneba GraphQL API — types.
   Catalog search shape verified working (same query already
   used in app/api/admin/market-prices/route.ts's read-only
   search-tier lookup, here re-authenticated with a merchant
   Bearer token instead of the simple ENEBA_API_KEY).

   ⚠ The purchase/order mutation shape below is NOT verified.
   Eneba's public docs describe their OAuth2 GraphQL API as being
   "for Eneba merchants selling digital products" — i.e. tooling
   for sellers managing their OWN listings, not confirmed to
   support buying from other sellers' listings (which is what
   dropship needs). Confirm this with Eneba support before relying
   on it — see lib/eneba/client.ts's purchaseProduct().
───────────────────────────────────────────────────────── */

export interface EnebaMoney {
  amount: number; // minor units (cents)
  currency: string;
}

export interface EnebaAuctionNode {
  price: EnebaMoney;
  product: {
    name: string;
    slug?: string;
    image?: string;
    platform?: string;
  };
  inStock: boolean;
}

export interface EnebaAuctionsResponse {
  data?: {
    marketplace?: {
      auctions?: {
        edges?: Array<{ node: EnebaAuctionNode }>;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

/** Internal, framework-agnostic normalized shape */
export interface EnebaNormalizedProduct {
  enebaSlug: string;
  title: string;
  priceUsd: number;
  priceUzs: number;
  inStock: boolean;
  imageUrl: string;
  platform: string;
  purchaseUrl: string;
  lastSynced: string;
}

export interface SyncResult {
  ok: boolean;
  synced: number;
  failed: number;
  durationMs: number;
  timestamp: string;
  error?: string;
}

/** ⚠ Placeholder shape — unverified, see file header */
export interface EnebaPurchaseResult {
  ok: boolean;
  key?: string;
  error?: string;
}
