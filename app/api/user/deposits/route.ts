import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const deposits = await prisma.deposit_requests.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take:    50,
    select:  { id: true, amount: true, uniqueAmount: true, method: true, status: true, comment: true, createdAt: true },
  });

  return NextResponse.json({ deposits });
}
