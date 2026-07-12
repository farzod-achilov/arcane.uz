import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processDelivery, DeliveryError } from '@/lib/delivery';

export const dynamic = 'force-dynamic';

/* ─────────────────────────────────────────────────────────
   POST /api/orders/[id]/retry-dropship

   Re-runs processDelivery() for an order stuck in WAITING_MANUAL
   because a dropship purchase failed (cold catalog cache, supplier
   balance, transient network error — all things that can resolve
   themselves without any code change). Safe to call repeatedly:
   dropshipDeliver() skips items that already have a key from a
   prior attempt rather than re-purchasing them.

   Was previously done by hand via SQL — see /admin/deliveries.
───────────────────────────────────────────────────────── */

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const result = await processDelivery(params.id);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    if (err instanceof DeliveryError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    console.error('[retry-dropship]', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
