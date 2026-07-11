import { fetchWithTimeout } from './fetchWithTimeout';
import type { TtlCache } from './ttlCache';

/* ─────────────────────────────────────────────────────────
   Generic OAuth2 client_credentials token fetcher.

   Used by suppliers whose merchant/ordering API is verified to use
   this exact flow — currently Kinguin (id.kinguin.net/auth/token)
   and Eneba (user.eneba.com/oauth/token). Both are standard
   `grant_type=client_credentials` form-POSTs returning a bearer
   token with an `expires_in` (seconds).

   G2A and Gamivo do NOT use this helper — their merchant auth
   scheme could not be verified against live docs, so their
   auth.ts files throw UnverifiedSupplierError instead of guessing.
───────────────────────────────────────────────────────── */

interface OAuth2TokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number; // seconds
}

export interface GetOAuth2TokenParams {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  cache: TtlCache;
  cacheKey: string;
  /** Used when the token response doesn't include expires_in */
  fallbackTtlSeconds?: number;
  /** Refresh a bit before the real expiry to avoid racing a 401 */
  ttlSafetyMarginSeconds?: number;
}

export async function getOAuth2Token(params: GetOAuth2TokenParams): Promise<string> {
  const cached = params.cache.get<string>(params.cacheKey);
  if (cached) return cached;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: params.clientId,
    client_secret: params.clientSecret,
  });

  const res = await fetchWithTimeout(params.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`[OAuth2] Token request to ${params.tokenUrl} failed: HTTP ${res.status}`);
  }

  const data: OAuth2TokenResponse = await res.json();
  if (!data.access_token) {
    throw new Error(`[OAuth2] Token response from ${params.tokenUrl} missing access_token`);
  }

  const margin = params.ttlSafetyMarginSeconds ?? 60;
  const ttl = Math.max((data.expires_in ?? params.fallbackTtlSeconds ?? 3600) - margin, 30);

  params.cache.set(params.cacheKey, data.access_token, ttl);
  return data.access_token;
}

/** Invalidate a cached OAuth2 token — call after a 401 response */
export function invalidateOAuth2Token(cache: TtlCache, cacheKey: string): void {
  cache.delete(cacheKey);
}
