import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as { amount?: number };
  const amount = Math.round(body.amount ?? 0);
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

  const user = await prisma.users.findUnique({ where: { id: params.id }, select: { balanceUzs: true } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const updated = await prisma.users.update({
    where:  { id: params.id },
    data:   { balanceUzs: { increment: amount } },
    select: { id: true, username: true, balanceUzs: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}
