import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { notifyAdminNewDeposit } from '@/lib/adminTelegram';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { amount?: number; method?: string };
  const amount = Math.round(body.amount ?? 0);
  const method = body.method ?? '';

  if (!amount || amount < 10000)
    return NextResponse.json({ error: 'Минимальная сумма 10 000 сум' }, { status: 400 });
  if (!['click', 'payme', 'card'].includes(method))
    return NextResponse.json({ error: 'Неверный метод оплаты' }, { status: 400 });

  const deposit = await prisma.deposit_requests.create({
    data: {
      id:        nanoid(),
      userId:    session.user.id,
      amount,
      method,
      status:    'PENDING',
      updatedAt: new Date(),
    },
  });

  notifyAdminNewDeposit({
    depositId: deposit.id,
    userId:    session.user.id,
    userName:  session.user.name  ?? '',
    userEmail: session.user.email ?? '',
    amount,
    method,
  }).catch(() => {});

  return NextResponse.json({ ok: true, id: deposit.id });
}
