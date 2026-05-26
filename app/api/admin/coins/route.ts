import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalCoinsAgg, earnedTodayAgg, spentTodayAgg, totalAllTimeAgg, recentTx] = await Promise.all([
    prisma.users.aggregate({ _sum: { arcCoins: true } }),
    prisma.transactions.aggregate({
      where: { type: 'ADMIN_GRANT', createdAt: { gte: todayStart } },
      _sum: { amount: true },
    }),
    prisma.transactions.aggregate({
      where: { type: 'STORE_PURCHASE', createdAt: { gte: todayStart } },
      _sum: { amount: true },
    }),
    prisma.transactions.aggregate({
      where: { type: { in: ['ADMIN_GRANT', 'REFERRAL_BONUS', 'JACKPOT_WIN'] } },
      _sum: { amount: true },
    }),
    prisma.transactions.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id:          true,
        type:        true,
        amount:      true,
        description: true,
        createdAt:   true,
        users: { select: { id: true, username: true, level: true } },
      },
    }),
  ]);

  return NextResponse.json({
    totalCoins:    totalCoinsAgg._sum.arcCoins    ?? 0,
    earnedToday:   earnedTodayAgg._sum.amount     ?? 0,
    spentToday:    spentTodayAgg._sum.amount      ?? 0,
    totalAllTime:  totalAllTimeAgg._sum.amount    ?? 0,
    recentTx,
  });
}
