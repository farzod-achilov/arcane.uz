import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type SteamData = { steamId: string; displayName: string; avatar?: string; profileUrl?: string };

// POST /api/auth/steam-create — create new account from Steam profile
export async function POST(req: Request) {
  const { steamData } = await req.json() as { steamData?: SteamData };
  if (!steamData?.steamId) return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });

  const existing = await prisma.steam_users.findUnique({ where: { steamId: steamData.steamId } });
  if (existing) return NextResponse.json({ error: 'Аккаунт уже существует' }, { status: 409 });

  const newId    = crypto.randomUUID();
  const baseName = steamData.displayName.replace(/\s+/g, '_').slice(0, 20) || `steam_${steamData.steamId.slice(-6)}`;
  const taken    = await prisma.users.findUnique({ where: { username: baseName }, select: { id: true } });
  const username = taken ? `${baseName}_${crypto.randomBytes(2).toString('hex')}` : baseName;
  const refCode  = crypto.randomBytes(4).toString('hex').toUpperCase();

  await prisma.$transaction([
    prisma.users.create({
      data: {
        id:           newId,
        email:        `steam_${steamData.steamId}@arcane.internal`,
        username,
        password:     '$steam$',
        avatar:       steamData.avatar ?? null,
        arcCoins:     500,
        referralCode: refCode,
        updatedAt:    new Date(),
      },
    }),
    prisma.steam_users.create({
      data: {
        userId:      newId,
        steamId:     steamData.steamId,
        displayName: steamData.displayName,
        avatar:      steamData.avatar ?? null,
        profileUrl:  steamData.profileUrl ?? null,
      },
    }),
    prisma.transactions.create({
      data: {
        id:            nanoid(),
        userId:        newId,
        type:          'ADMIN_GRANT',
        amount:        500,
        balanceBefore: 0,
        balanceAfter:  500,
        description:   'Приветственный бонус за регистрацию через Steam',
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
