import { ENEBA_CONFIG } from './config';
import { getEnebaToken, invalidateToken } from './auth';
import { fetchWithTimeout } from '@/lib/shared/fetchWithTimeout';
import type { EnebaAuctionsResponse, EnebaAuctionNode, EnebaPurchaseResult } from './types';

/* ─────────────────────────────────────────────────────────
   Eneba GraphQL client (merchant-authenticated).
───────────────────────────────────────────────────────── */

async function graphqlRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const token = await getEnebaToken();

  const doRequest = async (accessToken: string) =>
    fetchWithTimeout(ENEBA_CONFIG.graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query, variables }),
    });

  let res = await doRequest(token);

  if (res.status === 401) {
    invalidateToken();
    const fresh = await getEnebaToken();
    res = await doRequest(fresh);
  }

  if (!res.ok) throw new Error(`[Eneba] GraphQL HTTP ${res.status}`);
  return res.json();
}

/**
 * Catalog search — verified query shape (same one already proven
 * working in app/api/admin/market-prices/route.ts's search tier).
 */
export async function searchCatalog(query: string, limit = 50): Promise<EnebaAuctionNode[]> {
  const gql = `
    query SearchProducts($search: String!, $first: Int!) {
      marketplace {
        auctions(
          filters: { search: $search, regionId: 1 }
          pagination: { first: $first }
          sort: { field: PRICE, direction: ASC }
        ) {
          edges {
            node {
              price { amount currency }
              product { name slug image platform }
              inStock
            }
          }
        }
      }
    }
  `;

  const data = await graphqlRequest<EnebaAuctionsResponse>(gql, { search: query, first: limit });
  if (data.errors?.length) {
    throw new Error(`[Eneba] GraphQL error: ${data.errors[0].message}`);
  }
  return (data.data?.marketplace?.auctions?.edges ?? []).map(e => e.node);
}

/**
 * ⚠ UNVERIFIED — see lib/eneba/types.ts header comment.
 * Eneba's confirmed OAuth2 API is documented for merchants managing
 * their OWN listings; it is not confirmed to support buying a key
 * from another seller's listing on demand, which is what dropship
 * fulfillment needs. This is a best-effort placeholder mutation —
 * lib/delivery/dropshipDeliver.ts already treats any failure here
 * (including a wrong/rejected mutation) as "waiting for manual
 * fulfillment", so this is safe to ship, but should not be treated
 * as a confirmed capability until validated against real credentials.
 */
export async function purchaseProduct(slug: string): Promise<EnebaPurchaseResult> {
  try {
    const gql = `
      mutation PurchaseProduct($slug: String!) {
        marketplace {
          purchaseAuction(slug: $slug) {
            key
          }
        }
      }
    `;
    const data = await graphqlRequest<{
      data?: { marketplace?: { purchaseAuction?: { key?: string } } };
      errors?: Array<{ message: string }>;
    }>(gql, { slug });

    if (data.errors?.length) return { ok: false, error: data.errors[0].message };
    const key = data.data?.marketplace?.purchaseAuction?.key;
    if (!key) return { ok: false, error: 'No key in purchase response' };
    return { ok: true, key };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown Eneba purchase error' };
  }
}

export function buildPurchaseUrl(slug: string): string {
  return `https://www.eneba.com/${slug}`;
}
