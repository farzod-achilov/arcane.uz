import { NextResponse } from 'next/server';
import { syncProducts, getLastSyncResult, isGamivoEnabled } from '@/lib/gamivo';
import { requireAdmin } from '@/lib/apiGuard';

/* POST/GET /api/gamivo/sync — ⚠ UNVERIFIED integration, see lib/gamivo/config.ts */

export const dynamic = 'force-dynamic';

export async function GET() {
  const last = getLastSyncResult();
  return NextResponse.json({
    enabled: isGamivoEnabled(),
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

  if (!isGamivoEnabled()) {
    return NextResponse.json({
      ok: false,
      error: 'Gamivo is not configured. Set GAMIVO_API_KEY and GAMIVO_CLIENT_SECRET in .env.local',
    });
  }

  try {
    const result = await syncProducts();
    return NextResponse.json({ ok: result.ok, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    console.error('[Gamivo] sync error:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
