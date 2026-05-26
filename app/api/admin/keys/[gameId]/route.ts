import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Ctx = { params: { gameId: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [game, keyRows, txs] = await Promise.all([
    prisma.games.findUnique({
      where:  { id: params.gameId },
      select: {
        id: true, title: true, cover: true,
        isActive: true, stockStore: true, stockDrop: true, lowStockThreshold: true,
      },
    }),
    prisma.game_keys.findMany({
      where:   { gameId: params.gameId },
      select:  { id: true, status: true, type: true, createdAt: true, usedAt: true, deliveredAt: true },
      orderBy: { createdAt: 'desc' },
      take:    500,
    }),
    prisma.key_transactions.findMany({
      where:   { game_keys: { gameId: params.gameId } },
      select:  {
        id: true, type: true, note: true, createdAt: true,
        users: { select: { username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take:    50,
    }),
  ]);

  if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const stats = { available: 0, sold: 0, disabled: 0, reserved: 0 };
  const byType = { STORE: 0, DROP: 0, BOTH: 0 };

  for (const k of keyRows) {
    if (k.status === 'AVAILABLE') {
      stats.available++;
      if (k.type === 'STORE') byType.STORE++;
      else if (k.type === 'DROP') byType.DROP++;
      else byType.BOTH++;
    } else if (k.status === 'SOLD' || k.status === 'USED') stats.sold++;
    else if (k.status === 'DISABLED') stats.disabled++;
    else if (k.status === 'RESERVED') stats.reserved++;
  }

  return NextResponse.json({ game, keys: keyRows, txs, stats, stockByType: byType });
}
