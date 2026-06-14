import { NextRequest, NextResponse } from 'next/server';
import { createOrder, listOrders } from '@/lib/orders/service';
import { OrderError } from '@/lib/orders/types';
import { notifyAdminNewOrder } from '@/lib/adminTelegram';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { requireSession, requireAdmin } from '@/lib/apiGuard';

export const dynamic = 'force-dynamic';

/** GET /api/orders?userId=&status=&limit=&offset= */
export async function GET(req: NextRequest) {
  try {
    const { guard, session } = await requireSession();
    if (guard) return guard;

    const sp = req.nextUrl.searchParams;

    // Non-admins can only see their own orders
    const requestedUserId = sp.get('userId') ?? undefined;
    const userId = session!.user.isAdmin ? requestedUserId : (session!.user as { id: string }).id;

    const result = await listOrders({
      userId,
      status: (sp.get('status') as never) ?? undefined,
      limit:  sp.get('limit')  ? parseInt(sp.get('limit')!)  : 20,
      offset: sp.get('offset') ? parseInt(sp.get('offset')!) : 0,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return handleError(err);
  }
}

/** POST /api/orders — { items: [{ gameId }], paymentMethod?, promoId?, coinsToUse? } */
export async function POST(req: NextRequest) {
  try {
    const { guard, session } = await requireSession();
    if (guard) return guard;

    const body = await req.json();

    // Always use the authenticated user's ID — never trust userId from the request body
    const userId = (session!.user as { id: string }).id;
    const order = await createOrder({ ...body, userId });

    // Email order confirmation to customer (non-blocking)
    if (order.user?.email) {
      sendOrderConfirmationEmail({
        to:         order.user.email,
        username:   order.user.username ?? '—',
        orderId:    order.id,
        items:      (order.items ?? []).map(i => ({ title: i.game?.title ?? '—', price: i.price })),
        totalPrice: order.totalPrice,
      }).catch(() => {});
    }

    // Notify admin via Telegram (non-blocking)
    notifyAdminNewOrder({
      id:           order.id,
      productTitle: order.items?.map(i => i.game?.title).join(', ') ?? '—',
      price:        order.totalPrice,
      customerName: order.user?.username ?? '—',
      customerEmail: order.user?.email   ?? '—',
    }).catch(console.error);

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
