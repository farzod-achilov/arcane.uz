import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { completeManual, DeliveryError } from '@/lib/delivery';

export const dynamic = 'force-dynamic';

/** POST /api/orders/[id]/manual-complete */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { deliveryNote, keyValue } = body as Record<string, string>;

    const order = await completeManual({
      orderId:     params.id,
      actorId:     session.user.id,
      actorName:   session.user.name ?? session.user.email ?? 'Admin',
      deliveryNote,
      keyValue,
    });

    return NextResponse.json({ ok: true, order });
  } catch (err) {
    if (err instanceof DeliveryError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    console.error('[manual-complete]', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
