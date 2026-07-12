import { CRYPTOBOT_CONFIG } from './config';

/* ─────────────────────────────────────────────────────────
   Crypto Pay API client — createInvoice.
   https://help.send.tg/en/articles/10279948-crypto-pay-api
───────────────────────────────────────────────────────── */

export interface CreateInvoiceParams {
  /** Our deposit_requests.id — round-trips back in the webhook's payload.payload */
  orderId:    string;
  amountUsdt: number;
  description?: string;
  paidBtnUrl?: string;
  expiresInSec?: number;
}

export type CreateInvoiceResult = {
  ok: true;
  invoiceId: number;
  payUrl: string;
} | {
  ok: false;
  error: string;
};

export async function createInvoice(params: CreateInvoiceParams): Promise<CreateInvoiceResult> {
  const body: Record<string, string | number | boolean> = {
    currency_type: 'crypto',
    asset:         CRYPTOBOT_CONFIG.asset,
    amount:        params.amountUsdt.toFixed(2),
    payload:       params.orderId,
    description:   params.description ?? 'Пополнение баланса ARCANE.UZ',
    allow_comments: false,
    allow_anonymous: true,
    ...(params.paidBtnUrl ? { paid_btn_name: 'callback', paid_btn_url: params.paidBtnUrl } : {}),
    ...(params.expiresInSec ? { expires_in: params.expiresInSec } : {}),
  };

  const res = await fetch(`${CRYPTOBOT_CONFIG.apiUrl}createInvoice`, {
    method:  'POST',
    headers: {
      'Content-Type':         'application/json',
      'Crypto-Pay-API-Token': CRYPTOBOT_CONFIG.token,
    },
    body:   JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });

  const data = await res.json().catch(() => null) as
    | { ok: true; result: { invoice_id: number; bot_invoice_url: string } }
    | { ok: false; error?: { code?: number; name?: string } }
    | null;

  if (!data) return { ok: false, error: `Crypto Pay: invalid response, HTTP ${res.status}` };
  if (!data.ok) return { ok: false, error: data.error?.name ?? `Crypto Pay error ${data.error?.code ?? res.status}` };

  return { ok: true, invoiceId: data.result.invoice_id, payUrl: data.result.bot_invoice_url };
}
