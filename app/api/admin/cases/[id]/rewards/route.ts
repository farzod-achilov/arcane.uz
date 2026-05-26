import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const machine = await prisma.drop_machines.findUnique({
    where: { id: params.id }, select: { id: true },
  });
  if (!machine) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  const body = await req.json() as {
    name?: string; type?: string; rarity?: string;
    dropChance?: number; sellValue?: number; imageUrl?: string;
  };

  const name      = body.name?.trim();
  const type      = body.type      ?? 'COINS';
  const rarity    = body.rarity    ?? 'COMMON';
  const dropChance = Math.max(0, Math.min(1, body.dropChance ?? 0.1));
  const sellValue  = Math.round(body.sellValue ?? 100);

  if (!name) return NextResponse.json({ error: 'Название награды обязательно' }, { status: 400 });

  const now    = new Date();
  const reward = await prisma.drop_rewards.create({
    data: {
      id:         nanoid(),
      dropId:     params.id,
      name,
      type:       type     as never,
      rarity:     rarity   as never,
      dropChance,
      sellValue,
      imageUrl:   body.imageUrl?.trim() || null,
      isActive:   true,
      timesDropped: 0,
      updatedAt:  now,
    },
    select: { id: true, name: true, rarity: true, dropChance: true, type: true, sellValue: true },
  });

  return NextResponse.json({ ok: true, reward }, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { rewardId } = await req.json() as { rewardId: string };
  if (!rewardId) return NextResponse.json({ error: 'rewardId required' }, { status: 400 });

  await prisma.drop_rewards.update({
    where: { id: rewardId },
    data:  { isActive: false, updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
