import { KINGUIN_CONFIG } from './config';
import { fetchWithTimeout } from '@/lib/shared/fetchWithTimeout';
import type {
  KinguinProductListResponse, KinguinProductItem,
  KinguinOrderRequest, KinguinOrderResponse, KinguinKeyObject,
  KinguinPurchaseResult,
} from './types';

/* ─────────────────────────────────────────────────────────
   Kinguin eCommerce API client — single X-Api-Key header,
   no token exchange (see lib/kinguin/config.ts header comment
   for why this replaced an earlier, incorrect OAuth2 version).
───────────────────────────────────────────────────────── */

function authHeaders(): Record<string, string> {
  return {
    'X-Api-Key': KINGUIN_CONFIG.apiKey,
    'Content-Type': 'application/json',
  };
}

export async function fetchCatalogPage(page = 1, limit = 50): Promise<{ items: KinguinProductItem[]; hasMore: boolean }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetchWithTimeout(`${KINGUIN_CONFIG.apiBaseUrl}/v1/products?${qs}`, {
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error(`[Kinguin] GET /v1/products HTTP ${res.status}`);

  const data: KinguinProductListResponse = await res.json();
  const items = data.results ?? [];
  return { items, hasMore: page * limit < (data.item_count ?? 0) };
}

export async function fetchAllProducts(): Promise<KinguinProductItem[]> {
  const PAGE_SIZE = 100; // API max per docs
  const MAX_PAGES = 20;  // bound blast radius, same convention as lib/digiseller/client.ts

  const all: KinguinProductItem[] = [];
  let page = 1;

  while (page <= MAX_PAGES) {
    const { items, hasMore } = await fetchCatalogPage(page, PAGE_SIZE);
    all.push(...items);
    if (!hasMore) break;
    page++;
  }

  return all;
}

async function createOrder(kinguinId: number, price: number, offerId?: string): Promise<KinguinOrderResponse> {
  const body: KinguinOrderRequest = {
    products: [{ kinguinId, qty: 1, price, offerId }],
    orderExternalId: crypto.randomUUID(),
  };

  const res = await fetchWithTimeout(`${KINGUIN_CONFIG.apiBaseUrl}/v1/order`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`[Kinguin] POST /v1/order HTTP ${res.status}${detail ? `: ${detail}` : ''}`);
  }
  return res.json();
}

async function downloadKeys(orderId: string): Promise<KinguinKeyObject[]> {
  const res = await fetchWithTimeout(`${KINGUIN_CONFIG.apiBaseUrl}/v2/order/${orderId}/keys?page=1&limit=10`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`[Kinguin] GET /v2/order/${orderId}/keys HTTP ${res.status}`);
  return res.json();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Places an order, then polls the "download keys" endpoint since Kinguin
 * order fulfillment is async (status starts "processing"). Bounded to a
 * few short retries — if the key still isn't ready within that window,
 * returns failure so lib/delivery/dropshipDeliver.ts falls back to
 * WAITING_MANUAL, same as any other unavailable-stock case.
 */
export async function purchaseProduct(kinguinId: number, price: number, offerId?: string): Promise<KinguinPurchaseResult> {
  try {
    const order = await createOrder(kinguinId, price, offerId);

    const MAX_ATTEMPTS = 3;
    const DELAY_MS = 1500;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) await sleep(DELAY_MS);
      const keys = await downloadKeys(order.orderId);
      if (keys.length > 0 && keys[0].serial) {
        return { ok: true, key: keys[0].serial };
      }
    }

    return { ok: false, error: `Order ${order.orderId} not delivered within polling window` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown Kinguin purchase error' };
  }
}

export function buildPurchaseUrl(kinguinId: number): string {
  return `https://www.kinguin.net/category/${kinguinId}`;
}
