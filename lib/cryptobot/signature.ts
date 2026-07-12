import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { CRYPTOBOT_CONFIG } from './config';

/* ─────────────────────────────────────────────────────────
   Crypto Pay webhook signature.
   https://help.send.tg/en/articles/10279948-crypto-pay-api

   "hexadecimal representation of HMAC-SHA-256 signature used to
   sign the entire request body (unparsed JSON string) with a
   secret key that is SHA256 hash of your app's token."

   Unlike SkinsBack (signs reconstructed key:value pairs), this
   signs the RAW request body bytes — the caller must verify
   against req.text() BEFORE JSON.parse, since re-serializing would
   not reproduce Crypto Pay's exact byte-for-byte JSON formatting.
───────────────────────────────────────────────────────── */

export function verifyWebhookSignature(
  rawBody: string,
  providedSignature: string,
  token = CRYPTOBOT_CONFIG.token,
): boolean {
  if (!providedSignature || !token) return false;
  const secret   = createHash('sha256').update(token).digest();
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');

  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(providedSignature, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
