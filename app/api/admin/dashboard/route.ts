import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const now  = new Date();
  const day0 = new Date(now); day0.setHours(0, 0, 0, 0);
  const day7 = new Date(day0); day7.setDate(day7.getDate() - 6);

  const paidStatuses = ['PAID', 'COMPLETED', 'WAITING_MANUAL'] as never[];

  const [
    orders7,
    users7,
    statusGroups,
    totalRevenue,
    totalUsers,
    totalGames,
    recentOrdersRaw,
    waitingCount,
  ] = await Promise.all([
    prisma.orders.findMany({
      where:  { createdAt: { gte: day7 }, status: { in: paidStatuses } },
      select: { totalPrice: true, createdAt: true },
    }),
    prisma.users.findMany({
      where:  { createdAt: { gte: day7 } },
      select: { createdAt: true },
    }),
    prisma.orders.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.orders.aggregate({
      where: { status: { in: paidStatuses } },
      _sum:  { totalPrice: true },
    }),
    prisma.users.count(),
    prisma.games.count({ where: { isActive: true } }),
    prisma.orders.findMany({
      orderBy: { createdAt: 'desc' },
      take:    6,
      select: {
        id: true, totalPrice: true, status: true, createdAt: true,
        user:  { select: { username: true, email: true } },
        items: { take: 1, select: { game: { select: { title: true } } } },
      },
    }),
    prisma.orders.count({ where: { status: { in: ['WAITING_MANUAL', 'PAID'] as never[] } } }),
  ]);

  // 7-day chart
  const daily = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(day0); d.setDate(d.getDate() - i);
    const dStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const dayOrders = orders7.filter(o => o.createdAt.toISOString().slice(0, 10) === dStr);
    const dayUsers  = users7.filter(u => u.createdAt.toISOString().slice(0, 10) === dStr);
    daily.push({ label, date: dStr, revenue: dayOrders.reduce((s, o) => s + o.totalPrice, 0), orders: dayOrders.length, newUsers: dayUsers.length });
  }

  const statusDist = Object.fromEntries(statusGroups.map(r => [r.status, r._count.id]));
  const totalOrders = statusGroups.reduce((s, r) => s + r._count.id, 0);
  const rev7 = orders7.reduce((s, o) => s + o.totalPrice, 0);

  const recentOrders = recentOrdersRaw.map(o => ({
    id:         o.id,
    totalPrice: o.totalPrice,
    status:     o.status,
    createdAt:  o.createdAt.toISOString(),
    username:   o.user.username,
    gameTitle:  o.items[0]?.game.title ?? '—',
  }));

  return NextResponse.json({
    kpis: {
      totalRevenue: totalRevenue._sum.totalPrice ?? 0,
      totalOrders,
      totalUsers,
      totalGames,
      rev7,
      orders7:   orders7.length,
      newUsers7: users7.length,
      waiting:   waitingCount,
    },
    daily,
    statusDist,
    recentOrders,
  });
}
