import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { requireAdminOrSyncSecret } = await import('@/lib/apiGuard');
  const guard = await requireAdminOrSyncSecret(request);
  if (guard) return guard;

  const key = process.env.RAWG_API_KEY;
  if (!key) {
    return NextResponse.json({ success: false, error: 'RAWG_API_KEY not configured' });
  }

  const rawgId = params.id;

  try {
    const [gameRes, moviesRes, screenshotsRes] = await Promise.all([
      fetch(`https://api.rawg.io/api/games/${rawgId}?key=${key}`, { cache: 'no-store', signal: AbortSignal.timeout(6000) }),
      fetch(`https://api.rawg.io/api/games/${rawgId}/movies?key=${key}`, { cache: 'no-store', signal: AbortSignal.timeout(6000) }),
      fetch(`https://api.rawg.io/api/games/${rawgId}/screenshots?key=${key}`, { cache: 'no-store', signal: AbortSignal.timeout(6000) }),
    ]);

    if (!gameRes.ok) throw new Error(`RAWG ${gameRes.status}`);
    const game = await gameRes.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const movies = moviesRes.ok ? await moviesRes.json() : { results: [] as any[] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const screenshots = screenshotsRes.ok ? await screenshotsRes.json() : { results: [] as any[] };

    // Pick best trailer URL (mp4)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trailerEntry = (movies.results ?? []).find((m: any) => m.data?.max || m.data?.['480']);
    const trailer: string | null = trailerEntry
      ? (trailerEntry.data?.max || trailerEntry.data?.['480'])
      : null;

    // Full-res screenshots (up to 8)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fullScreenshots: string[] = (screenshots.results ?? [])
      .map((s: { image: string }) => s.image)
      .filter(Boolean)
      .slice(0, 8);

    // Fallback: use short_screenshots from game if no full ones
    const finalScreenshots = fullScreenshots.length > 0
      ? fullScreenshots
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : (game.short_screenshots ?? []).map((s: any) => s.image).filter(Boolean).slice(0, 8);

    return NextResponse.json({
      success: true,
      data: {
        description: game.description_raw || game.description || '',
        trailer,
        screenshots: finalScreenshots,
        website: game.website || null,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 502 });
  }
}
