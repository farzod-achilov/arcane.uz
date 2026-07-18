import { fetchWithTimeout } from '@/lib/shared/fetchWithTimeout';
import { isTurnstileEnabled } from './config';

/* ─────────────────────────────────────────────────────────
   Server-side verification of a Turnstile response token.
   https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

   Tokens are single-use — Cloudflare rejects a second siteverify call
   with the same token, so callers must verify exactly once per token
   and never re-check it "just in case".
───────────────────────────────────────────────────────── */

export async function verifyTurnstileToken(token: string | undefined | null, remoteIp?: string): Promise<boolean> {
  if (!isTurnstileEnabled()) return true; // not configured — don't block registration/login locally
  if (!token) return false;

  const body = new URLSearchParams({
    secret:   process.env.TURNSTILE_SECRET_KEY!,
    response: token,
  });
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const res = await fetchWithTimeout('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    }, 8000);
    if (!res.ok) return false;
    const data = await res.json() as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error('[turnstile] verify failed', err instanceof Error ? err.message : err);
    return false;
  }
}
