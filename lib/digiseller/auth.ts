import crypto from 'crypto';
import { DIGI_CONFIG } from './config';
import { digiCache, CK } from './cache';
import type { DigiLoginResponse, DigiToken } from './types';

/* ─────────────────────────────────────────────────────────
   Digiseller v3 authentication
   POST /api/apilogin
   sign = SHA256( SHA256(api_key) + timestamp )
───────────────────────────────────────────────────────── */

function buildSign(apiKey: string, timestamp: number): string {
  // Digiseller sign formula: SHA256(api_key + timestamp)
  return crypto.createHash('sha256').update(apiKey + String(timestamp)).digest('hex');
}

export async function getDigiToken(): Promise<string> {
  const cached = digiCache.get<DigiToken>(CK.token());
  if (cached && Date.now() < cached.expiresAt) return cached.value;

  const timestamp = Math.floor(Date.now() / 1000);
  const sign = buildSign(DIGI_CONFIG.apiKey, timestamp);

  const res = await fetch(`${DIGI_CONFIG.baseUrl}/apilogin`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      seller_id: Number(DIGI_CONFIG.sellerId),
      timestamp,
      sign,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`[Digiseller] Auth HTTP ${res.status}: ${res.statusText}`);
  }

  const data: DigiLoginResponse = await res.json();

  if (data.retval !== 0) {
    const msg = data.endesc ?? data.desc ?? data.retdesc ?? 'unknown';
    throw new Error(`[Digiseller] Auth failed (retval=${data.retval}): ${msg}`);
  }

  if (!data.token) {
    throw new Error('[Digiseller] Auth succeeded but no token in response');
  }

  const ttl = DIGI_CONFIG.cacheTtl.token;
  const tokenEntry: DigiToken = {
    value:     data.token,
    expiresAt: Date.now() + ttl * 1000,
  };

  digiCache.set(CK.token(), tokenEntry, ttl);
  return tokenEntry.value;
}

/** Invalidate cached token — call after 401 response */
export function invalidateToken(): void {
  digiCache.delete(CK.token());
}
