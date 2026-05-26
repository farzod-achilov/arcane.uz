import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const discounts = await prisma.discounts.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      games: { select: { id: true, title: true, cover: true, priceUzs: true } },
    },
  });

  return NextResponse.json({ discounts });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as {
    gameId?: string; type?: string; discountPct?: number;
    startsAt?: string; endsAt?: string;
  };

  const { gameId, type = 'flash', discountPct, startsAt, endsAt } = body;

  if (!gameId)       return NextResponse.json({ error: 'Игра обязательна' }, { status: 400 });
  if (!discountPct || discountPct < 1 || discountPct > 99)
    return NextResponse.json({ error: 'Скидка должна быть от 1 до 99%' }, { status: 400 });

  const game = await prisma.games.findUnique({ where: { id: gameId }, select: { id: true } });
  if (!game) return NextResponse.json({ error: 'Игра не найдена' }, { status: 404 });

  const discount = await prisma.discounts.create({
    data: {
      id:          nanoid(),
      gameId,
      type,
      discountPct,
      startsAt:    startsAt ? new Date(startsAt) : null,
      endsAt:      endsAt   ? new Date(endsAt)   : null,
      isActive:    true,
      isFeatured:  false,
      updatedAt:   new Date(),
    },
    include: {
      games: { select: { id: true, title: true, cover: true, priceUzs: true } },
    },
  });

  return NextResponse.json({ ok: true, discount }, { status: 201 });
}
