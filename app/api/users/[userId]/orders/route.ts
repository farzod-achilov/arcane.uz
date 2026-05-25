import { NextRequest, NextResponse } from 'next/server';
import { getUserOrders } from '@/lib/orders/service';
import { OrderError } from '@/lib/orders/types';

export const dynamic = 'force-dynamic';

/** GET /api/users/:userId/orders?limit=&offset= */
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const sp     = req.nextUrl.searchParams;
    const limit  = sp.get('limit')  ? parseInt(sp.get('limit')!)  : 20;
    const offset = sp.get('offset') ? parseInt(sp.get('offset')!) : 0;

    const result = await getUserOrders(params.userId, limit, offset);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.statusCode },
      );
    }
    console.error('[User Orders API]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
