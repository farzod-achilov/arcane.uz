import { NextResponse } from 'next/server';
import { retryWaitingOrders } from '@/lib/orders/delivery';
import { requireAdmin } from '@/lib/apiGuard';

export async function POST() {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const result = await retryWaitingOrders();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[fulfill-waiting] unexpected error', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
