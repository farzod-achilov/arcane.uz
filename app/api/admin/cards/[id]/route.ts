import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as {
    isActive?: boolean; holderName?: string; bank?: string; priority?: number;
  };

  const card = await prisma.payment_cards.findUnique({ where: { id: params.id } });
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.payment_cards.update({
    where: { id: params.id },
    data: {
      ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {}),
      ...(body.holderName !== undefined ? { holderName: body.holderName.trim() } : {}),
      ...(body.bank       !== undefined ? { bank: body.bank.trim() || null } : {}),
      ...(body.priority   !== undefined ? { priority: Math.round(body.priority) } : {}),
    },
  });

  return NextResponse.json({ ok: true, card: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const usage = await prisma.deposit_requests.count({ where: { cardId: params.id } });
  if (usage > 0) {
    // по карте есть история заявок — только деактивация, чтобы не рвать связи
    await prisma.payment_cards.update({ where: { id: params.id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, deactivated: true });
  }

  await prisma.payment_cards.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true, deleted: true });
}
