import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Ctx = { params: { gameId: string } };

/** POST /api/admin/keys/[gameId]/disable — { keyIds } removes keys from the available pool */
export async function POST(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { keyIds, all } = await req.json() as { keyIds?: string[]; all?: boolean };
  if (!all && (!Array.isArray(keyIds) || keyIds.length === 0)) {
    return NextResponse.json({ error: 'keyIds must be a non-empty array (or pass all: true)' }, { status: 400 });
  }

  const { count } = await prisma.game_keys.updateMany({
    where: {
      gameId: params.gameId,
      ...(all ? { status: 'AVAILABLE' } : {
        id:     { in: keyIds },
        // Sold/used keys are historical — disabling them would misrepresent past deliveries
        status: { notIn: ['SOLD', 'USED'] },
      }),
    },
    data: { status: 'DISABLED', updatedAt: new Date() },
  });

  const [storeCount, dropCount] = await Promise.all([
    prisma.game_keys.count({ where: { gameId: params.gameId, status: 'AVAILABLE', type: { in: ['STORE', 'BOTH'] } } }),
    prisma.game_keys.count({ where: { gameId: params.gameId, status: 'AVAILABLE', type: { in: ['DROP', 'BOTH'] } } }),
  ]);
  await prisma.games.update({
    where: { id: params.gameId },
    data:  { stockStore: storeCount, stockDrop: dropCount },
  });

  return NextResponse.json({ ok: true, disabled: count });
}
