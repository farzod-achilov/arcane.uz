import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { consumeSteamToken, createSteamToken } from '@/lib/steamAuthTokens';

export const dynamic = 'force-dynamic';

// POST /api/auth/steam-create — create new account from a verified Steam token
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 5, windowSec: 900 });
  if (limited) return limited;

  const { token } = await req.json() as { token?: string };
  if (!token) return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });

  // Single-use: consumed here; on success we issue a fresh login token below
  const steamData = await consumeSteamToken(token);
  if (!steamData) return NextResponse.json({ error: 'Сессия Steam устарела, войдите через Steam заново' }, { status: 401 });

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

  // Fresh single-use token so the client can sign in to the account it just created
  const loginToken = await createSteamToken(steamData);
  return NextResponse.json({ ok: true, loginToken });
}
