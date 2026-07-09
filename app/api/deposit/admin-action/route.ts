/**
 * POST /api/deposit/admin-action
 * Вызывается arcane-bot'ом при нажатии inline-кнопок ✅/❌ под
 * уведомлением о депозите в админском чате.
 * Аутентификация — общий секрет бот↔сайт (x-api-secret).
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { approveDeposit } from '@/lib/deposits/p2p';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const secret = req.headers.get('x-api-secret');
  if (!process.env.TELEGRAM_API_SECRET || secret !== process.env.TELEGRAM_API_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { depositId?: string; action?: 'approve' | 'reject'; actor?: string };
  if (!body.depositId || !['approve', 'reject'].includes(body.action ?? ''))
    return NextResponse.json({ error: 'depositId and action required' }, { status: 400 });

  const deposit = await prisma.deposit_requests.findUnique({
    where:   { id: body.depositId },
    include: { users: { select: { username: true } } },
  });
  if (!deposit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (body.action === 'approve') {
    const result = await approveDeposit(
      body.depositId, 'telegram',
      `Подтверждено в Telegram${body.actor ? ` (${body.actor})` : ''}`,
    );
    if (!result) return NextResponse.json({ error: 'Already processed', status: deposit.status }, { status: 409 });
    return NextResponse.json({ ok: true, credit: result.credit, username: result.deposit.users.username });
  }

  if (deposit.status !== 'PENDING' && deposit.status !== 'EXPIRED')
    return NextResponse.json({ error: 'Already processed', status: deposit.status }, { status: 409 });

  await prisma.deposit_requests.update({
    where: { id: body.depositId },
    data:  {
      status:    'REJECTED',
      comment:   `Отклонено в Telegram${body.actor ? ` (${body.actor})` : ''}`,
      updatedAt: new Date(),
    },
  });
  return NextResponse.json({ ok: true, username: deposit.users.username });
}
