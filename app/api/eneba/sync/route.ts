import { NextResponse } from 'next/server';
import { syncProducts, getLastSyncResult, isEnebaEnabled } from '@/lib/eneba';
import { requireAdmin } from '@/lib/apiGuard';

/* ─────────────────────────────────────────────────────────
   POST /api/eneba/sync — trigger a full product re-sync
   GET  /api/eneba/sync — return last sync result
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

export async function GET() {
  const last = getLastSyncResult();
  return NextResponse.json({
    enabled: isEnebaEnabled(),
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

  if (!isEnebaEnabled()) {
    return NextResponse.json({
      ok: false,
      error: 'Eneba is not configured. Set ENEBA_AUTH_ID and ENEBA_AUTH_SECRET in .env.local',
    });
  }

  try {
    const result = await syncProducts();
    return NextResponse.json({ ok: result.ok, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    console.error('[Eneba] sync error:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
