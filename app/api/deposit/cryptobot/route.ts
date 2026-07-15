import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { rateLimit } from '@/lib/rateLimit';
import { isCryptobotEnabled } from '@/lib/cryptobot/config';
import { createInvoice } from '@/lib/cryptobot/client';
import { getCurrencySettings } from '@/lib/smartPricing/repository';

/* ─────────────────────────────────────────────────────────
   POST /api/deposit/cryptobot — start a balance top-up paid in
   USDT via @CryptoBot's Crypto Pay. Same deposit_requests table
   and approveDeposit() as the card/SkinsBack flows — just a
   different `method`.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limited = rateLimit(req, { limit: 10, windowSec: 600, key: `deposit-cryptobot:${session.user.id}` });
  if (limited) return limited;

  if (!isCryptobotEnabled()) {
    return NextResponse.json({ error: 'Оплата в USDT временно недоступна' }, { status: 503 });
  }

  const body   = await req.json() as { amount?: number };
  const amount = Math.round(body.amount ?? 0);

  if (!amount || amount < 10_000)
    return NextResponse.json({ error: 'Минимальная сумма 10 000 сум' }, { status: 400 });
  if (amount > 10_000_000)
    return NextResponse.json({ error: 'Максимальная сумма 10 000 000 сум' }, { status: 400 });

  const rate      = (await getCurrencySettings()).exchangeRate;
  const amountUsdt = Math.round((amount / rate) * 100) / 100;
  if (amountUsdt < 1) {
    return NextResponse.json({ error: 'Слишком маленькая сумма для оплаты в USDT' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://arcane.com.uz';
  const id     = nanoid();

  const deposit = await prisma.deposit_requests.create({
    data: {
      id,
      userId:    session.user.id,
      amount,
      method:    'cryptobot',
      status:    'PENDING',
      updatedAt: new Date(),
    },
  });

  const invoice = await createInvoice({
    orderId:      deposit.id,
    amountUsdt,
    paidBtnUrl:   `${appUrl}/deposit?cryptobot=success&id=${deposit.id}`,
    expiresInSec: 20 * 60,
  });

  if (!invoice.ok) {
    await prisma.deposit_requests.update({
      where: { id: deposit.id },
      data:  { status: 'REJECTED', comment: `Crypto Pay: ${invoice.error}`, updatedAt: new Date() },
    });
    return NextResponse.json({ error: 'Не удалось создать счёт в USDT, попробуйте позже' }, { status: 502 });
  }

  await prisma.deposit_requests.update({
    where: { id: deposit.id },
    data:  { providerRef: String(invoice.invoiceId) },
  });

  return NextResponse.json({ ok: true, id: deposit.id, redirectUrl: invoice.payUrl, amountUsdt });
}
