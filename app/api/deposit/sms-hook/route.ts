/* ─────────────────────────────────────────────────────────
   Webhook для SMS-forwarder'а (Android-приложение на телефоне
   с SIM-картой, привязанной к картам пула).

   Приложение пересылает сюда каждую банковскую SMS. Мы ищем
   PENDING-заявку с точно совпадающей уникальной суммой и
   автоматически зачисляем баланс.

   Защита: секрет в заголовке `x-sms-secret` или query `?secret=`.
───────────────────────────────────────────────────────── */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { matchSmsToDeposit, approveDeposit, expireStaleDeposits, extractSmsTimestamp } from '@/lib/deposits/p2p';
import { notifyAdminDepositAutoConfirmed, notifyAdminSmsUnmatched } from '@/lib/adminTelegram';

export const dynamic = 'force-dynamic';

async function readSms(req: Request): Promise<{ text: string; sender: string | null }> {
  const ct = req.headers.get('content-type') ?? '';
  try {
    if (ct.includes('application/json')) {
      const b = await req.json() as Record<string, unknown>;
      const text = [b.text, b.message, b.body, b.sms, b.msg].find(v => typeof v === 'string') as string | undefined;
      const sender = [b.sender, b.from, b.number].find(v => typeof v === 'string') as string | undefined;
      return { text: text ?? '', sender: sender ?? null };
    }
    if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const text = ['text', 'message', 'body', 'sms', 'msg']
        .map(k => form.get(k)).find(v => typeof v === 'string') as string | undefined;
      const sender = ['sender', 'from', 'number']
        .map(k => form.get(k)).find(v => typeof v === 'string') as string | undefined;
      return { text: text ?? '', sender: sender ?? null };
    }
    return { text: await req.text(), sender: null };
  } catch {
    return { text: '', sender: null };
  }
}

export async function POST(req: Request) {
  const secret = process.env.SMS_HOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'SMS hook disabled' }, { status: 503 });

  const url = new URL(req.url);
  const provided = req.headers.get('x-sms-secret') ?? url.searchParams.get('secret') ?? '';
  if (provided !== secret) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { text, sender } = await readSms(req);
  if (!text.trim()) return NextResponse.json({ error: 'Empty SMS' }, { status: 400 });

  await expireStaleDeposits();

  const log = await prisma.sms_logs.create({
    data: { raw: text.slice(0, 2000), sender },
  });

  // время операции из уведомления: старое (или «из будущего» при кривом
  // часовом поясе) — не зачисляем автоматически, отдаём человеку
  const txTime = extractSmsTimestamp(text);
  if (txTime && Math.abs(Date.now() - txTime.getTime()) > 90 * 60_000) {
    notifyAdminSmsUnmatched(
      `[время операции ${txTime.toISOString()} вне окна автозачисления]\n${text.slice(0, 400)}`,
      sender,
    ).catch(() => {});
    return NextResponse.json({ ok: true, matched: false, reason: 'stale timestamp' });
  }

  const deposit = await matchSmsToDeposit(text);
  if (!deposit) {
    // не каждая SMS — перевод (реклама, баланс); шумим только если похоже на приход денег
    const looksLikeIncome = /попол|перевод|поступ|приход|зачисл|perevod|popoln|postup|zachisl|o'tkaz|otkaz|to'ldir|toldir|kirim/i.test(text);
    if (looksLikeIncome) notifyAdminSmsUnmatched(text.slice(0, 400), sender).catch(() => {});
    return NextResponse.json({ ok: true, matched: false });
  }

  const result = await approveDeposit(deposit.id, 'sms', 'Автоматически подтверждено по SMS');
  if (!result) return NextResponse.json({ ok: true, matched: false, reason: 'already processed' });

  await prisma.sms_logs.update({ where: { id: log.id }, data: { matchedDepositId: deposit.id } });

  notifyAdminDepositAutoConfirmed({
    depositId: result.deposit.id,
    userName:  result.deposit.users.username,
    userEmail: result.deposit.users.email,
    credit:    result.credit,
    cardNumber: result.deposit.card?.cardNumber ?? '—',
  }).catch(() => {});

  return NextResponse.json({ ok: true, matched: true, depositId: deposit.id });
}
