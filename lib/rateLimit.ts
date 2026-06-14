import { NextRequest, NextResponse } from 'next/server';

interface Bucket { count: number; resetAt: number }

// Module-level store — persists across requests on the same server instance
const store = new Map<string, Bucket>();

// Prune expired entries every 5 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  store.forEach((bucket, key) => {
    if (bucket.resetAt < now) store.delete(key);
  });
}, 5 * 60 * 1000);

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

interface Options {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSec: number;
  /** Key to rate-limit on — defaults to caller's IP */
  key?: string;
}

/**
 * Returns a 429 NextResponse if the caller exceeds the limit, otherwise null.
 *
 * Usage:
 *   const limit = await rateLimit(req, { limit: 5, windowSec: 900 });
 *   if (limit) return limit;
 */
export function rateLimit(req: NextRequest, opts: Options): NextResponse | null {
  const key    = opts.key ?? `${req.nextUrl.pathname}:${getIp(req)}`;
  const now    = Date.now();
  const window = opts.windowSec * 1000;

  const bucket = store.get(key);

  if (!bucket || bucket.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + window });
    return null;
  }

  if (bucket.count >= opts.limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      { error: 'Слишком много запросов. Попробуйте позже.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      },
    );
  }

  bucket.count += 1;
  return null;
}
