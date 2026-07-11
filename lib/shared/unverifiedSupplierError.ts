/* ─────────────────────────────────────────────────────────
   Thrown by a supplier's auth.ts when its merchant/ordering
   API auth scheme could not be confirmed against live docs
   (currently: G2A, Gamivo). Callers treat this identically to
   "not configured" — mock fallback, no network call attempted —
   rather than guessing an endpoint shape that might be wrong.
───────────────────────────────────────────────────────── */

export class UnverifiedSupplierError extends Error {
  constructor(supplier: string, detail?: string) {
    super(
      `[${supplier}] Merchant API auth scheme not yet verified against official docs` +
      (detail ? ` — ${detail}` : '') +
      '. Confirm the real endpoint/auth shape before enabling this integration.',
    );
    this.name = 'UnverifiedSupplierError';
  }
}
