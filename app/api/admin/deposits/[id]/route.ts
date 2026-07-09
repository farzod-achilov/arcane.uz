import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { approveDeposit } from '@/lib/deposits/p2p';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as { action: 'approve' | 'reject'; comment?: string };

  const deposit = await prisma.deposit_requests.findUnique({ where: { id: params.id } });
  if (!deposit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (body.action === 'approve') {
    // EXPIRED тоже можно подтвердить — деньги могли прийти после таймера
    const result = await approveDeposit(params.id, 'admin', body.comment);
    if (!result) return NextResponse.json({ error: 'Already processed' }, { status: 400 });
  } else {
    if (deposit.status !== 'PENDING' && deposit.status !== 'EXPIRED')
      return NextResponse.json({ error: 'Already processed' }, { status: 400 });
    await prisma.deposit_requests.update({
      where: { id: params.id },
      data:  { status: 'REJECTED', comment: body.comment ?? null, updatedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
