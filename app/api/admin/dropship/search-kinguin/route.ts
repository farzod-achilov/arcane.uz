import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuard';
import { isKinguinEnabled, searchProductsByName, cheapestInStockOffer } from '@/lib/kinguin';

/* ─────────────────────────────────────────────────────────
   GET /api/admin/dropship/search-kinguin?q=...

   Product-name search against Kinguin's merchant API (GET
   /v1/products?name=), for the admin "add dropship game" flow.
   Returns only what the picker needs: id, name, platform, cover,
   and the cheapest in-stock offer price (the same one an order
   would actually buy) — not the raw catalog shape.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 3) {
    return NextResponse.json({ ok: false, error: 'Минимум 3 символа' }, { status: 400 });
  }
  if (!isKinguinEnabled()) {
    return NextResponse.json({ ok: false, error: 'Kinguin не настроен (KINGUIN_MERCHANT_API_KEY)' });
  }

  try {
    const items = await searchProductsByName(q, 15);
    const results = items.map(item => {
      const offer = cheapestInStockOffer(item);
      return {
        kinguinId: item.kinguinId,
        name:      item.name,
        platform:  item.platform ?? null,
        cover:     item.images?.cover?.thumbnail ?? null,
        genres:    item.genres ?? [],
        costUsd:   offer?.price ?? item.price,
        inStock:   Boolean(offer),
      };
    });
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'search failed' }, { status: 502 });
  }
}
