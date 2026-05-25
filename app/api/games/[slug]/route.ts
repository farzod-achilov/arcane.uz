import { NextRequest, NextResponse } from 'next/server';
import { getGameBySlug } from '@/lib/db/games';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const game = await getGameBySlug(params.slug);
    if (!game) {
      return NextResponse.json({ success: false, error: 'Игра не найдена' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: game }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/games/slug]', msg);
    return NextResponse.json({ success: false, error: 'Ошибка базы данных' }, { status: 500 });
  }
}
