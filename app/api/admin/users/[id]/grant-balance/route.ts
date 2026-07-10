import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as { amount?: number; description?: string };
  const amount = Math.round(body.amount ?? 0);
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

  const description = body.description?.trim() || 'Начисление баланса от администратора';

  const user = await prisma.users.findUnique({ where: { id: params.id }, select: { balanceUzs: true } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const [updated] = await prisma.$transaction([
    prisma.users.update({
      where:  { id: params.id },
      data:   { balanceUzs: { increment: amount } },
      select: { id: true, username: true, balanceUzs: true },
    }),
    prisma.transactions.create({
      data: {
        id:            nanoid(),
        userId:        params.id,
        type:          'ADMIN_GRANT',
        amount,
        balanceBefore: user.balanceUzs,
        balanceAfter:  user.balanceUzs + amount,
        description,
        metadata:      { grantedBy: session.user.email, kind: 'balanceUzs' },
      },
    }),
  ]);

  return NextResponse.json({ ok: true, user: updated });
}
