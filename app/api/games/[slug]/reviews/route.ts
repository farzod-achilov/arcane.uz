import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface Ctx { params: { slug: string } }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWhere = any;

async function findGame(slug: string) {
  return prisma.games.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    select: { id: true },
  });
}

// GET /api/games/[slug]/reviews — approved reviews only
export async function GET(_req: Request, { params }: Ctx) {
  const game = await findGame(params.slug);
  if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const where: AnyWhere = { gameId: game.id, isApproved: true };

  const [rows, agg] = await Promise.all([
    prisma.reviews.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take:    50,
      include: { user: { select: { username: true, avatar: true } } },
    }) as Promise<AnyWhere[]>,
    prisma.reviews.aggregate({
      where,
      _avg:   { rating: true },
      _count: { rating: true },
    }),
  ]);

  const dist = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count:  (rows as AnyWhere[]).filter((rv: AnyWhere) => rv.rating === r).length,
  }));

  return NextResponse.json({
    reviews: (rows as AnyWhere[]).map((r: AnyWhere) => ({
      id:         r.id,
      rating:     r.rating,
      body:       r.body,
      verified:   r.verified,
      createdAt:  r.createdAt,
      authorName: r.user?.username ?? r.authorName ?? 'Аноним',
      avatar:     r.user?.avatar   ?? null,
    })),
    avgRating: agg._avg?.rating ?? 0,
    total:     (agg._count as AnyWhere)?.rating ?? 0,
    dist,
  });
}

// POST /api/games/[slug]/reviews
// Auth user: { rating, body }
// Guest:     { rating, body, authorName, authorEmail }
export async function POST(req: Request, { params }: Ctx) {
  const game = await findGame(params.slug);
  if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as {
    rating:       number;
    body?:        string;
    authorName?:  string;
    authorEmail?: string;
  };

  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: 'Оценка от 1 до 5' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    const existing = await prisma.reviews.findFirst({
      where: { gameId: game.id, userId: session.user.id },
    });
    if (existing) {
      return NextResponse.json({ error: 'Вы уже оставили отзыв на эту игру' }, { status: 409 });
    }

    const purchased = await prisma.orders.count({
      where: {
        userId: session.user.id,
        status: { in: ['COMPLETED', 'PAID', 'WAITING_MANUAL'] as unknown as never[] },
        items:  { some: { gameId: game.id } },
      },
    });

    await (prisma.reviews.create as AnyWhere)({
      data: {
        userId:     session.user.id,
        gameId:     game.id,
        rating:     body.rating,
        body:       body.body?.trim() || null,
        verified:   purchased > 0,
        isApproved: false,
      },
    });
  } else {
    if (!body.authorName?.trim() || !body.authorEmail?.trim()) {
      return NextResponse.json({ error: 'Укажите имя и email' }, { status: 400 });
    }

    const emailLower = body.authorEmail.toLowerCase().trim();
    const existing = await (prisma.reviews.findFirst as AnyWhere)({
      where: { gameId: game.id, authorEmail: emailLower },
    });
    if (existing) {
      return NextResponse.json({ error: 'Вы уже оставили отзыв на эту игру' }, { status: 409 });
    }

    await (prisma.reviews.create as AnyWhere)({
      data: {
        gameId:      game.id,
        rating:      body.rating,
        body:        body.body?.trim() || null,
        authorName:  body.authorName.trim(),
        authorEmail: emailLower,
        isApproved:  false,
      },
    });
  }

  return NextResponse.json({ success: true, pending: true });
}
