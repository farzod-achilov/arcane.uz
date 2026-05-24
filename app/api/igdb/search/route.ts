import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Module-level token cache — lives until cold start
let tokenCache: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string | null> {
  const clientId     = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.value;

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST', cache: 'no-store' },
  );
  if (!res.ok) return null;

  const data = await res.json();
  tokenCache = {
    value:     data.access_token,
    expiresAt: Date.now() + (data.expires_in - 3600) * 1000,
  };
  return tokenCache.value;
}

const PLATFORM_MAP: Record<string, string> = {
  'PC (Microsoft Windows)': 'PC',
  'PlayStation 5':          'PS5',
  'PlayStation 4':          'PS4',
  'Xbox Series X|S':        'Xbox Series',
  'Xbox One':               'Xbox One',
  'Nintendo Switch':        'Switch',
  'macOS':                  'Mac',
  'Linux':                  'Linux',
};

function normPlatform(name: string) { return PLATFORM_MAP[name] ?? name; }

function igdbImg(url: string | undefined, size: string): string | null {
  if (!url) return null;
  return `https:${url.replace('/t_thumb/', `/${size}/`)}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q     = searchParams.get('q')?.trim();
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 20);

  const clientId = process.env.IGDB_CLIENT_ID;
  if (!clientId || !process.env.IGDB_CLIENT_SECRET) {
    return NextResponse.json({ success: false, error: 'IGDB not configured', data: [] });
  }

  if (!q) {
    return NextResponse.json({ success: false, error: 'q is required', data: [] }, { status: 400 });
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json({ success: false, error: 'IGDB auth failed', data: [] }, { status: 502 });
  }

  try {
    const body = [
      `search "${q.replace(/"/g, '\\"')}";`,
      'fields name, cover.url, rating, genres.name, platforms.name,',
      '       involved_companies.company.name, involved_companies.developer,',
      '       involved_companies.publisher, first_release_date,',
      '       screenshots.url, videos.video_id;',
      `limit ${limit};`,
    ].join('\n');

    const res = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID':     clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'text/plain',
      },
      body,
      signal: AbortSignal.timeout(9000),
      cache:  'no-store',
    });

    if (!res.ok) throw new Error(`IGDB ${res.status}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const games: any[] = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = games.map((g: any) => ({
      id:       `igdb-${g.id}`,
      igdbId:   g.id,
      source:   'IGDB',
      title:    g.name,
      cover:    igdbImg(g.cover?.url, 't_cover_big'),
      screenshots: (g.screenshots ?? [])
        .map((s: { url: string }) => igdbImg(s.url, 't_screenshot_big'))
        .filter(Boolean)
        .slice(0, 8) as string[],
      // "yt:{videoId}" — parsed by arcaneMapper → youtube embed
      trailer:  g.videos?.[0]?.video_id ? `yt:${g.videos[0].video_id}` : null,
      rating:   g.rating ? Math.round(g.rating) : null,
      priceUsd: null,
      genres:   (g.genres ?? []).map((genre: { name: string }) => genre.name),
      platforms: Array.from(new Set(
        (g.platforms ?? []).map((p: { name: string }) => normPlatform(p.name))
      )) as string[],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      developer:  g.involved_companies?.find((c: any) => c.developer)?.company?.name ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      publisher:  g.involved_companies?.find((c: any) => c.publisher)?.company?.name ?? null,
      releaseDate: g.first_release_date
        ? new Date(g.first_release_date * 1000).toISOString().split('T')[0]
        : null,
    }));

    return NextResponse.json({ success: true, source: 'IGDB', data: results });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err), data: [] }, { status: 502 });
  }
}
