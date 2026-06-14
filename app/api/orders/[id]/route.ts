import { NextRequest, NextResponse } from 'next/server';
import { getOrder, patchOrderStatus } from '@/lib/orders/service';
import { OrderError } from '@/lib/orders/types';
import { requireAdmin, requireSession } from '@/lib/apiGuard';

export const dynamic = 'force-dynamic';

/** GET /api/orders/:id — owner or admin only */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { guard, session } = await requireSession();
    if (guard) return guard;

    const order = await getOrder(params.id);
    if (!order) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    if (!session!.user.isAdmin && order.userId !== (session!.user as { id: string }).id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    return handleError(err);
  }
}

/** PATCH /api/orders/:id — admin only */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const guard = await requireAdmin();
    if (guard) return guard;

    const { status } = await req.json();
    const order = await patchOrderStatus(params.id, status);
    return NextResponse.json({ success: true, order });
  } catch (err) {
    return handleError(err);
  }
}

function handleError(err: unknown): NextResponse {
  if (err instanceof OrderError) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code },
      { status: err.statusCode },
    );
  }
  console.error('[Orders API]', err);
  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
}
