import { UnverifiedSupplierError } from '@/lib/shared/unverifiedSupplierError';

/* ─────────────────────────────────────────────────────────
   G2A auth — intentionally unimplemented.
   G2A's Integration API docs could not be verified live (empty/
   JS-rendered pages on repeated fetch). Rather than guess an
   auth scheme that might be wrong — or worse, silently hit an
   unintended endpoint — this always throws. lib/g2a/g2aService.ts
   catches this and behaves exactly like "not configured" (mock
   fallback), so nothing here ever makes a network call.

   To activate: confirm the real auth scheme against G2A's dev
   portal or a live dev account, then implement this properly
   (see lib/kinguin/auth.ts / lib/eneba/auth.ts for the shape
   this should end up in once verified).
───────────────────────────────────────────────────────── */

export async function getG2aToken(): Promise<string> {
  throw new UnverifiedSupplierError('G2A', 'auth docs unreachable — see lib/g2a/config.ts header comment');
}
