import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { appId: string } },
) {
  const { appId } = params;

  if (!/^\d+$/.test(appId)) {
    return NextResponse.json({ error: 'Invalid appId' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`,
      { cache: 'no-store' },
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Steam API unavailable' }, { status: 502 });
    }

    const raw = await res.json();
    const entry = raw[appId];

    if (!entry?.success || !entry.data) {
      return NextResponse.json({ error: 'Game not found on Steam' }, { status: 404 });
    }

    const d = entry.data;

    const platforms: string[] = [
      d.platforms?.windows && 'PC',
      d.platforms?.mac     && 'Mac',
      d.platforms?.linux   && 'Linux',
    ].filter(Boolean) as string[];

    const priceUsd =
      d.is_free                  ? 0
      : d.price_overview?.final  ? d.price_overview.final / 100
      : null;

    const screenshots: string[] = (d.screenshots ?? [])
      .map((s: { path_full: string }) => s.path_full)
      .slice(0, 8);

    const trailer: string | null =
      d.movies?.[0]?.mp4?.max ??
      d.movies?.[0]?.mp4?.['480'] ??
      d.movies?.[0]?.webm?.max ??
      null;

    return NextResponse.json({
      success: true,
      data: {
        appId:       d.steam_appid,
        title:       d.name,
        cover:       d.header_image ?? null,
        screenshots,
        trailer,
        description: d.short_description ?? '',
        genres:      (d.genres ?? []).map((g: { description: string }) => g.description).slice(0, 5),
        platforms,
        priceUsd,
        rating:      d.metacritic?.score ?? null,
        developer:   d.developers?.[0]   ?? null,
        publisher:   d.publishers?.[0]   ?? null,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch Steam data' }, { status: 502 });
  }
}
