import { NextRequest, NextResponse } from 'next/server';
import { getGames } from '@/lib/db/games';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;

  const q        = sp.get('q')?.trim()        ?? '';
  const genre    = sp.get('genre')?.trim()    ?? '';
  const platform = sp.get('platform')?.trim() ?? '';
  const sort     = sp.get('sort')             ?? 'newest';
  const page     = Math.max(1, parseInt(sp.get('page')  ?? '1',  10));
  const limit    = Math.min(48, parseInt(sp.get('limit') ?? '24', 10));
  const inStock  = sp.get('inStock') === 'true';

  try {
    const result = await getGames({ q, genre, platform, sort, page, limit, inStock });
    return NextResponse.json({ success: true, ...result }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/games]', msg);
    return NextResponse.json({ success: false, error: 'Ошибка базы данных' }, { status: 500 });
  }
}
