/* ─────────────────────────────────────────────────────────
   Timeout-bounded fetch — used by every supplier client.ts
   (lib/digiseller, lib/kinguin, lib/eneba, lib/g2a, lib/gamivo).
   Aborts after `timeoutMs` and never hits Next.js's data cache
   (suppliers manage their own TTL cache explicitly instead).
───────────────────────────────────────────────────────── */

const DEFAULT_TIMEOUT_MS = 12_000;

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, cache: 'no-store' });
  } finally {
    clearTimeout(id);
  }
}
