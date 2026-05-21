import { NextResponse } from 'next/server';
import { getPurchaseUrl } from '@/lib/digiseller';

/* ─────────────────────────────────────────────────────────
   GET /api/digiseller/purchase/[id]
   Returns the Digiseller purchase page URL for a good_id.
   Frontend redirects users here to complete payment.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const goodId = Number(params.id);
  if (Number.isNaN(goodId)) {
    return NextResponse.json({ ok: false, error: 'Invalid good ID' }, { status: 400 });
  }

  const url = getPurchaseUrl(goodId);
  return NextResponse.json({ ok: true, purchaseUrl: url, goodId });
}
