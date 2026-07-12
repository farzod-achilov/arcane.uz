import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/cryptobot/signature';
import { approveDeposit } from '@/lib/deposits/p2p';
import { getUsdToUzsRate } from '@/lib/shared/currency';
import { notifyAdminDepositNeedsReview } from '@/lib/adminTelegram';

/* ─────────────────────────────────────────────────────────
   POST /api/deposit/cryptobot/webhook — Crypto Pay webhook.
   https://help.send.tg/en/articles/10279948-crypto-pay-api

   Signature covers the RAW request body bytes (unparsed JSON
   string) — must read req.text() and verify BEFORE JSON.parse.
   Re-serializing the parsed object would not reproduce Crypto
   Pay's exact formatting and would silently break verification.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

interface Invoice {
  invoice_id:  number;
  status:      'active' | 'paid' | 'expired';
  asset?:      string;
  amount:      string;
  paid_asset?: string;
  paid_amount?: string;
  payload?:    string; // наш deposit_requests.id, установлен при createInvoice
}

interface WebhookBody {
  update_type: string;
  payload: Invoice;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('crypto-pay-api-signature') ?? '';

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('[CryptoPay webhook] invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const body = JSON.parse(rawBody) as WebhookBody;
  if (body.update_type !== 'invoice_paid') return NextResponse.json({ ok: true, ignored: true });

  const invoice = body.payload;
  const orderId = invoice?.payload;
  if (!orderId) return NextResponse.json({ error: 'Missing order payload' }, { status: 400 });

  const deposit = await prisma.deposit_requests.findUnique({ where: { id: orderId } });
  if (!deposit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (deposit.method !== 'cryptobot') return NextResponse.json({ error: 'Method mismatch' }, { status: 400 });

  if (invoice.status !== 'paid') {
    notifyAdminDepositNeedsReview('Crypto Pay', `Заявка ${orderId}: статус инвойса "${invoice.status}" — не зачислено`)
      .catch(() => {});
    return NextResponse.json({ ok: true, matched: false });
  }

  // мы всегда запрашиваем invoice в USDT (createInvoice не разрешает своп в другой актив) —
  // если пришло что-то иное, это неожиданно и лучше не гадать с конвертацией
  const paidAsset = invoice.paid_asset ?? invoice.asset;
  const paidAmount = Number(invoice.paid_amount ?? invoice.amount);
  if (paidAsset !== 'USDT' || !Number.isFinite(paidAmount) || paidAmount <= 0) {
    notifyAdminDepositNeedsReview('Crypto Pay', `Заявка ${orderId}: неожиданный актив/сумма (${paidAsset} ${invoice.paid_amount ?? invoice.amount}) — не зачислено`)
      .catch(() => {});
    return NextResponse.json({ ok: true, matched: false, reason: 'unexpected asset' });
  }

  const creditedUzs = Math.round(paidAmount * getUsdToUzsRate() / 1000) * 1000;

  await prisma.deposit_requests.updateMany({
    where: { id: orderId, status: 'PENDING' },
    data:  { uniqueAmount: creditedUzs, providerRef: String(invoice.invoice_id) },
  });

  const result = await approveDeposit(orderId, 'cryptobot', `Crypto Pay invoice #${invoice.invoice_id}`);
  if (!result) return NextResponse.json({ ok: true, matched: false, reason: 'already processed' });

  return NextResponse.json({ ok: true, matched: true, depositId: orderId });
}
