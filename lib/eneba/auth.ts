import { ENEBA_CONFIG } from './config';
import { enebaCache, CK } from './cache';
import { getOAuth2Token, invalidateOAuth2Token } from '@/lib/shared/oauth2ClientCredentials';

/* ─────────────────────────────────────────────────────────
   Eneba merchant authentication — OAuth2 client_credentials.
   Verified against https://api.eneba.com/documentation/guide/getting-started/
   Token endpoint depends on ENEBA_CONFIG.env (sandbox|production).
───────────────────────────────────────────────────────── */

export async function getEnebaToken(): Promise<string> {
  return getOAuth2Token({
    tokenUrl: ENEBA_CONFIG.tokenUrl,
    clientId: ENEBA_CONFIG.authId,
    clientSecret: ENEBA_CONFIG.authSecret,
    cache: enebaCache,
    cacheKey: CK.token(),
    fallbackTtlSeconds: ENEBA_CONFIG.cacheTtl.tokenFallback,
  });
}

/** Invalidate cached token — call after 401 response */
export function invalidateToken(): void {
  invalidateOAuth2Token(enebaCache, CK.token());
}
