import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.users.findUnique({
    where:  { id: session.user.id },
    select: { arcCoins: true, balanceUzs: true },
  });

  return NextResponse.json({ arcCoins: user?.arcCoins ?? 0, balanceUzs: user?.balanceUzs ?? 0 });
}
