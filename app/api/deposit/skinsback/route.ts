import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { rateLimit } from '@/lib/rateLimit';
import { isSkinsbackEnabled } from '@/lib/skinsback/config';
import { createOrder } from '@/lib/skinsback/client';
import { getUsdToUzsRate } from '@/lib/shared/currency';

/* ─────────────────────────────────────────────────────────
   POST /api/deposit/skinsback — start a balance top-up paid
   with CS2/Dota2/Rust skins via SkinsBack.

   Same deposit_requests table as the P2P card flow — just a
   different `method` and no card/uniqueAmount.

   `amount` is OPTIONAL: skin prices are discrete/whatever the customer's
   inventory has, so forcing them to first pick an exact UZS target on our
   own page (then match it with skins) is unnecessary friction — clicking
   "Скины" can jump straight to SkinsBack with an open amount range (see
   lib/skinsback/client.ts's OPEN_MIN/MAX_USD) and let the customer trade
   whatever they want. Either way, whatever the webhook reports back is
   trusted as the credited amount, not what was requested here.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limited = rateLimit(req, { limit: 10, windowSec: 600, key: `deposit-skinsback:${session.user.id}` });
  if (limited) return limited;

  if (!isSkinsbackEnabled()) {
    return NextResponse.json({ error: 'Оплата скинами временно недоступна' }, { status: 503 });
  }

  const body   = await req.json() as { amount?: number };
  const amount = body.amount != null ? Math.round(body.amount) : null;

  if (amount != null) {
    if (amount < 10_000)
      return NextResponse.json({ error: 'Минимальная сумма 10 000 сум' }, { status: 400 });
    if (amount > 10_000_000)
      return NextResponse.json({ error: 'Максимальная сумма 10 000 000 сум' }, { status: 400 });
  }

  const rate      = getUsdToUzsRate();
  const amountUsd = amount != null ? Math.round((amount / rate) * 100) / 100 : undefined;
  if (amountUsd != null && amountUsd < 1) {
    return NextResponse.json({ error: 'Слишком маленькая сумма для оплаты скинами' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://arcane.com.uz';
  const id     = nanoid();

  const deposit = await prisma.deposit_requests.create({
    data: {
      id,
      userId:    session.user.id,
      amount:    amount ?? 0, // 0 = open amount, actual sum lands in uniqueAmount via the webhook
      method:    'skinsback',
      status:    'PENDING',
      updatedAt: new Date(),
    },
  });

  const order = await createOrder({
    orderId:    deposit.id,
    amountUsd,
    successUrl: `${appUrl}/deposit?skinsback=success&id=${deposit.id}`,
    failUrl:    `${appUrl}/deposit?skinsback=fail&id=${deposit.id}`,
    resultUrl:  `${appUrl}/api/deposit/skinsback/webhook`,
  });

  if (!order.ok) {
    await prisma.deposit_requests.update({
      where: { id: deposit.id },
      data:  { status: 'REJECTED', comment: `SkinsBack: ${order.error}`, updatedAt: new Date() },
    });
    return NextResponse.json({ error: 'Не удалось создать оплату скинами, попробуйте позже' }, { status: 502 });
  }

  await prisma.deposit_requests.update({
    where: { id: deposit.id },
    data:  { providerRef: String(order.transactionId) },
  });

  return NextResponse.json({ ok: true, id: deposit.id, redirectUrl: order.url, amountUsd });
}
