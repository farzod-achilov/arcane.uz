import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as { isActive?: boolean; featuredOrder?: number | null };

  const data: Record<string, unknown> = {};
  if (typeof body.isActive     === 'boolean') data.isActive     = body.isActive;
  if ('featuredOrder' in body)                data.featuredOrder = body.featuredOrder ?? null;

  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 });

  const updated = await prisma.drop_machines.update({
    where:  { id: params.id },
    data,
    select: { id: true, isActive: true, featuredOrder: true },
  });

  return NextResponse.json({ ok: true, case: updated });
}
