import { createHmac, timingSafeEqual } from 'crypto';
import { SKINSBACK_CONFIG } from './config';

/* ─────────────────────────────────────────────────────────
   SkinsBack request/webhook signing.
   https://skinsback.com/docs/api/v1/signature/

   "The signature is formed by concatenating all parameters in the
   key:value; form and converting it to sha1 hmac signed with Client
   Secret." — params sorted alphabetically by key, `sign` itself and
   any array/object values excluded, joined as `key:value;` per pair.

   Used both to sign OUTGOING createorder requests and to verify
   INCOMING Result-URL webhooks — same algorithm both directions.
───────────────────────────────────────────────────────── */

export function buildSignature(params: Record<string, unknown>, secret = SKINSBACK_CONFIG.clientSecret): string {
  const keys = Object.keys(params)
    .filter(k => k !== 'sign')
    .filter(k => {
      const v = params[k];
      return v !== undefined && v !== null && typeof v !== 'object';
    })
    .sort();

  const base = keys.map(k => `${k}:${params[k]};`).join('');
  return createHmac('sha1', secret).update(base).digest('hex');
}

/** Constant-time comparison — webhook signature guards real money credits */
export function verifySignature(
  params: Record<string, unknown>,
  providedSign: string,
  secret = SKINSBACK_CONFIG.clientSecret,
): boolean {
  if (!providedSign) return false;
  const expected = buildSignature(params, secret);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(providedSign, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
