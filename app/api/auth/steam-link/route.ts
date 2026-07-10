import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { peekSteamToken, consumeSteamToken } from '@/lib/steamAuthTokens';

export const dynamic = 'force-dynamic';

// POST /api/auth/steam-link — link a verified Steam identity to an existing email account
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 5, windowSec: 900 });
  if (limited) return limited;

  const { token, email, password } = await req.json() as {
    token?: string; email?: string; password?: string;
  };

  if (!token || !email || !password)
    return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });

  // Peek (don't consume): a wrong password must not burn the Steam token
  const steamData = await peekSteamToken(token);
  if (!steamData)
    return NextResponse.json({ error: 'Сессия Steam устарела, войдите через Steam заново' }, { status: 401 });

  const user = await prisma.users.findUnique({
    where:  { email: email.toLowerCase().trim() },
    select: { id: true, password: true, isBanned: true },
  });
  if (!user || user.isBanned) return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });

  const valid = await compare(password, user.password);
  if (!valid) return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });

  const existing = await prisma.steam_users.findUnique({ where: { steamId: steamData.steamId } });
  if (existing && existing.userId !== user.id)
    return NextResponse.json({ error: 'Этот Steam уже привязан к другому аккаунту' }, { status: 409 });

  // Consume the token now that the password checked out — single use on success
  const consumed = await consumeSteamToken(token);
  if (!consumed)
    return NextResponse.json({ error: 'Сессия Steam устарела, войдите через Steam заново' }, { status: 401 });

  await prisma.steam_users.upsert({
    where:  { userId: user.id },
    create: { userId: user.id, steamId: steamData.steamId, displayName: steamData.displayName,
              avatar: steamData.avatar ?? null, profileUrl: steamData.profileUrl ?? null },
    update: { steamId: steamData.steamId, displayName: steamData.displayName,
              avatar: steamData.avatar ?? null, profileUrl: steamData.profileUrl ?? null },
  });

  return NextResponse.json({ ok: true });
}
