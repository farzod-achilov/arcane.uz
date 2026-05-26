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
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit    = 20;

  const where = q ? {
    OR: [
      { title:  { contains: q, mode: 'insensitive' as const } },
      { developer: { contains: q, mode: 'insensitive' as const } },
    ],
  } : {};

  const [games, total] = await Promise.all([
    prisma.games.findMany({
      where,
      select: {
        id: true, title: true, slug: true, cover: true,
        genres: true, platforms: true, developer: true,
        priceUzs: true, priceUsd: true,
        isActive: true, stockStore: true, stockDrop: true, deliveryType: true,
        createdAt: true,
        _count: { select: { order_items: true, game_keys: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.games.count({ where }),
  ]);

  return NextResponse.json({ games, total, pages: Math.ceil(total / limit) });
}
