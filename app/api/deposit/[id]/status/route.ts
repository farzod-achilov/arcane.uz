import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { expireStaleDeposits } from '@/lib/deposits/p2p';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await expireStaleDeposits();

  const deposit = await prisma.deposit_requests.findUnique({
    where:   { id: params.id },
    include: { card: true },
  });
  if (!deposit || deposit.userId !== session.user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    id:           deposit.id,
    status:       deposit.status,
    amount:       deposit.amount,
    uniqueAmount: deposit.uniqueAmount,
    expiresAt:    deposit.expiresAt,
    credited:     deposit.status === 'APPROVED' ? (deposit.uniqueAmount ?? deposit.amount) : null,
    card: deposit.card ? {
      cardNumber: deposit.card.cardNumber,
      holderName: deposit.card.holderName,
      bank:       deposit.card.bank,
    } : null,
  });
}
