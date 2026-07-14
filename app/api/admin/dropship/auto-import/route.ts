import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSyncSecret } from '@/lib/apiGuard';
import { isKinguinEnabled, searchProductsByName } from '@/lib/kinguin';
import { normalizeSearchResults, pickBestBaseGameOffer } from '@/lib/kinguin/basePicker';
import { getEurUsdRate } from '@/lib/shared/fxRate';
import { createDropshipGame } from '@/lib/dropship/createDropshipGame';
import { notifyAdminBulkAddSummary } from '@/lib/adminTelegram';

/* ─────────────────────────────────────────────────────────
   POST /api/admin/dropship/auto-import

   Unattended version of the admin's "быстрое добавление" — meant to
   be hit once a day by an arcane-api cron job (see
   arcane-api/src/jobs/suppliers.cron.ts's dropshipAutoImportJob),
   not clicked by a human. Pulls RAWG's trending list, picks a clean
   Steam base-game offer on Kinguin for each, and — UNLIKE the admin
   quick-add path — skips (does not create) any title with no RAWG
   match at all, since nobody is reviewing the result.

   DAILY_LIMIT counts ALL kinguin-dropship games created today
   (dropshipSource='kinguin', by createdAt), not just ones this job
   created — a manual admin bulk-add earlier the same day counts
   against the same cap. Deliberately simple: no separate "auto vs
   manual" tracking column, relies on this route being scheduled at
   most once a day (see the cron comment) so the count is meaningful.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

const DAILY_LIMIT   = 10;
const POOL_DAYS      = 60;
const POOL_SIZE       = 40;  // fetch more candidates than DAILY_LIMIT — many will be
                              // duplicates already in the catalog or have no clean offer

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

interface TrendingCandidate { rawgId: number; title: string }

async function fetchTrendingCandidates(key: string): Promise<TrendingCandidate[]> {
  const today = new Date();
  const from  = new Date(today.getTime() - POOL_DAYS * 24 * 60 * 60 * 1000);
  const fmt   = (d: Date) => d.toISOString().slice(0, 10);
  try {
    const url = `https://api.rawg.io/api/games?key=${key}&dates=${fmt(from)},${fmt(today)}&ordering=-added&page_size=${POOL_SIZE}`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(7000) });
    if (!res.ok) return [];
    const json = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (json.results ?? [])
      .filter((g: any) => (g.added ?? 0) > 0)
      .map((g: any) => ({ rawgId: g.id as number, title: g.name as string }));
  } catch {
    return [];
  }
}

interface RawgFullDetail {
  rawgId: number; title: string; cover: string | null; screenshots: string[];
  genres: string[]; platforms: string[]; rating: number | null;
  releaseDate: string | null; description: string | null;
}

async function fetchRawgFullDetail(rawgId: number, key: string): Promise<RawgFullDetail | null> {
  try {
    const res = await fetch(`https://api.rawg.io/api/games/${rawgId}?key=${key}`, { cache: 'no-store', signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const g = await res.json();
    return {
      rawgId,
      title:       g.name as string,
      cover:       g.background_image ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      screenshots: (g.short_screenshots ?? []).map((s: any) => s.image).filter(Boolean).slice(0, 8),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      genres:      (g.genres ?? []).map((x: any) => x.name),
      platforms:   Array.from(new Set(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (g.platforms ?? []).map((p: any) => p.platform.name as string),
      )),
      rating:      g.metacritic ?? (g.rating ? Math.round(g.rating * 20) : null),
      releaseDate: g.released ?? null,
      description: g.description_raw || g.description || null,
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const guard = await requireAdminOrSyncSecret(req);
  if (guard) return guard;

  if (!isKinguinEnabled()) {
    return NextResponse.json({ ok: false, error: 'Kinguin не настроен (KINGUIN_MERCHANT_API_KEY)' });
  }
  const rawgKey = process.env.RAWG_API_KEY;
  if (!rawgKey) {
    return NextResponse.json({ ok: false, error: 'RAWG_API_KEY не настроен' });
  }

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const alreadyToday = await prisma.games.count({
    where: { dropshipSource: 'kinguin', createdAt: { gte: startOfDay } },
  });
  const remaining = DAILY_LIMIT - alreadyToday;
  if (remaining <= 0) {
    return NextResponse.json({ ok: true, created: 0, duplicates: 0, skippedNoRawg: 0, failed: 0, reason: 'Дневной лимит уже исчерпан' });
  }

  const candidates = await fetchTrendingCandidates(rawgKey);
  const eurUsdRate = await getEurUsdRate();

  let created = 0, duplicates = 0, skippedNoRawg = 0, failed = 0;
  const createdTitles: string[] = [];

  for (const candidate of candidates) {
    if (created >= remaining) break;

    let picked;
    try {
      const items = await searchProductsByName(candidate.title, 15);
      const kinguinCandidates = normalizeSearchResults(items, eurUsdRate);
      picked = pickBestBaseGameOffer(kinguinCandidates, candidate.title);
    } catch {
      failed++;
      await delay(300);
      continue;
    }
    if (!picked) { await delay(300); continue; } // no clean Steam offer — quietly skip, not a failure

    const rawgDetail = await fetchRawgFullDetail(candidate.rawgId, rawgKey);
    if (!rawgDetail) { skippedNoRawg++; await delay(300); continue; }

    const result = await createDropshipGame({
      title:      picked.name,
      kinguinId:  picked.kinguinId,
      costUsd:    picked.costUsd,
      cover:      picked.cover,
      genres:     picked.genres,
      platforms:  picked.platform ? [picked.platform] : ['PC'],
      strategy:   'GLOBAL',
      rawgId:          rawgDetail.rawgId,
      rawgTitle:       rawgDetail.title,
      rawgCover:       rawgDetail.cover,
      rawgScreenshots: rawgDetail.screenshots,
      rawgGenres:      rawgDetail.genres,
      rawgPlatforms:   rawgDetail.platforms,
      rawgRating:      rawgDetail.rating,
      rawgReleaseDate: rawgDetail.releaseDate,
      rawgDescription: rawgDetail.description,
    });

    if (result.ok) {
      created++;
      createdTitles.push(result.game.title);
    } else if (result.status === 409) {
      duplicates++;
    } else {
      failed++;
    }

    await delay(300); // не долбить Kinguin API подряд без пауз
  }

  if (created + duplicates + failed > 0) {
    await notifyAdminBulkAddSummary({ created, duplicates, failed, titles: createdTitles });
  }

  return NextResponse.json({ ok: true, created, duplicates, skippedNoRawg, failed });
}
