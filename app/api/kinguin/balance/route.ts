import { NextResponse } from 'next/server';
import { getBalance, buildTopUpUrl, isKinguinEnabled } from '@/lib/kinguin';
import { requireAdmin } from '@/lib/apiGuard';

/* ─────────────────────────────────────────────────────────
   GET /api/kinguin/balance — current merchant balance, admin-only.
   Shown in /admin/suppliers next to the "Пополнить" (top-up) button.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  if (!isKinguinEnabled()) {
    return NextResponse.json({ ok: false, enabled: false, error: 'Kinguin not configured' });
  }

  const balance = await getBalance();
  if (balance == null) {
    return NextResponse.json({ ok: false, enabled: true, error: 'Failed to fetch balance' }, { status: 502 });
  }

  return NextResponse.json({ ok: true, enabled: true, balanceUsd: balance, topUpUrl: buildTopUpUrl() });
}
