import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const steamRow = await prisma.steam_users.findUnique({
    where:  { userId: session.user.id },
    select: { steamId: true },
  });
  if (!steamRow) return NextResponse.json({ error: 'Steam не привязан' }, { status: 404 });

  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'STEAM_API_KEY не настроен' }, { status: 500 });

  const res = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamRow.steamId}`
  );
  const data = await res.json() as {
    response?: { players?: Array<{ personaname: string; avatarfull: string; profileurl: string }> };
  };
  const player = data.response?.players?.[0];
  if (!player) return NextResponse.json({ error: 'Не удалось получить профиль Steam' }, { status: 502 });

  await prisma.steam_users.update({
    where: { userId: session.user.id },
    data:  {
      displayName: player.personaname,
      avatar:      player.avatarfull,
      profileUrl:  player.profileurl,
    },
  });

  return NextResponse.json({ ok: true, displayName: player.personaname });
}
