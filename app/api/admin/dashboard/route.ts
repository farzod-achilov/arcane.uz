import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const days = Math.min(90, Math.max(7, parseInt(searchParams.get('days') ?? '7', 10)));

  const now  = new Date();
  const day0 = new Date(now); day0.setHours(0, 0, 0, 0);

  const periodStart = new Date(day0); periodStart.setDate(periodStart.getDate() - (days - 1));
  const prevStart   = new Date(day0); prevStart.setDate(prevStart.getDate() - (days * 2 - 1));
  const prevEnd     = new Date(day0); prevEnd.setDate(prevEnd.getDate() - days);

  const paidStatuses = ['PAID', 'COMPLETED', 'WAITING_MANUAL'] as never[];

  const [
    ordersInPeriod,
    ordersInPrev,
    usersInPeriod,
    usersInPrev,
    statusGroups,
    totalRevenue,
    totalUsers,
    totalGames,
    recentOrdersRaw,
    waitingCount,
    topGamesRaw,
  ] = await Promise.all([
    prisma.orders.findMany({
      where:  { createdAt: { gte: periodStart }, status: { in: paidStatuses } },
      select: { totalPrice: true, createdAt: true },
    }),
    prisma.orders.aggregate({
      where: { createdAt: { gte: prevStart, lte: prevEnd }, status: { in: paidStatuses } },
      _sum: { totalPrice: true }, _count: { id: true },
    }),
    prisma.users.findMany({
      where:  { createdAt: { gte: periodStart } },
      select: { createdAt: true },
    }),
    prisma.users.count({ where: { createdAt: { gte: prevStart, lte: prevEnd } } }),
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.order_items.groupBy as any)({
      by: ['gameId'],
      where: { order: { createdAt: { gte: periodStart }, status: { in: paidStatuses } }, gameId: { not: null } },
      _count: { id: true },
      _sum:   { price: true },
      orderBy: { _count: { id: 'desc' } },
      take:   8,
    }) as Promise<{ gameId: string | null; _count: { id: number }; _sum: { price: number | null } }[]>,
  ]);

  // Fetch game details for top games
  const topGameIds = topGamesRaw.map(r => r.gameId).filter((id): id is string => !!id);
  const topGameDetails = topGameIds.length
    ? await prisma.games.findMany({
        where:  { id: { in: topGameIds } },
        select: { id: true, title: true, cover: true, genres: true },
      })
    : [];

  const topGames = topGamesRaw.map(r => {
    const game = topGameDetails.find(g => g.id === r.gameId);
    return {
      gameId:  r.gameId,
      title:   game?.title  ?? '—',
      cover:   game?.cover  ?? null,
      genres:  game?.genres ?? [],
      sales:   r._count.id,
      revenue: r._sum.price ?? 0,
    };
  }).filter(g => g.title !== '—');

  // Build daily chart
  const daily = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(day0); d.setDate(d.getDate() - i);
    const dStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const dayOrders = ordersInPeriod.filter(o => o.createdAt.toISOString().slice(0, 10) === dStr);
    const dayUsers  = usersInPeriod.filter(u => u.createdAt.toISOString().slice(0, 10) === dStr);
    daily.push({
      label,
      date:     dStr,
      revenue:  dayOrders.reduce((s, o) => s + o.totalPrice, 0),
      orders:   dayOrders.length,
      newUsers: dayUsers.length,
    });
  }

  const statusDist  = Object.fromEntries(statusGroups.map(r => [r.status, r._count.id]));
  const totalOrders = statusGroups.reduce((s, r) => s + r._count.id, 0);
  const revPeriod   = ordersInPeriod.reduce((s, o) => s + o.totalPrice, 0);
  const revPrev     = ordersInPrev._sum.totalPrice ?? 0;
  const ordersPrev  = ordersInPrev._count.id ?? 0;
  const usersPrev   = usersInPrev;

  const pct = (cur: number, prev: number) =>
    prev === 0 ? null : Math.round(((cur - prev) / prev) * 100);

  return NextResponse.json({
    kpis: {
      totalRevenue: totalRevenue._sum.totalPrice ?? 0,
      totalOrders,
      totalUsers,
      totalGames,
      revPeriod,
      ordersPeriod: ordersInPeriod.length,
      newUsersPeriod: usersInPeriod.length,
      waiting: waitingCount,
      // % vs previous same-length period
      revDelta:    pct(revPeriod, revPrev),
      ordersDelta: pct(ordersInPeriod.length, ordersPrev),
      usersDelta:  pct(usersInPeriod.length, usersPrev),
    },
    daily,
    statusDist,
    recentOrders: recentOrdersRaw.map(o => ({
      id:         o.id,
      totalPrice: o.totalPrice,
      status:     o.status,
      createdAt:  o.createdAt.toISOString(),
      username:   o.user.username,
      gameTitle:  o.items[0]?.game.title ?? '—',
    })),
    topGames,
  });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[dashboard]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
