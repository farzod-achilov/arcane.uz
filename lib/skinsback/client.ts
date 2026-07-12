import { SKINSBACK_CONFIG } from './config';
import { buildSignature } from './signature';

/* ─────────────────────────────────────────────────────────
   SkinsBack API client. https://skinsback.com/docs/api/v1/createorder/

   POST https://skinsback.com/api.php, method=create. Auth via
   X-CLIENT-ID/X-CLIENT-SECRET headers (simpler than the sign+shopid
   query-param alternative also supported by the API — no shopid to
   track separately).
───────────────────────────────────────────────────────── */

export interface CreateOrderParams {
  orderId:     string;
  amountUsd:   number;
  successUrl:  string;
  failUrl:     string;
  resultUrl:   string;
  steamId?:    string;
}

export type CreateOrderResult = {
  ok: true;
  url: string;
  transactionId: number;
} | {
  ok: false;
  errorCode?: number;
  error: string;
}

export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const body: Record<string, string> = {
    method:     'create',
    order_id:   params.orderId,
    currency:   'USD',
    // min_amount = max_amount pins the deposit to an exact value —
    // same "transfer exactly this much" pattern as the P2P card flow,
    // just enforced by SkinsBack's own checkout instead of a unique sum.
    min_amount: params.amountUsd.toFixed(2),
    max_amount: params.amountUsd.toFixed(2),
    success_url: params.successUrl,
    fail_url:    params.failUrl,
    result_url:  params.resultUrl,
    ...(params.steamId ? { steam_id: params.steamId } : {}),
  };

  const res = await fetch(SKINSBACK_CONFIG.apiUrl, {
    method:  'POST',
    headers: {
      'Content-Type':    'application/x-www-form-urlencoded',
      'X-CLIENT-ID':     SKINSBACK_CONFIG.clientId,
      'X-CLIENT-SECRET': SKINSBACK_CONFIG.clientSecret,
    },
    body:   new URLSearchParams(body).toString(),
    signal: AbortSignal.timeout(10_000),
  });

  const data = await res.json().catch(() => null) as
    | { status: 'success'; url: string; transaction_id: number }
    | { status: 'error'; error_code?: number; error_message?: string }
    | null;

  if (!data) return { ok: false, error: `SkinsBack: invalid response, HTTP ${res.status}` };
  if (data.status !== 'success') {
    return { ok: false, errorCode: data.error_code, error: data.error_message ?? 'unknown error' };
  }
  return { ok: true, url: data.url, transactionId: data.transaction_id };
}

/** For debugging/manual API calls that use the sign+shopid auth path instead of headers */
export { buildSignature };
