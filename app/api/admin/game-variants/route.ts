import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/apiGuard';

export const dynamic = 'force-dynamic';

// GET /api/admin/game-variants?gameId=... — list all variants (active +
// inactive) of one game, for the admin edit modal's variant list.
export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const gameId = new URL(req.url).searchParams.get('gameId');
  if (!gameId) {
    return NextResponse.json({ ok: false, error: 'gameId is required' }, { status: 400 });
  }

  const variants = await prisma.game_variants.findMany({
    where:   { gameId },
    orderBy: { sortOrder: 'asc' },
    select:  { id: true, label: true, priceUzs: true, isActive: true, dropshipSource: true, dropshipExternalId: true, pricingStrategy: true },
  });

  return NextResponse.json({ ok: true, variants });
}
