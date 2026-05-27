import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'ALL';
  const q      = (searchParams.get('q') ?? '').trim();
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit  = 30;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status === 'OPEN')        where.status = 'OPEN';
  if (status === 'IN_PROGRESS') where.status = 'IN_PROGRESS';
  if (status === 'RESOLVED')    where.status = 'RESOLVED';
  if (q) {
    where.OR = [
      { subject:          { contains: q, mode: 'insensitive' } },
      { user: { username: { contains: q, mode: 'insensitive' } } },
      { user: { email:    { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [tickets, total] = await Promise.all([
    prisma.support_tickets.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        user:     { select: { id: true, username: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { username: true } } },
        },
      },
    }),
    prisma.support_tickets.count({ where }),
  ]);

  return NextResponse.json({ tickets, total, pages: Math.ceil(total / limit) });
}
