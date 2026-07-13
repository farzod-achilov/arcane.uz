import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/* ─────────────────────────────────────────────────────────
   GET /api/rawg/game-series/[id]

   RAWG's own "other games in this series" endpoint — used by the
   admin bulk-add flow's franchise finder: pick one game (e.g.
   "Assassin's Creed"), get back every other entry in the series
   (Origins, Valhalla, Syndicate, ...) to seed the bulk title list,
   instead of typing each one by hand.
───────────────────────────────────────────────────────── */

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { requireAdminOrSyncSecret } = await import('@/lib/apiGuard');
  const guard = await requireAdminOrSyncSecret(request);
  if (guard) return guard;

  const key = process.env.RAWG_API_KEY;
  if (!key) {
    return NextResponse.json({ success: false, error: 'RAWG_API_KEY not configured', data: [] });
  }

  try {
    const res = await fetch(`https://api.rawg.io/api/games/${params.id}/game-series?key=${key}&page_size=40`, {
      cache: 'no-store', signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) throw new Error(`RAWG ${res.status}`);
    const json = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (json.results ?? []).map((g: any) => ({
      rawgId:      g.id,
      title:       g.name,
      cover:       g.background_image ?? null,
      releaseDate: g.released ?? null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err), data: [] }, { status: 502 });
  }
}
