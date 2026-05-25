import { NextRequest, NextResponse } from 'next/server';
import { getOrder, patchOrderStatus } from '@/lib/orders/service';
import { OrderError } from '@/lib/orders/types';

export const dynamic = 'force-dynamic';

/** GET /api/orders/:id */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const order = await getOrder(params.id);
    return NextResponse.json({ success: true, order });
  } catch (err) {
    return handleError(err);
  }
}

/** PATCH /api/orders/:id  { status: 'PAID' | 'COMPLETED' | 'CANCELLED' } */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
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
