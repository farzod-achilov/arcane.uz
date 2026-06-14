import { NextRequest, NextResponse } from 'next/server';
import { confirmPaymentAndDeliver } from '@/lib/orders/delivery';
import { OrderError } from '@/lib/orders/types';
import { requireAdmin } from '@/lib/apiGuard';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const result = await confirmPaymentAndDeliver(params.id);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.statusCode },
      );
    }
    console.error('[fulfill] unexpected error', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
