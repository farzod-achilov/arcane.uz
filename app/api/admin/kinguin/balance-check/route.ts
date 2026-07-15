import { NextResponse } from 'next/server';
import { getBalance, buildTopUpUrl, isKinguinEnabled } from '@/lib/kinguin';
import { kinguinCache, CK } from '@/lib/kinguin/cache';
import { notifyAdminLowSupplierBalance } from '@/lib/adminTelegram';
import { requireAdmin } from '@/lib/apiGuard';

/* ─────────────────────────────────────────────────────────
   POST /api/admin/kinguin/balance-check

   Fires a Telegram alert to the admin when the Kinguin merchant
   balance drops below KINGUIN_LOW_BALANCE_USD (default $5) — the
   goal is to find out before a real customer's dropship order fails
   with InsufficientBalance and silently falls back to manual
   delivery, not after. Called on a schedule by arcane-api's cron
   (x-sync-secret) and re-checkable manually from the admin.

   De-dup: once an alert fires, it won't fire again for
   ALERT_COOLDOWN_SECONDS even if still low — avoids spamming the
   admin chat every cron cycle while the balance stays low. Resets
   automatically once the balance recovers above the threshold.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

const DEFAULT_THRESHOLD_USD = 5;
const ALERT_COOLDOWN_SECONDS = 12 * 60 * 60; // 12h

export async function POST(request: Request) {
  const secret   = request.headers.get('x-sync-secret');
  const expected = process.env.SYNC_SECRET;
  const secretOk = expected && secret === expected;
  if (!secretOk) {
    const guard = await requireAdmin();
    if (guard) return guard;
  }

  if (!isKinguinEnabled()) {
    return NextResponse.json({ ok: false, error: 'Kinguin is not configured' });
  }

  // Temporary kill switch — balance is known to be low already, admin doesn't
  // want repeat Telegram pings about it right now. Does NOT touch the actual
  // fallback-to-manual-delivery safety net (lib/kinguin/kinguinService.ts) —
  // orders still correctly divert to WAITING_MANUAL on insufficient balance,
  // this only silences the proactive heads-up alert.
  if (process.env.KINGUIN_LOW_BALANCE_ALERT_DISABLED === 'true') {
    return NextResponse.json({ ok: true, alerted: false, note: 'alerts disabled via KINGUIN_LOW_BALANCE_ALERT_DISABLED' });
  }

  const threshold = Number(process.env.KINGUIN_LOW_BALANCE_USD ?? DEFAULT_THRESHOLD_USD);
  const balance = await getBalance();

  if (balance == null) {
    return NextResponse.json({ ok: false, error: 'Failed to fetch balance' }, { status: 502 });
  }

  const isLow = balance < threshold;
  const alreadyAlerted = kinguinCache.get<boolean>(CK.lowBalanceAlertSent()) ?? false;

  if (!isLow) {
    // Balance recovered — clear the marker so the next dip alerts again
    kinguinCache.delete(CK.lowBalanceAlertSent());
    return NextResponse.json({ ok: true, balanceUsd: balance, threshold, alerted: false });
  }

  if (alreadyAlerted) {
    return NextResponse.json({ ok: true, balanceUsd: balance, threshold, alerted: false, note: 'already alerted, in cooldown' });
  }

  await notifyAdminLowSupplierBalance({
    supplier: 'Kinguin', balanceUsd: balance, thresholdUsd: threshold, topUpUrl: buildTopUpUrl(),
  });
  kinguinCache.set(CK.lowBalanceAlertSent(), true, ALERT_COOLDOWN_SECONDS);

  return NextResponse.json({ ok: true, balanceUsd: balance, threshold, alerted: true });
}
