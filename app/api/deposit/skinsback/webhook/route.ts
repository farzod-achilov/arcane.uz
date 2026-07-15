import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySignature } from '@/lib/skinsback/signature';
import { approveDeposit } from '@/lib/deposits/p2p';
import { getUsdToUzsRate } from '@/lib/shared/currency';
import { notifyAdminDepositNeedsReview } from '@/lib/adminTelegram';

/* ─────────────────────────────────────────────────────────
   POST /api/deposit/skinsback/webhook — SkinsBack "Result URL".
   https://skinsback.com/docs/api/v1/callback/

   Every field EXCEPT `sign` participates in the signature — see
   lib/skinsback/signature.ts. A forged/missing signature is the
   only thing standing between an attacker and free balance, so
   this is checked before anything else touches the DB.

   status values: success | fail | in_hold | hold_approved |
   hold_returned. Only success/hold_approved credit the balance.

   in_hold is Steam's own Trade Protection hold (up to 8 days when the
   depositor's account doesn't meet Steam's "trusted" criteria — e.g. no
   Mobile Authenticator for 7+ days — instant otherwise) — routine now
   that this is common, not an admin-actionable problem, so it's just
   recorded on the deposit row and left PENDING for the later
   hold_approved/hold_returned webhook to resolve. hold_returned (trade
   reverted) and any unrecognized status ARE left for manual review.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

async function readBody(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const j = await req.json().catch(() => ({}));
    return j && typeof j === 'object' ? j as Record<string, string> : {};
  }
  const form = await req.formData().catch(() => null);
  if (!form) return {};
  const out: Record<string, string> = {};
  form.forEach((v, k) => { if (typeof v === 'string') out[k] = v; });
  return out;
}

export async function POST(req: Request) {
  const params = await readBody(req);
  const sign   = params.sign ?? '';

  if (!verifySignature(params, sign)) {
    console.error('[SkinsBack webhook] invalid signature', { order_id: params.order_id });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const orderId = params.order_id;
  const status  = params.status;
  if (!orderId || !status) return NextResponse.json({ error: 'Missing order_id/status' }, { status: 400 });

  const deposit = await prisma.deposit_requests.findUnique({ where: { id: orderId } });
  if (!deposit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (deposit.method !== 'skinsback') return NextResponse.json({ error: 'Method mismatch' }, { status: 400 });

  if (status === 'fail') {
    await prisma.deposit_requests.updateMany({
      where: { id: orderId, status: 'PENDING' },
      data:  { status: 'REJECTED', comment: `SkinsBack: ${params.reason ?? 'fail'}`, updatedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  if (status === 'in_hold') {
    // Routine Steam Trade Protection hold, not an admin problem — record
    // it for visibility (support may need it if the customer asks "where's
    // my balance") and wait for hold_approved/hold_returned. No expiresAt
    // is ever set on skinsback deposits (see route.ts), so this can sit
    // PENDING for the full hold window without getting auto-expired.
    await prisma.deposit_requests.updateMany({
      where: { id: orderId, status: 'PENDING' },
      data:  { comment: `SkinsBack: в холде Steam Trade Protection (до 8 дней), ждём hold_approved`, updatedAt: new Date() },
    });
    return NextResponse.json({ ok: true, matched: false, hold: true });
  }

  if (status !== 'success' && status !== 'hold_approved') {
    // hold_returned (trade reverted by Steam) / unknown — не трогаем баланс, разбираем руками
    notifyAdminDepositNeedsReview('SkinsBack', `Заявка ${orderId}: статус "${status}" — не зачислено автоматически`)
      .catch(() => {});
    return NextResponse.json({ ok: true, matched: false });
  }

  const amountUsd = Number(params.amount);
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    console.error('[SkinsBack webhook] bad amount', params);
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const creditedUzs = Math.round(amountUsd * getUsdToUzsRate() / 1000) * 1000;

  // фиксируем сумму, пока заявка ещё PENDING — approveDeposit() ниже
  // идемпотентно защищает от повторной обработки того же вебхука
  await prisma.deposit_requests.updateMany({
    where: { id: orderId, status: 'PENDING' },
    data:  { uniqueAmount: creditedUzs, providerRef: params.transaction_id ?? deposit.providerRef },
  });

  const result = await approveDeposit(orderId, 'skinsback', `SkinsBack transaction #${params.transaction_id ?? '?'}`);
  if (!result) return NextResponse.json({ ok: true, matched: false, reason: 'already processed' });

  return NextResponse.json({ ok: true, matched: true, depositId: orderId });
}
