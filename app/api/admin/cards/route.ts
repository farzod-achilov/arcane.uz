import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const cards = await prisma.payment_cards.findMany({
    orderBy: [{ isActive: 'desc' }, { priority: 'desc' }, { createdAt: 'asc' }],
    include: {
      _count: { select: { deposit_requests: { where: { status: 'PENDING' } } } },
    },
  });

  // сумма зачислений за сегодня по каждой карте — контроль лимитов
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const approvedToday = await prisma.deposit_requests.groupBy({
    by:     ['cardId'],
    where:  { status: 'APPROVED', cardId: { not: null }, updatedAt: { gte: today } },
    _sum:   { uniqueAmount: true },
  });
  const sums = new Map(approvedToday.map(r => [r.cardId, r._sum.uniqueAmount ?? 0]));

  return NextResponse.json({
    cards: cards.map(c => ({
      id:            c.id,
      cardNumber:    c.cardNumber,
      holderName:    c.holderName,
      bank:          c.bank,
      isActive:      c.isActive,
      priority:      c.priority,
      pendingCount:  c._count.deposit_requests,
      approvedToday: sums.get(c.id) ?? 0,
      createdAt:     c.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as { cardNumber?: string; holderName?: string; bank?: string; priority?: number };
  const cardNumber = (body.cardNumber ?? '').replace(/[^\d]/g, '');
  const holderName = (body.holderName ?? '').trim();

  if (!/^\d{16}$/.test(cardNumber))
    return NextResponse.json({ error: 'Номер карты — 16 цифр' }, { status: 400 });
  if (!holderName)
    return NextResponse.json({ error: 'Укажите имя держателя' }, { status: 400 });

  const formatted = cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
  const card = await prisma.payment_cards.create({
    data: {
      cardNumber: formatted,
      holderName,
      bank:       body.bank?.trim() || null,
      priority:   Math.round(body.priority ?? 0),
    },
  });

  return NextResponse.json({ ok: true, card });
}
