import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** Отмена собственной PENDING-заявки (кнопка «выбрать другую сумму») */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cancelled = await prisma.deposit_requests.updateMany({
    where: { id: params.id, userId: session.user.id, status: 'PENDING' },
    data:  { status: 'EXPIRED', comment: 'Отменено пользователем', updatedAt: new Date() },
  });

  if (cancelled.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
