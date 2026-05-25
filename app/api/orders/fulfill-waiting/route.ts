import { NextResponse } from 'next/server';
import { retryWaitingOrders } from '@/lib/orders/delivery';

export async function POST() {
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
