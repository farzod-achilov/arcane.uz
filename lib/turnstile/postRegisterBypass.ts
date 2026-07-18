import crypto from 'crypto';
import { TtlCache } from '@/lib/shared/ttlCache';

/* ─────────────────────────────────────────────────────────
   register() in lib/userContext.tsx signs the new user in immediately
   after POST /api/auth/register succeeds, reusing the SAME credentials
   provider that the login page uses (see lib/auth.ts) — which, once
   Turnstile is enabled, demands a valid token in authorize(). But a
   Turnstile token is single-use and was already consumed verifying the
   registration itself, so that auto sign-in can't present a fresh one.

   Fix: /api/auth/register issues a short-lived, single-use bypass token
   tied to that exact email right after its own (real, freshly-verified)
   Turnstile check passes. The client forwards it to the immediate
   auto-login instead of a Turnstile token; authorize() accepts it in
   place of re-verifying Turnstile. A bot still can't reach this path
   without first clearing Turnstile on /api/auth/register.
───────────────────────────────────────────────────────── */

const cache = new TtlCache();
const TTL_SECONDS = 60;
const PREFIX = 'bypass:';

export function issuePostRegisterBypass(email: string): string {
  const token = crypto.randomBytes(24).toString('hex');
  cache.set(PREFIX + token, email, TTL_SECONDS);
  return token;
}

export function consumePostRegisterBypass(token: string, email: string): boolean {
  const key = PREFIX + token;
  const storedEmail = cache.get<string>(key);
  if (!storedEmail || storedEmail !== email) return false;
  cache.delete(key);
  return true;
}
