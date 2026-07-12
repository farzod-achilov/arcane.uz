import { NextResponse } from 'next/server';
import { requireAdminOrSyncSecret } from '@/lib/apiGuard';
import { isKinguinEnabled, searchProductsByName } from '@/lib/kinguin';
import { normalizeSearchResults } from '@/lib/kinguin/basePicker';
import { isBlockedInUzbekistan } from '@/lib/kinguin/productMapper';
import { getEurUsdRate } from '@/lib/shared/fxRate';

/* ─────────────────────────────────────────────────────────
   GET /api/admin/dropship/search-kinguin?q=...

   Product-name search against Kinguin's merchant API (GET
   /v1/products?name=), for the admin "add dropship game" flow.
   Returns only what the picker needs: id, name, platform, cover,
   and the cheapest in-stock offer price (the same one an order
   would actually buy) — not the raw catalog shape.

   Region-locked products (see isBlockedInUzbekistan — caught live
   once already with Hollow Knight EU) are dropped from the results
   entirely rather than shown with a warning: an admin clicking
   through a warning is exactly how that one shipped in the first
   place, so the safer default is to never offer the pick at all.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const guard = await requireAdminOrSyncSecret(req);
  if (guard) return guard;

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 3) {
    return NextResponse.json({ ok: false, error: 'Минимум 3 символа' }, { status: 400 });
  }
  if (!isKinguinEnabled()) {
    return NextResponse.json({ ok: false, error: 'Kinguin не настроен (KINGUIN_MERCHANT_API_KEY)' });
  }

  try {
    const [items, eurUsdRate] = await Promise.all([searchProductsByName(q, 15), getEurUsdRate()]);
    const blockedCount = items.filter(isBlockedInUzbekistan).length;
    const results = normalizeSearchResults(items, eurUsdRate);
    return NextResponse.json({ ok: true, results, blockedCount });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'search failed' }, { status: 502 });
  }
}
