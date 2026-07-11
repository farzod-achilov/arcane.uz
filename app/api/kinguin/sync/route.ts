import { NextResponse } from 'next/server';
import { syncProducts, getLastSyncResult, isKinguinEnabled } from '@/lib/kinguin';
import { requireAdmin } from '@/lib/apiGuard';

/* ─────────────────────────────────────────────────────────
   POST /api/kinguin/sync — trigger a full product re-sync
   GET  /api/kinguin/sync — return last sync result
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

export async function GET() {
  const last = getLastSyncResult();
  return NextResponse.json({
    enabled: isKinguinEnabled(),
    lastSync: last ?? null,
  });
}

export async function POST(request: Request) {
  const secret = request.headers.get('x-sync-secret');
  const expected = process.env.SYNC_SECRET;
  const secretOk = expected && secret === expected;

  if (!secretOk) {
    const guard = await requireAdmin();
    if (guard) return guard;
  }

  if (!isKinguinEnabled()) {
    return NextResponse.json({
      ok: false,
      error: 'Kinguin is not configured. Set KINGUIN_MERCHANT_API_KEY in .env.local',
    });
  }

  try {
    const result = await syncProducts();
    return NextResponse.json({ ok: result.ok, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    console.error('[Kinguin] sync error:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
