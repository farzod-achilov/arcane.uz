import { UnverifiedSupplierError } from '@/lib/shared/unverifiedSupplierError';

/* ─────────────────────────────────────────────────────────
   Gamivo auth — intentionally unimplemented.
   Gamivo's own public API docs are titled "under development",
   and real wholesale/dropship access is gated behind a separate,
   manually-approved, IP-whitelisted "Wholesale API" — not the
   self-serve basic API key. Rather than guess, this always throws.
   lib/gamivo/gamivoService.ts catches this and behaves exactly
   like "not configured" (mock fallback).

   To activate: confirm the Wholesale API's real auth scheme once
   approved for access, then implement this properly (see
   lib/kinguin/auth.ts / lib/eneba/auth.ts for the target shape).
───────────────────────────────────────────────────────── */

export async function getGamivoToken(): Promise<string> {
  throw new UnverifiedSupplierError('Gamivo', 'public API "under development"; Wholesale API requires manual approval — see lib/gamivo/config.ts header comment');
}
