import { NextResponse } from 'next/server';
import { requireAdminOrSyncSecret } from '@/lib/apiGuard';

/* ─────────────────────────────────────────────────────────
   GET /api/admin/dropship/search-steam?q=...

   Steam's public storesearch endpoint (no auth, no key) — used to
   find the game's Steam listing for price comparison ("цена в
   Steam" shown next to Kinguin's supplier cost).

   cc=uz — Steam regional-prices per country, and Uzbekistan's is
   notably cheaper than the US default (confirmed live: Terraria
   $9.99 at cc=us vs $6.29 at cc=uz) — our actual customers are in
   Uzbekistan, so that's the number a "vs Steam" comparison should
   be honest against, not what a US shopper would pay. Steam still
   returns this in USD regardless of cc (confirmed: "currency":"USD"
   at cc=uz too), so nothing downstream needs to change — this matches
   the cc=uz already used by app/api/admin/market-prices/route.ts.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

interface StoreSearchItem {
  id:    number;
  name:  string;
  tiny_image?: string;
  price?: { final: number; initial: number; discount_percent: number };
}

export async function GET(req: Request) {
  const guard = await requireAdminOrSyncSecret(req);
  if (guard) return guard;

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 3) {
    return NextResponse.json({ ok: false, error: 'Минимум 3 символа' }, { status: 400 });
  }

  try {
    const qs  = new URLSearchParams({ term: q, l: 'english', cc: 'uz' });
    const res = await fetch(`https://store.steampowered.com/api/storesearch/?${qs}`, {
      cache: 'no-store', signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Steam search HTTP ${res.status}`);

    const data = await res.json() as { total: number; items?: StoreSearchItem[] };
    const results = (data.items ?? []).slice(0, 10).map(item => ({
      appId:    item.id,
      name:     item.name,
      cover:    item.tiny_image ?? null,
      priceUsd: item.price ? item.price.final / 100 : null, // null = free or region-locked
    }));

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'search failed' }, { status: 502 });
  }
}
