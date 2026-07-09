import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { notifyAdminNewDeposit } from '@/lib/adminTelegram';
import {
  pickCard, generateUniqueAmount, expireStaleDeposits, DEPOSIT_TTL_MINUTES,
} from '@/lib/deposits/p2p';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { amount?: number };
  const amount = Math.round(body.amount ?? 0);

  if (!amount || amount < 10_000)
    return NextResponse.json({ error: 'Минимальная сумма 10 000 сум' }, { status: 400 });
  if (amount > 10_000_000)
    return NextResponse.json({ error: 'Максимальная сумма 10 000 000 сум' }, { status: 400 });

  await expireStaleDeposits();

  // одна активная заявка на пользователя: возвращаем её же (идемпотентно)
  const existing = await prisma.deposit_requests.findFirst({
    where:   { userId: session.user.id, status: 'PENDING', expiresAt: { gt: new Date() } },
    include: { card: true },
  });
  if (existing?.card) {
    return NextResponse.json({
      ok: true,
      id: existing.id,
      uniqueAmount: existing.uniqueAmount,
      expiresAt:    existing.expiresAt,
      card: {
        cardNumber: existing.card.cardNumber,
        holderName: existing.card.holderName,
        bank:       existing.card.bank,
      },
      resumed: true,
    });
  }

  const card = await pickCard();
  if (!card)
    return NextResponse.json({ error: 'Пополнение временно недоступно, попробуйте позже' }, { status: 503 });

  const uniqueAmount = await generateUniqueAmount(amount);
  const expiresAt    = new Date(Date.now() + DEPOSIT_TTL_MINUTES * 60_000);

  const deposit = await prisma.deposit_requests.create({
    data: {
      id:        nanoid(),
      userId:    session.user.id,
      amount,
      uniqueAmount,
      method:    'card',
      status:    'PENDING',
      cardId:    card.id,
      expiresAt,
      updatedAt: new Date(),
    },
  });

  notifyAdminNewDeposit({
    depositId:    deposit.id,
    userId:       session.user.id,
    userName:     session.user.name  ?? '',
    userEmail:    session.user.email ?? '',
    amount,
    uniqueAmount,
    cardNumber:   card.cardNumber,
    ttlMinutes:   DEPOSIT_TTL_MINUTES,
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    id: deposit.id,
    uniqueAmount,
    expiresAt,
    card: {
      cardNumber: card.cardNumber,
      holderName: card.holderName,
      bank:       card.bank,
    },
  });
}
