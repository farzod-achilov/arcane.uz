import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as {
    discountPct?: number; type?: string;
    isActive?: boolean; isFeatured?: boolean;
    startsAt?: string | null; endsAt?: string | null;
  };

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (body.discountPct !== undefined) data.discountPct = body.discountPct;
  if (body.type        !== undefined) data.type        = body.type;
  if (body.isActive    !== undefined) data.isActive    = body.isActive;
  if (body.isFeatured  !== undefined) data.isFeatured  = body.isFeatured;
  if ('startsAt' in body) data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
  if ('endsAt'   in body) data.endsAt   = body.endsAt   ? new Date(body.endsAt)   : null;

  const discount = await prisma.discounts.update({
    where: { id: params.id },
    data,
    include: { games: { select: { id: true, title: true, priceUzs: true } } },
  });

  return NextResponse.json({ ok: true, discount });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.discounts.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
