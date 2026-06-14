import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { gameStore } from '@/lib/gameStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseAppId(url: string): string | null {
  const m = url.trim().match(/store\.steampowered\.com\/app\/(\d+)/);
  return m?.[1] ?? null;
}

function buildSlug(title: string, appId: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `steam-${appId}`;
}

function parseReleaseDate(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch { /* ignore */ }
  return null;
}

// ── GET — recent Steam imports ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { requireAdmin } = await import('@/lib/apiGuard');
  const guard = await requireAdmin();
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

  const rows = await prisma.games.findMany({
    where:   { source: 'steam' },
    orderBy: { createdAt: 'desc' },
    take:    limit,
    select: {
      id: true, title: true, slug: true, cover: true,
      genres: true, platforms: true, priceUzs: true,
      isActive: true, externalId: true, createdAt: true,
      developer: true, publisher: true, rating: true,
    },
  });

  return NextResponse.json({ success: true, data: rows });
}

// ── POST — import a single game from Steam URL ────────────────────────────────

export async function POST(req: NextRequest) {
  const { requireAdmin } = await import('@/lib/apiGuard');
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body  = await req.json() as {
      url:       string;
      priceUsd?: number | null;
      priceUzs?: number | null;
    };
    const { url } = body;

    if (!url?.trim()) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    const appId = parseAppId(url);
    if (!appId) {
      return NextResponse.json(
        { error: 'Неверная ссылка. Пример: https://store.steampowered.com/app/1245620/' },
        { status: 400 },
      );
    }

    // ── Duplicate check ──────────────────────────────────────────────────────
    const existing = await prisma.games.findFirst({
      where:  { externalId: appId, source: 'steam' },
      select: { id: true, title: true, slug: true, cover: true, createdAt: true },
    });

    if (existing) {
      return NextResponse.json({ success: true, status: 'duplicate', existing });
    }

    // ── Fetch from Steam ─────────────────────────────────────────────────────
    const steamRes = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=uz&l=english`,
      { cache: 'no-store', signal: AbortSignal.timeout(12_000) },
    );

    if (!steamRes.ok) {
      return NextResponse.json({ error: 'Steam API недоступен' }, { status: 502 });
    }

    const raw   = await steamRes.json();
    const entry = raw[appId];

    if (!entry?.success || !entry.data) {
      return NextResponse.json({ error: 'Игра не найдена в Steam' }, { status: 404 });
    }

    const d = entry.data;

    // ── Map data ─────────────────────────────────────────────────────────────
    const platforms: string[] = [
      d.platforms?.windows && 'PC',
      d.platforms?.mac     && 'Mac',
      d.platforms?.linux   && 'Linux',
    ].filter(Boolean) as string[];

    const screenshots: string[] = (d.screenshots ?? [])
      .map((s: { path_full: string }) => s.path_full)
      .slice(0, 10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const movies: Array<{ src: string; thumb: string }> = (d.movies ?? []).map((m: any) => {
      const src = m.hls_h264 ?? m.mp4?.max ?? m.webm?.max ?? null;
      return src ? { src, thumb: m.thumbnail ?? '' } : null;
    }).filter(Boolean);

    const videoEntries = movies.map(m => `video:${m.src}${m.thumb ? `|${m.thumb}` : ''}`);

    const steamPriceUsd =
      d.is_free                 ? 0
      : d.price_overview?.final ? d.price_overview.final / 100
      : null;

    const finalPriceUsd = body.priceUsd != null ? body.priceUsd : steamPriceUsd;
    const finalPriceUzs = body.priceUzs != null
      ? body.priceUzs
      : finalPriceUsd != null
        ? Math.round(finalPriceUsd * 12700 / 1000) * 1000
        : null;

    const genres: string[] = (d.genres ?? [])
      .map((g: { description: string }) => g.description)
      .slice(0, 6);

    // ── Unique slug ───────────────────────────────────────────────────────────
    let slug     = buildSlug(d.name, appId);
    const exists = await prisma.games.findUnique({ where: { slug }, select: { id: true } });
    if (exists) slug = `${slug}-${appId}`;

    // ── Save to PostgreSQL ────────────────────────────────────────────────────
    const id          = crypto.randomUUID();
    const releaseDate = parseReleaseDate(d.release_date?.date);

    await gameStore.add({
      id,
      externalId:  appId,
      source:      'steam',
      title:       d.name,
      slug,
      cover:       d.header_image ?? null,
      screenshots: [...videoEntries, ...screenshots],
      description: d.short_description ?? null,
      genres,
      platforms,
      rating:      d.metacritic?.score ?? null,
      priceUsd:    finalPriceUsd,
      priceUzs:    finalPriceUzs,
      releaseDate,
      developer:   d.developers?.[0]  ?? null,
      publisher:   d.publishers?.[0]  ?? null,
      isActive:    true,
      stockStore:  0,
      stockDrop:   0,
      syncedAt:    null,
      createdAt:   new Date().toISOString(),
    });

    // ── Return preview-safe data ──────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      status:  'imported',
      game: {
        id, appId: parseInt(appId), slug, title: d.name,
        cover:       d.header_image ?? null,
        description: d.short_description ?? null,
        genres, platforms,
        priceUsd:    finalPriceUsd,
        priceUzs:    finalPriceUzs,
        rating:      d.metacritic?.score ?? null,
        developer:   d.developers?.[0]  ?? null,
        publisher:   d.publishers?.[0]  ?? null,
        releaseDate,
        screenshots: [...videoEntries, ...screenshots],
        movies,
      },
    }, { status: 201 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[steam/import]', msg);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
