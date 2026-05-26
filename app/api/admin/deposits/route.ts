import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'PENDING';
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit  = 25;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = status === 'ALL' ? {} : { status };

  const [deposits, total] = await Promise.all([
    prisma.deposit_requests.findMany({
      where,
      include: { users: { select: { id: true, username: true, email: true, balanceUzs: true } } },
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.deposit_requests.count({ where }),
  ]);

  return NextResponse.json({ deposits, total, pages: Math.ceil(total / limit) });
}
