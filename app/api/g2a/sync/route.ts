import { NextResponse } from 'next/server';
import { syncProducts, getLastSyncResult, isG2aEnabled } from '@/lib/g2a';
import { requireAdmin } from '@/lib/apiGuard';

/* POST/GET /api/g2a/sync — ⚠ UNVERIFIED integration, see lib/g2a/config.ts */

export const dynamic = 'force-dynamic';

export async function GET() {
  const last = getLastSyncResult();
  return NextResponse.json({
    enabled: isG2aEnabled(),
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

  if (!isG2aEnabled()) {
    return NextResponse.json({
      ok: false,
      error: 'G2A is not configured. Set G2A_CLIENT_ID and G2A_CLIENT_SECRET in .env.local',
    });
  }

  try {
    const result = await syncProducts();
    return NextResponse.json({ ok: result.ok, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    console.error('[G2A] sync error:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
