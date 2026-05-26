import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q        = searchParams.get('q')        ?? '';
  const status   = searchParams.get('status')   ?? '';
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo   = searchParams.get('dateTo')   ?? '';
  const sortBy   = searchParams.get('sortBy')   ?? 'createdAt';
  const sortDir  = searchParams.get('sortDir')  === 'asc' ? 'asc' : 'desc';
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit    = 25;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status && status !== 'ALL') where.status = status;
  if (q.trim()) {
    where.OR = [
      { id:   { contains: q, mode: 'insensitive' } },
      { user: { username: { contains: q, mode: 'insensitive' } } },
      { user: { email:    { contains: q, mode: 'insensitive' } } },
      { items: { some: { game: { title: { contains: q, mode: 'insensitive' } } } } },
    ];
  }
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo   ? { lte: new Date(dateTo)   } : {}),
    };
  }

  const orderBy = sortBy === 'totalPrice'
    ? { totalPrice: sortDir as 'asc' | 'desc' }
    : { createdAt:  sortDir as 'asc' | 'desc' };

  const [orders, total, statusGroups] = await Promise.all([
    prisma.orders.findMany({
      where,
      select: {
        id:           true,
        totalPrice:   true,
        status:       true,
        deliveredAt:  true,
        deliveredBy:  true,
        deliveryNote: true,
        createdAt:    true,
        updatedAt:    true,
        user:  { select: { id: true, username: true, email: true } },
        items: {
          select: {
            id:          true,
            price:       true,
            keyValue:    true,
            deliveredAt: true,
            game: { select: { id: true, title: true, cover: true, slug: true, deliveryType: true } },
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.orders.count({ where }),
    prisma.orders.groupBy({ by: ['status'], _count: { id: true } }),
  ]);

  const counts = Object.fromEntries(statusGroups.map(r => [r.status, r._count.id]));

  return NextResponse.json({ orders, total, pages: Math.ceil(total / limit), counts });
}
