import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  const [user, legendaryCount, gamesCount] = await Promise.all([
    prisma.users.findUnique({
      where:  { id: userId },
      select: { username: true, level: true, xp: true, arcCoins: true, streak: true, totalDrops: true, avatar: true },
    }),
    // Count legendary/arcane drops from inventory
    prisma.inventory.count({
      where: {
        userId,
        drop_rewards: { rarity: { in: ['LEGENDARY'] } },
      },
    }),
    // Count game rewards received
    prisma.inventory.count({
      where: {
        userId,
        drop_rewards: { type: 'GAME' },
      },
    }),
  ]);

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    username:       user.username,
    level:          user.level,
    xp:             user.xp,
    arcCoins:       user.arcCoins,
    streak:         user.streak,
    totalDrops:     user.totalDrops,
    legendaryDrops: legendaryCount,
    gamesReceived:  gamesCount,
    avatar:         user.avatar,
  });
}
