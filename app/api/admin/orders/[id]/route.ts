import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/delivery/audit';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

const DIRECT_STATUSES = ['PENDING', 'PAID', 'WAITING_MANUAL', 'CANCELLED'] as const;
type DirectStatus = typeof DIRECT_STATUSES[number];

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { status } = await req.json() as { status?: string };

  // COMPLETED must go through /api/orders/[id]/manual-complete — that's the
  // only path that actually delivers a key, writes delivery_logs, and bumps
  // salesCount. Setting it directly here used to mark orders "done" with the
  // customer never receiving anything.
  if (status === 'COMPLETED') {
    return NextResponse.json(
      { error: 'Используйте кнопку "Выполнить заказ" — она доставляет ключ и создаёт запись в истории' },
      { status: 400 },
    );
  }
  if (!DIRECT_STATUSES.includes(status as DirectStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${DIRECT_STATUSES.join(', ')}` },
      { status: 400 },
    );
  }

  const existing = await prisma.orders.findUnique({ where: { id: params.id }, select: { status: true } });
  if (!existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const order = await prisma.orders.update({
    where:  { id: params.id },
    data:   { status: status as DirectStatus },
    select: { id: true, status: true },
  });

  await auditLog(
    params.id,
    status === 'CANCELLED' ? 'ORDER_CANCELLED' : 'ADMIN_STATUS_OVERRIDE',
    `admin:${session.user.id}`,
    undefined,
    { from: existing.status, to: status, actorName: session.user.name ?? session.user.email },
  );

  return NextResponse.json({ ok: true, order });
}
