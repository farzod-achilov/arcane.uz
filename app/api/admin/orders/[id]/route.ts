import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { status } = await req.json() as { status: string };

  const order = await prisma.orders.update({
    where: { id: params.id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data:  { status: status as any },
    select: { id: true, status: true },
  });

  return NextResponse.json({ ok: true, order });
}
