import { NextRequest, NextResponse } from 'next/server';
import { createOrder, listOrders } from '@/lib/orders/service';
import { OrderError } from '@/lib/orders/types';
import { notifyAdminNewOrder } from '@/lib/adminTelegram';

export const dynamic = 'force-dynamic';

/** GET /api/orders?userId=&status=&limit=&offset= */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const result = await listOrders({
      userId: sp.get('userId') ?? undefined,
      status: (sp.get('status') as never) ?? undefined,
      limit:  sp.get('limit')  ? parseInt(sp.get('limit')!)  : 20,
      offset: sp.get('offset') ? parseInt(sp.get('offset')!) : 0,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return handleError(err);
  }
}

/** POST /api/orders — { userId, items: [{ gameId }] } */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const order = await createOrder(body);

    // Notify admin via Telegram (non-blocking)
    notifyAdminNewOrder({
      id:               order.id,
      productTitle:     order.items?.map(i => i.game?.title).join(', ') ?? '—',
      productImage:     order.items?.[0]?.game?.cover ?? '',
      price:            order.totalPrice,
      customerName:     order.user?.username ?? '—',
      customerEmail:    order.user?.email    ?? '—',
      customerTelegram: '',
      status:           'pending',
      createdAt:        order.createdAt.toISOString(),
    } as never).catch(console.error);

    return NextResponse.json({ success: true, order }, { status: 201 });
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
