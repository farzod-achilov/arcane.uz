import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface Ctx { params: { slug: string } }

// GET /api/games/[slug]/reviews
export async function GET(_req: Request, { params }: Ctx) {
  const game = await prisma.games.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [reviews, agg] = await Promise.all([
    prisma.reviews.findMany({
      where: { gameId: game.id },
      include: { user: { select: { username: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.reviews.aggregate({
      where: { gameId: game.id },
      _avg:   { rating: true },
      _count: { rating: true },
    }),
  ]);

  const dist = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: reviews.filter(rv => rv.rating === r).length,
  }));

  return NextResponse.json({
    reviews: reviews.map(r => ({
      id:        r.id,
      rating:    r.rating,
      body:      r.body,
      verified:  r.verified,
      createdAt: r.createdAt,
      username:  r.user.username,
      avatar:    r.user.avatar,
    })),
    avgRating: agg._avg.rating ?? 0,
    total:     agg._count.rating,
    dist,
  });
}

// POST /api/games/[slug]/reviews — { rating: 1-5, body?: string }
export async function POST(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const game = await prisma.games.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { rating, body } = await req.json() as { rating?: number; body?: string };
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating must be 1–5' }, { status: 400 });
  }

  // Verify purchase
  const purchased = await prisma.orders.count({
    where: {
      userId: session.user.id,
      status: { in: ['COMPLETED', 'PAID', 'WAITING_MANUAL'] as never[] },
      items: { some: { gameId: game.id } },
    },
  });

  const review = await prisma.reviews.upsert({
    where: { userId_gameId: { userId: session.user.id, gameId: game.id } },
    create: {
      userId:   session.user.id,
      gameId:   game.id,
      rating,
      body:     body?.trim() || null,
      verified: purchased > 0,
    },
    update: {
      rating,
      body:     body?.trim() || null,
      verified: purchased > 0,
    },
  });

  // Recalculate and sync average rating to games table
  const agg = await prisma.reviews.aggregate({
    where: { gameId: game.id },
    _avg:  { rating: true },
  });
  if (agg._avg.rating != null) {
    await prisma.games.update({
      where: { id: game.id },
      data:  { rating: Math.round(agg._avg.rating * 10) / 10 },
    });
  }

  return NextResponse.json({ ok: true, id: review.id, verified: review.verified });
}
