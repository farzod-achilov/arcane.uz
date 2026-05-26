import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q    = searchParams.get('q')    ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = 25;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (q.trim()) {
    where.OR = [
      { username: { contains: q, mode: 'insensitive' } },
      { email:    { contains: q, mode: 'insensitive' } },
    ];
  }

  const [users, total, coinsAgg] = await Promise.all([
    prisma.users.findMany({
      where,
      select: {
        id:          true,
        email:       true,
        username:    true,
        avatar:      true,
        arcCoins:    true,
        balanceUzs:  true,
        level:       true,
        totalSpent:  true,
        isAdmin:     true,
        isBanned:    true,
        createdAt:   true,
        lastLoginAt: true,
        _count: { select: { orders: true, wishlists: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.users.count({ where }),
    prisma.users.aggregate({ _sum: { arcCoins: true } }),
  ]);

  return NextResponse.json({
    users,
    total,
    pages: Math.ceil(total / limit),
    totalCoins: coinsAgg._sum.arcCoins ?? 0,
  });
}
