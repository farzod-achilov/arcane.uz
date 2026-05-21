import { DIGI_CONFIG } from './config';
import { getDigiToken, invalidateToken } from './auth';
import type {
  DigiOffersResponse, DigiOfferItem,
  DigiProductDataResponse,
  DigiProductListRequest,
  DigiSellerSalesRequest, DigiSalesResponse,
} from './types';

/* ─────────────────────────────────────────────────────────
   Digiseller API client
   Endpoints matched to Swagger: https://api.digiseller.com/swagger/ui/index
   All methods are server-only (API routes / Server Components)
───────────────────────────────────────────────────────── */

const TIMEOUT_MS = 12_000;

async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, cache: 'no-store' });
  } finally {
    clearTimeout(id);
  }
}

/** Authenticated GET with automatic 401 retry */
async function authGet(path: string, params: Record<string, string> = {}): Promise<Response> {
  const token = await getDigiToken();
  const qs = new URLSearchParams({ ...params, token });
  const res = await apiFetch(`${DIGI_CONFIG.baseUrl}${path}?${qs}`);

  if (res.status === 401) {
    invalidateToken();
    const fresh = await getDigiToken();
    const qs2 = new URLSearchParams({ ...params, token: fresh });
    return apiFetch(`${DIGI_CONFIG.baseUrl}${path}?${qs2}`);
  }

  return res;
}

/** Authenticated POST with JSON body */
async function authPost<T>(path: string, body: T, extra: Record<string, string> = {}): Promise<Response> {
  const token = await getDigiToken();
  const qs = new URLSearchParams({ ...extra, token });
  const res = await apiFetch(`${DIGI_CONFIG.baseUrl}${path}?${qs}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body:    JSON.stringify(body),
  });

  if (res.status === 401) {
    invalidateToken();
    const fresh = await getDigiToken();
    const qs2 = new URLSearchParams({ ...extra, token: fresh });
    return apiFetch(`${DIGI_CONFIG.baseUrl}${path}?${qs2}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body:    JSON.stringify(body),
    });
  }

  return res;
}

/* ─────────────────────────────────────────────────────────
   Public API
───────────────────────────────────────────────────────── */

/**
 * POST /api/seller-goods?token={token}
 * Returns one page of the seller's product catalog.
 * Correct format discovered by testing against the real API:
 *   - token goes in query string
 *   - id_seller (not seller_id) goes in the JSON body
 */
export async function fetchSellerGoods(page = 1, rows = 50): Promise<{
  items: DigiOfferItem[];
  totalPages: number;
  totalGoods: number;
}> {
  const token = await getDigiToken();

  const res = await apiFetch(
    `${DIGI_CONFIG.baseUrl}/seller-goods?token=${encodeURIComponent(token)}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        id_seller:   Number(DIGI_CONFIG.sellerId),
        category_id: 0,
        rows,
        page,
        order:    'date',
        currency: 'USD',
        lang:     'ru-RU',
      }),
    },
  );

  if (res.status === 401) {
    invalidateToken();
    throw new Error('[Digiseller] seller-goods: token expired, retry');
  }

  if (!res.ok) throw new Error(`[Digiseller] seller-goods HTTP ${res.status}`);

  const data = await res.json() as DigiOffersResponse;

  if (data.retval !== 0 && data.retval !== undefined) {
    throw new Error(`[Digiseller] seller-goods API error retval=${data.retval}: ${(data as Record<string, unknown>).retdesc ?? ''}`);
  }

  const items = (data.rows ?? data.items ?? []) as DigiOfferItem[];
  return {
    items,
    totalPages: (data as Record<string, unknown>).pages as number ?? 1,
    totalGoods: (data as Record<string, unknown>).cnt_goods as number ?? items.length,
  };
}

/**
 * Fetch ALL seller goods across all pages
 */
export async function fetchAllOffers(): Promise<DigiOfferItem[]> {
  const PAGE_SIZE = Math.min(DIGI_CONFIG.pageSize, 100);
  const first = await fetchSellerGoods(1, PAGE_SIZE);

  if (first.totalPages <= 1) return first.items;

  const rest = await Promise.all(
    Array.from({ length: Math.min(first.totalPages - 1, 19) }, (_, i) =>
      fetchSellerGoods(i + 2, PAGE_SIZE).then(r => r.items),
    ),
  );

  return [...first.items, ...rest.flat()];
}

/**
 * GET /api/products/{product_id}/data
 * Returns detailed product info.
 * Uses q.* query param prefix as per Swagger.
 */
export async function fetchProductData(productId: number): Promise<DigiProductDataResponse> {
  const token = await getDigiToken();
  const qs = new URLSearchParams({
    'q.token':      token,
    'q.seller_id':  DIGI_CONFIG.sellerId,
    'q.currency':   'USD',
    'q.lang':       'ru-RU',
  });

  const res = await apiFetch(
    `${DIGI_CONFIG.baseUrl}/products/${productId}/data?${qs}`,
  );

  if (res.status === 401) {
    invalidateToken();
    const fresh = await getDigiToken();
    const qs2 = new URLSearchParams({
      'q.token':     fresh,
      'q.seller_id': DIGI_CONFIG.sellerId,
      'q.currency':  'USD',
      'q.lang':      'ru-RU',
    });
    const res2 = await apiFetch(
      `${DIGI_CONFIG.baseUrl}/products/${productId}/data?${qs2}`,
    );
    if (!res2.ok) throw new Error(`[Digiseller] product/data HTTP ${res2.status}`);
    return res2.json();
  }

  if (!res.ok) throw new Error(`[Digiseller] product/data HTTP ${res.status}`);
  return res.json();
}

/**
 * POST /api/products/list
 * Batch fetch product descriptions by IDs.
 */
export async function fetchProductList(ids: number[]): Promise<DigiProductDataResponse[]> {
  if (ids.length === 0) return [];
  const token = await getDigiToken();

  const body: DigiProductListRequest = { ids, lang: 'ru-RU', token };
  const res = await apiFetch(`${DIGI_CONFIG.baseUrl}/products/list`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body:    JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`[Digiseller] products/list HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.items ?? data.rows ?? []);
}

/**
 * POST /api/seller-sells/v2
 * Fetch recent sales / order history.
 */
export async function fetchSales(
  params: Partial<DigiSellerSalesRequest> = {},
): Promise<DigiSalesResponse> {
  const body: DigiSellerSalesRequest = {
    page:  1,
    count: 20,
    ...params,
  };

  const res = await authPost('/seller-sells/v2', body);
  if (!res.ok) throw new Error(`[Digiseller] seller-sells/v2 HTTP ${res.status}`);
  return res.json();
}

/** Build the Digiseller purchase page URL for a product */
export function buildPurchaseUrl(productId: number): string {
  return `${DIGI_CONFIG.storeUrl}/asp2/pay_wm.asp?id_d=${productId}`;
}

/** Build the Digiseller product info page URL */
export function buildProductInfoUrl(productId: number): string {
  return `${DIGI_CONFIG.storeUrl}/info/description.asp?ID=${productId}`;
}
