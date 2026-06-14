import { NextResponse } from 'next/server';
import { gameStore } from '@/lib/gameStore';
import type { ArcaneGame, CreateGamePayload } from '@/lib/arcaneApi';
import { requireAdmin } from '@/lib/apiGuard';

export const dynamic = 'force-dynamic';

const BACKEND   = process.env.ARCANE_API_URL ?? 'http://localhost:4000';
const SVC_TOKEN = process.env.ARCANE_SERVICE_TOKEN ?? '';

function backendHeaders(isAdmin = false) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (SVC_TOKEN && isAdmin) h['Authorization'] = `Bearer ${SVC_TOKEN}`;
  return h;
}

// ── GET /api/arcane/games ─────────────────────────────────────────────────────
// Tries arcane-api backend first; falls back to PostgreSQL via gameStore.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Always read from our DB first (arcane-api cron can deactivate games we want to show)
  const dbGames = await gameStore.getAll();

  try {
    const qs = new URLSearchParams({
      ...(searchParams.get('search')   ? { search:   searchParams.get('search')!   } : {}),
      ...(searchParams.get('genre')    ? { genre:    searchParams.get('genre')!    } : {}),
      ...(searchParams.get('platform') ? { platform: searchParams.get('platform')! } : {}),
      page:  searchParams.get('page')  ?? '1',
      limit: searchParams.get('limit') ?? '100',
    });

    const res = await fetch(`${BACKEND}/api/games?${qs}`, {
      headers: backendHeaders(),
      signal:  AbortSignal.timeout(3000),
    });

    if (!res.ok) throw new Error(`Backend ${res.status}`);
    const data = await res.json();

    // DB games take priority; backend fills in any extras not in DB
    const dbIds      = new Set(dbGames.map(g => g.id));
    const backendOnly = (data.data as ArcaneGame[]).filter(g => !dbIds.has(g.id));

    return NextResponse.json({
      success: true,
      data:    [...dbGames, ...backendOnly],
      pagination: {
        total: dbGames.length + backendOnly.length,
        page: 1, limit: 100,
        pages: Math.ceil((dbGames.length + backendOnly.length) / 100),
      },
    });

  } catch {
    // arcane-api offline — serve from DB only
    return NextResponse.json({
      success: true,
      source:  'db',
      data:    dbGames,
      pagination: { total: dbGames.length, page: 1, limit: 100, pages: Math.ceil(dbGames.length / 100) },
    });
  }
}

// ── POST /api/arcane/games ────────────────────────────────────────────────────
// Saves game to PostgreSQL (always) and best-effort syncs to arcane-api backend.

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body: CreateGamePayload = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ success: false, error: 'title is required' }, { status: 400 });
    }

    const id      = crypto.randomUUID();
    const slug    = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const priceUzs = body.priceUzs
      ?? (body.priceUsd != null ? Math.round(body.priceUsd * 12700 / 1000) * 1000 : null);

    // Trailer stored with prefix: "youtube:{id}" for YouTube, "video:{url}" for mp4
    const trailerEntry = body.trailer
      ? (body.trailer.startsWith('yt:')
          ? `youtube:${body.trailer.slice(3)}`
          : `video:${body.trailer}`)
      : null;

    const screenshotsArr = [
      ...(trailerEntry ? [trailerEntry] : []),
      ...(body.screenshots ?? []),
    ];

    const game: ArcaneGame = {
      id,
      externalId:  null,
      source:      body.source ?? 'manual',
      title:       body.title.trim(),
      slug,
      cover:       body.cover       ?? null,
      screenshots: screenshotsArr,
      description: body.description ?? null,
      genres:      body.genres      ?? [],
      platforms:   body.platforms   ?? [],
      rating:      body.rating      ?? null,
      priceUsd:    body.priceUsd    ?? null,
      priceUzs,
      releaseDate: null,
      developer:   body.developer   ?? null,
      publisher:   body.publisher   ?? null,
      isActive:    true,
      stockStore:  0,
      stockDrop:   0,
      syncedAt:    null,
      createdAt:   new Date().toISOString(),
    };

    // Save to PostgreSQL
    await gameStore.add(game);

    // Best-effort sync to arcane-api backend (fire-and-forget)
    if (SVC_TOKEN) {
      fetch(`${BACKEND}/api/games`, {
        method:  'POST',
        headers: backendHeaders(true),
        body:    JSON.stringify(body),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: game }, { status: 201 });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
