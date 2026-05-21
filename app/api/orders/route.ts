import { NextResponse } from 'next/server';
import { createOrder, getAllOrders } from '@/lib/orders';
import { notifyAdminNewOrder } from '@/lib/adminTelegram';

export const dynamic = 'force-dynamic';

/** GET /api/orders — list all orders (admin) */
export async function GET() {
  return NextResponse.json({ orders: getAllOrders() });
}

/** POST /api/orders — create new order after payment */
export async function POST(req: Request) {
  const body = await req.json();

  const order = createOrder({
    productId:        body.productId,
    productTitle:     body.productTitle,
    productImage:     body.productImage ?? '',
    platform:         body.platform,
    price:            body.price,
    customerName:     body.customerName,
    customerEmail:    body.customerEmail,
    customerTelegram: body.customerTelegram,
    deliveryType:     'manual_delivery',
    paymentMethod:    body.paymentMethod,
  });

  // Notify admin immediately
  notifyAdminNewOrder(order).catch(console.error);

  return NextResponse.json({ ok: true, order });
}
