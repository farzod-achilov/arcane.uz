import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const now   = new Date();
  const day0  = new Date(now); day0.setHours(0, 0, 0, 0);
  const day7  = new Date(day0); day7.setDate(day7.getDate() - 6);
  const day30 = new Date(day0); day30.setDate(day30.getDate() - 29);

  const [
    orders7,
    users7,
    allOrders,
    topItems,
    totalGames,
    totalUsers,
    totalRevenue,
  ] = await Promise.all([
    // Orders + revenue per day for last 7 days
    prisma.orders.findMany({
      where: { createdAt: { gte: day7 }, status: { in: ['PAID', 'COMPLETED', 'WAITING_MANUAL'] as never[] } },
      select: { totalPrice: true, createdAt: true, status: true },
    }),
    // New users last 7 days
    prisma.users.findMany({
      where:  { createdAt: { gte: day7 } },
      select: { createdAt: true },
    }),
    // All orders for status distribution
    prisma.orders.groupBy({
      by:    ['status'],
      _count: { id: true },
    }),
    // Top games by order count (last 30 days)
    prisma.order_items.groupBy({
      by:     ['gameId'],
      where:  { createdAt: { gte: day30 } },
      _count: { id: true },
      _sum:   { price: true },
      orderBy: { _count: { id: 'desc' } },
      take:   5,
    }),
    prisma.games.count({ where: { isActive: true } }),
    prisma.users.count(),
    prisma.orders.aggregate({
      where: { status: { in: ['PAID', 'COMPLETED', 'WAITING_MANUAL'] as never[] } },
      _sum: { totalPrice: true },
    }),
  ]);

  // Build daily chart (last 7 days)
  const days: { label: string; date: string; revenue: number; orders: number; newUsers: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(day0); d.setDate(d.getDate() - i);
    const dStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const dayOrders = orders7.filter(o => o.createdAt.toISOString().slice(0, 10) === dStr);
    const dayUsers  = users7.filter(u => u.createdAt.toISOString().slice(0, 10) === dStr);
    days.push({
      label,
      date:     dStr,
      revenue:  dayOrders.reduce((s, o) => s + o.totalPrice, 0),
      orders:   dayOrders.length,
      newUsers: dayUsers.length,
    });
  }

  // Enrich top games with titles
  const gameIds = topItems.map(t => t.gameId);
  const games   = await prisma.games.findMany({
    where:  { id: { in: gameIds } },
    select: { id: true, title: true, cover: true, slug: true },
  });
  const topGames = topItems.map(t => {
    const g = games.find(g => g.id === t.gameId);
    return {
      gameId:  t.gameId,
      title:   g?.title  ?? 'Unknown',
      cover:   g?.cover  ?? null,
      slug:    g?.slug   ?? '',
      sales:   t._count.id,
      revenue: t._sum.price ?? 0,
    };
  });

  // Status distribution
  const statusDist = Object.fromEntries(allOrders.map(r => [r.status, r._count.id]));

  // KPIs
  const rev7 = orders7.reduce((s, o) => s + o.totalPrice, 0);

  return NextResponse.json({
    kpis: {
      revenue7:     rev7,
      orders7:      orders7.length,
      newUsers7:    users7.length,
      totalRevenue: totalRevenue._sum.totalPrice ?? 0,
      totalGames,
      totalUsers,
    },
    daily:      days,
    topGames,
    statusDist,
  });
}
