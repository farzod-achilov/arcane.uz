import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as {
    isActive?: boolean; maxUses?: number | null; expiresAt?: string | null;
  };

  const promo = await prisma.promo_codes.update({
    where: { id: params.id },
    data: {
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(Object.prototype.hasOwnProperty.call(body, 'maxUses') && { maxUses: body.maxUses ?? null }),
      ...(Object.prototype.hasOwnProperty.call(body, 'expiresAt') && {
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      }),
    },
  });

  return NextResponse.json({ ok: true, promo });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.promo_codes.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
