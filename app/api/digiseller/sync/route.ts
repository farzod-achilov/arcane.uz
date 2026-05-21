import { NextResponse } from 'next/server';
import { syncProducts, getLastSyncResult, isDigisellerEnabled } from '@/lib/digiseller';

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
  // Optional: protect with a secret header in production
  const secret = request.headers.get('x-sync-secret');
  const expected = process.env.SYNC_SECRET;
  if (expected && secret !== expected) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
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
