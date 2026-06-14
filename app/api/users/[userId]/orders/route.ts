import { NextRequest, NextResponse } from 'next/server';
import { getUserOrders } from '@/lib/orders/service';
import { OrderError } from '@/lib/orders/types';
import { requireSession } from '@/lib/apiGuard';

export const dynamic = 'force-dynamic';

/** GET /api/users/:userId/orders — owner or admin only */
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const { guard, session } = await requireSession();
    if (guard) return guard;

    if (!session!.user.isAdmin && (session!.user as { id: string }).id !== params.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

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
