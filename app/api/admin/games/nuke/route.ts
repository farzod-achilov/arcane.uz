import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const result = await prisma.$transaction(async (tx) => {
    // 1. key_transactions → game_keys
    const { count: txCount } = await tx.key_transactions.deleteMany({});

    // 2. game_keys → games
    const { count: keysCount } = await tx.game_keys.deleteMany({});

    // 3. order_items → games
    const { count: itemsCount } = await tx.order_items.deleteMany({});

    // 4. drop_rewards.gameId → null (nullable field, no cascade)
    await tx.drop_rewards.updateMany({ where: { gameId: { not: null } }, data: { gameId: null } });

    // 5. games (cascades: game_pricing + pricing_logs, wishlists, reviews)
    const { count: gamesCount } = await tx.games.deleteMany({});

    return { gamesCount, keysCount, txCount, itemsCount };
  });

  return NextResponse.json({ ok: true, deleted: result });
}
