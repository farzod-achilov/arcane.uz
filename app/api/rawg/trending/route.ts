import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/* ─────────────────────────────────────────────────────────
   GET /api/rawg/trending?days=60&limit=20

   "What's popular right now" — Kinguin's own API has no sales-rank/
   bestseller data at all (checked: /v1/products only takes a free-text
   `name` filter, no sortBy, no popularity field on the product shape —
   confirmed against the reference client). RAWG doesn't have real
   sales data either, but it does track `added` (how many users put a
   game on a list) — the closest real, honest proxy for "trending" we
   actually have access to.

   A literal "this week" window (dates=<7 days ago>,<today>) is too
   narrow — mostly returns obscure day-one releases with near-zero
   `added` counts (verified live). Defaulting to a 60-day window
   instead surfaces recent releases that have real traction, which is
   what "trending" means in practice for a game store.
───────────────────────────────────────────────────────── */

export async function GET(request: Request) {
  const { requireAdminOrSyncSecret } = await import('@/lib/apiGuard');
  const guard = await requireAdminOrSyncSecret(request);
  if (guard) return guard;

  const key = process.env.RAWG_API_KEY;
  if (!key) {
    return NextResponse.json({ success: false, error: 'RAWG_API_KEY not configured', data: [] });
  }

  const { searchParams } = new URL(request.url);
  const days  = Math.min(180, Math.max(7, parseInt(searchParams.get('days') ?? '60') || 60));
  const limit = Math.min(40, Math.max(1, parseInt(searchParams.get('limit') ?? '20') || 20));

  const today = new Date();
  const from  = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
  const fmt   = (d: Date) => d.toISOString().slice(0, 10);

  try {
    const url = `https://api.rawg.io/api/games?key=${key}&dates=${fmt(from)},${fmt(today)}&ordering=-added&page_size=${limit}`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(7000) });
    if (!res.ok) throw new Error(`RAWG ${res.status}`);
    const json = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (json.results ?? [])
      .filter((g: any) => (g.added ?? 0) > 0)
      .map((g: any) => ({
        rawgId:      g.id,
        title:       g.name,
        cover:       g.background_image ?? null,
        releaseDate: g.released ?? null,
        added:       g.added ?? 0,
      }));

    return NextResponse.json({ success: true, data, windowDays: days });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err), data: [] }, { status: 502 });
  }
}
