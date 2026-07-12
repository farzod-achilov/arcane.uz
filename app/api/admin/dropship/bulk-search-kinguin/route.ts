import { NextResponse } from 'next/server';
import { requireAdminOrSyncSecret } from '@/lib/apiGuard';
import { isKinguinEnabled, searchProductsByName } from '@/lib/kinguin';
import { normalizeSearchResults, pickBestBaseGameOffer, type KinguinSearchResult } from '@/lib/kinguin/basePicker';
import { getEurUsdRate } from '@/lib/shared/fxRate';

/* ─────────────────────────────────────────────────────────
   POST /api/admin/dropship/bulk-search-kinguin
   Body: { titles: string[] }

   Real "search many different games at once" for the bulk-add
   flow — distinct from GET search-kinguin, which searches ONE
   query and lets a human pick among its results. Here each title
   is searched separately server-side and the best clean Steam
   base-game offer is auto-picked (see lib/kinguin/basePicker.ts);
   the admin still reviews/can override every pick before creating
   anything — this only removes the per-title search round-trip.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

interface Body { titles?: unknown }

interface TitleResult {
  query:     string;
  picked:    KinguinSearchResult | null;
  candidates: KinguinSearchResult[];
  reason?:   string;
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function POST(req: Request) {
  const guard = await requireAdminOrSyncSecret(req);
  if (guard) return guard;

  if (!isKinguinEnabled()) {
    return NextResponse.json({ ok: false, error: 'Kinguin не настроен (KINGUIN_MERCHANT_API_KEY)' });
  }

  const body = await req.json().catch(() => ({})) as Body;
  const titles = Array.isArray(body.titles)
    ? Array.from(new Set(body.titles.filter((t): t is string => typeof t === 'string' && t.trim().length >= 3).map(t => t.trim())))
    : [];

  if (titles.length === 0) {
    return NextResponse.json({ ok: false, error: 'Нужен хотя бы один тайтл (от 3 символов)' }, { status: 400 });
  }
  if (titles.length > 25) {
    return NextResponse.json({ ok: false, error: 'Максимум 25 тайтлов за раз' }, { status: 400 });
  }

  const results: TitleResult[] = [];
  const eurUsdRate = await getEurUsdRate();

  for (const query of titles) {
    try {
      const items = await searchProductsByName(query, 15);
      const candidates = normalizeSearchResults(items, eurUsdRate);
      const picked = pickBestBaseGameOffer(candidates, query);
      results.push({
        query, picked, candidates,
        reason: picked ? undefined : (candidates.length ? 'Нет чистого Steam-оффера базовой игры в наличии' : 'Ничего не найдено на Kinguin'),
      });
    } catch (err) {
      results.push({ query, picked: null, candidates: [], reason: err instanceof Error ? err.message : 'Ошибка запроса' });
    }
    await delay(300); // не долбить Kinguin API подряд без пауз
  }

  return NextResponse.json({ ok: true, results });
}
