import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type SteamData = { steamId: string; displayName: string; avatar?: string; profileUrl?: string };

// POST /api/auth/steam-link — link Steam to an existing email account
export async function POST(req: Request) {
  const { steamData, email, password } = await req.json() as {
    steamData?: SteamData; email?: string; password?: string;
  };

  if (!steamData?.steamId || !email || !password)
    return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });

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

  await prisma.steam_users.upsert({
    where:  { userId: user.id },
    create: { userId: user.id, steamId: steamData.steamId, displayName: steamData.displayName,
              avatar: steamData.avatar ?? null, profileUrl: steamData.profileUrl ?? null },
    update: { steamId: steamData.steamId, displayName: steamData.displayName,
              avatar: steamData.avatar ?? null, profileUrl: steamData.profileUrl ?? null },
  });

  return NextResponse.json({ ok: true });
}
