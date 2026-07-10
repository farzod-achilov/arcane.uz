import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Ctx = { params: { gameId: string } };
type Pool = 'STORE' | 'DROP' | 'BOTH';
const POOLS: Pool[] = ['STORE', 'DROP', 'BOTH'];

/** POST /api/admin/keys/[gameId]/move — { from, to, count } reassigns AVAILABLE keys between pools */
export async function POST(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { from, to, count } = await req.json() as { from?: string; to?: string; count?: number };

  if (!POOLS.includes(from as Pool) || !POOLS.includes(to as Pool)) {
    return NextResponse.json({ error: 'from/to must be STORE, DROP or BOTH' }, { status: 400 });
  }
  if (from === to) {
    return NextResponse.json({ error: 'from and to must differ' }, { status: 400 });
  }
  if (!Number.isInteger(count) || count! <= 0) {
    return NextResponse.json({ error: 'count must be a positive integer' }, { status: 400 });
  }

  const eligible = await prisma.game_keys.findMany({
    where:  { gameId: params.gameId, type: from as Pool, status: 'AVAILABLE' },
    select: { id: true },
    take:   count,
    orderBy: { createdAt: 'asc' },
  });

  if (eligible.length < count!) {
    return NextResponse.json(
      { error: `Доступно только ${eligible.length} ключей в пуле ${from}` },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.game_keys.updateMany({
      where: { id: { in: eligible.map(k => k.id) } },
      data:  { type: to as Pool, updatedAt: new Date() },
    });

    const [storeCount, dropCount] = await Promise.all([
      tx.game_keys.count({ where: { gameId: params.gameId, status: 'AVAILABLE', type: { in: ['STORE', 'BOTH'] } } }),
      tx.game_keys.count({ where: { gameId: params.gameId, status: 'AVAILABLE', type: { in: ['DROP', 'BOTH'] } } }),
    ]);
    await tx.games.update({
      where: { id: params.gameId },
      data:  { stockStore: storeCount, stockDrop: dropCount },
    });
  });

  return NextResponse.json({ ok: true, moved: eligible.length });
}
