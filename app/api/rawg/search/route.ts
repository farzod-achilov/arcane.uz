import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PLATFORM_MAP: Record<string, string> = {
  'PC (Microsoft Windows)': 'PC',
  'PlayStation 5': 'PS5',
  'PlayStation 4': 'PS4',
  'Xbox Series X|S': 'Xbox Series',
  'Xbox One': 'Xbox One',
  'Nintendo Switch': 'Switch',
  'macOS': 'Mac',
  'Linux': 'Linux',
};

function normPlatform(name: string) {
  return PLATFORM_MAP[name] ?? name;
}

export async function GET(request: Request) {
  const { requireAdmin } = await import('@/lib/apiGuard');
  const guard = await requireAdmin();
  if (guard) return guard;

  const { searchParams } = new URL(request.url);
  const q       = searchParams.get('q')?.trim();
  const limit   = Math.min(parseInt(searchParams.get('limit') ?? '10'), 20);
  const precise = searchParams.get('precise') !== 'false';
  const key   = process.env.RAWG_API_KEY;

  if (!key) {
    return NextResponse.json({ success: false, error: 'RAWG_API_KEY not configured', data: [] });
  }
  if (!q) {
    return NextResponse.json({ success: false, error: 'q is required', data: [] }, { status: 400 });
  }

  try {
    const url = `https://api.rawg.io/api/games?key=${key}&search=${encodeURIComponent(q)}&page_size=${limit}${precise ? '&search_precise=true' : ''}`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(7000) });

    if (!res.ok) throw new Error(`RAWG ${res.status}`);
    const data = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = (data.results ?? []).map((g: any) => ({
      id:          `rawg-${g.id}`,
      rawgId:      g.id,
      source:      'RAWG',
      title:       g.name,
      cover:       g.background_image ?? null,
      screenshots: (g.short_screenshots ?? [])
        .map((s: { image: string }) => s.image)
        .filter(Boolean)
        .slice(0, 8) as string[],
      trailer:     null,
      rating:      g.metacritic ?? (g.rating ? Math.round(g.rating * 20) : null),
      priceUsd:    null,
      genres:      (g.genres ?? []).map((genre: { name: string }) => genre.name),
      platforms:   Array.from(new Set(
        (g.platforms ?? []).map((p: { platform: { name: string } }) => normPlatform(p.platform.name))
      )) as string[],
      developer:   null,
      publisher:   null,
      releaseDate: g.released ?? null,
    }));

    return NextResponse.json({ success: true, source: 'RAWG', data: results });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err), data: [] }, { status: 502 });
  }
}
