import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const period = Math.min(Math.max(parseInt(searchParams.get('period') ?? '7'), 7), 90);

  const now  = new Date();
  const day0 = new Date(now); day0.setHours(0, 0, 0, 0);
  const dayN = new Date(day0); dayN.setDate(dayN.getDate() - (period - 1));
  const day30 = new Date(day0); day30.setDate(day30.getDate() - 29);

  const paidStatuses = ['PAID', 'COMPLETED', 'WAITING_MANUAL'] as const;

  const [
    ordersInPeriod,
    usersInPeriod,
    allOrders,
    allOrdersCount,
    completedCount,
    topItems,
    totalGames,
    totalUsers,
    totalRevenue,
    topPromos,
  ] = await Promise.all([
    prisma.orders.findMany({
      where: { createdAt: { gte: dayN }, status: { in: paidStatuses as never[] } },
      select: { totalPrice: true, createdAt: true, status: true },
    }),
    prisma.users.findMany({
      where:  { createdAt: { gte: dayN } },
      select: { createdAt: true },
    }),
    prisma.orders.groupBy({
      by:    ['status'],
      _count: { id: true },
    }),
    prisma.orders.count({ where: { status: { in: paidStatuses as never[] } } }),
    prisma.orders.count({ where: { status: 'COMPLETED' } }),
    prisma.order_items.groupBy({
      by:     ['gameId'],
      where:  { createdAt: { gte: day30 } },
      _count: { id: true },
      _sum:   { price: true },
      orderBy: { _count: { id: 'desc' } },
      take:   10,
    }),
    prisma.games.count({ where: { isActive: true } }),
    prisma.users.count(),
    prisma.orders.aggregate({
      where: { status: { in: paidStatuses as never[] } },
      _sum:  { totalPrice: true },
      _avg:  { totalPrice: true },
    }),
    prisma.promo_codes.findMany({
      where:   { usedCount: { gt: 0 } },
      orderBy: { usedCount: 'desc' },
      take:    5,
      select:  { code: true, type: true, value: true, usedCount: true },
    }),
  ]);

  // Build daily series
  const days: { label: string; date: string; revenue: number; orders: number; newUsers: number }[] = [];
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date(day0); d.setDate(d.getDate() - i);
    const dStr = d.toISOString().slice(0, 10);
    const label = period <= 14
      ? d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
      : period <= 31
        ? d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
        : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    const dayOrders = ordersInPeriod.filter(o => o.createdAt.toISOString().slice(0, 10) === dStr);
    const dayUsers  = usersInPeriod.filter(u => u.createdAt.toISOString().slice(0, 10) === dStr);
    days.push({
      label,
      date:     dStr,
      revenue:  dayOrders.reduce((s, o) => s + o.totalPrice, 0),
      orders:   dayOrders.length,
      newUsers: dayUsers.length,
    });
  }

  // Enrich top games
  const gameIds = topItems.map(t => t.gameId);
  const games   = await prisma.games.findMany({
    where:  { id: { in: gameIds } },
    select: { id: true, title: true, cover: true, slug: true },
  });
  const topGames = topItems.map(t => {
    const g = games.find(g => g.id === t.gameId);
    return { gameId: t.gameId, title: g?.title ?? 'Unknown', cover: g?.cover ?? null, slug: g?.slug ?? '', sales: t._count.id, revenue: t._sum.price ?? 0 };
  });

  const statusDist    = Object.fromEntries(allOrders.map(r => [r.status, r._count.id]));
  const revInPeriod   = ordersInPeriod.reduce((s, o) => s + o.totalPrice, 0);
  const completionRate = allOrdersCount > 0 ? Math.round((completedCount / allOrdersCount) * 100) : 0;

  return NextResponse.json({
    period,
    kpis: {
      revenueN:       revInPeriod,
      ordersN:        ordersInPeriod.length,
      newUsersN:      usersInPeriod.length,
      totalRevenue:   totalRevenue._sum.totalPrice ?? 0,
      avgOrderValue:  Math.round(totalRevenue._avg?.totalPrice ?? 0),
      completionRate,
      totalGames,
      totalUsers,
    },
    daily: days,
    topGames,
    statusDist,
    topPromos,
  });
}
