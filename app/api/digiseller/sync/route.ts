import { NextResponse } from 'next/server';
import { syncProducts, getLastSyncResult, isDigisellerEnabled } from '@/lib/digiseller';
import { requireAdmin } from '@/lib/apiGuard';

/* ─────────────────────────────────────────────────────────
   POST /api/digiseller/sync  — trigger a full product re-sync
   GET  /api/digiseller/sync  — return last sync result
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

export async function GET() {
  const last = getLastSyncResult();
  return NextResponse.json({
    enabled: isDigisellerEnabled(),
    lastSync: last ?? null,
  });
}

export async function POST(request: Request) {
  // Allow either admin session OR matching sync secret (for cron/CI use)
  const secret = request.headers.get('x-sync-secret');
  const expected = process.env.SYNC_SECRET;
  const secretOk = expected && secret === expected;

  if (!secretOk) {
    const guard = await requireAdmin();
    if (guard) return guard;
  }

  if (!isDigisellerEnabled()) {
    return NextResponse.json({
      ok: false,
      error: 'Digiseller is not configured. Set DIGISELLER_SELLER_ID and DIGISELLER_API_KEY in .env.local',
    });
  }

  try {
    const result = await syncProducts();
    return NextResponse.json({ ok: result.ok, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    console.error('[Digiseller] sync error:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
