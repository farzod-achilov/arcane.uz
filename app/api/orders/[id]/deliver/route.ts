import { NextResponse } from 'next/server';
import { getOrder, setGameKey, markDelivered } from '@/lib/orders';
import { sendKeyToCustomer, notifyAdminDelivered } from '@/lib/adminTelegram';

export const dynamic = 'force-dynamic';

/** POST /api/orders/[id]/deliver — admin sets key and sends to customer */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { id }  = params;
  const { key } = await req.json();

  if (!key?.trim()) {
    return NextResponse.json({ ok: false, error: 'Game key required' }, { status: 400 });
  }

  let order = setGameKey(id, key.trim());
  if (!order) {
    return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
  }

  const { sent, method } = await sendKeyToCustomer(order);

  order = markDelivered(id)!;
  notifyAdminDelivered(order).catch(console.error);

  return NextResponse.json({ ok: true, sent, method, order });
}
