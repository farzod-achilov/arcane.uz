import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** GET /api/orders/manual?status=&q=&limit=&offset= */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const sp     = req.nextUrl.searchParams;
    const status = sp.get('status') ?? undefined;
    const q      = sp.get('q')?.trim() ?? undefined;
    const limit  = Math.min(parseInt(sp.get('limit')  ?? '50', 10), 100);
    const offset = parseInt(sp.get('offset') ?? '0', 10);

    const where = {
      ...(status
        ? { status: status as never }
        : { status: { in: ['PAID', 'WAITING_MANUAL', 'COMPLETED', 'CANCELLED'] as never[] } }),
      ...(q ? {
        OR: [
          { user:  { username: { contains: q, mode: 'insensitive' as const } } },
          { user:  { email:    { contains: q, mode: 'insensitive' as const } } },
          { items: { some: { game: { title: { contains: q, mode: 'insensitive' as const } } } } },
          { id:    { contains: q } },
        ],
      } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        include: {
          user:  { select: { id: true, username: true, email: true } },
          items: {
            include: {
              game: {
                select: { id: true, title: true, cover: true, slug: true, deliveryType: true },
              },
            },
          },
          delivery_logs: {
            orderBy: { createdAt: 'asc' },
            select:  { id: true, action: true, actor: true, note: true, createdAt: true },
          },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        take:    limit,
        skip:    offset,
      }),
      prisma.orders.count({ where }),
    ]);

    // Aggregate counts per status for stats
    const stats = await prisma.orders.groupBy({
      by:    ['status'],
      where: { status: { in: ['PAID', 'WAITING_MANUAL', 'COMPLETED'] as never[] } },
      _count: { _all: true },
    });

    return NextResponse.json({ ok: true, orders, total, stats });
  } catch (err) {
    console.error('[GET /api/orders/manual]', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
