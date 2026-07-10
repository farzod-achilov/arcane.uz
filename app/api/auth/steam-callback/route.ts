import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSteamToken, pruneSteamTokens } from '@/lib/steamAuthTokens';

export const dynamic = 'force-dynamic';

const STEAM_OPENID = 'https://steamcommunity.com/openid/login';
const APP_URL      = process.env.NEXT_PUBLIC_APP_URL ?? 'https://arcane.com.uz';
const STEAM_API_KEY = process.env.STEAM_API_KEY ?? '';

// Extract steamid64 from claimed_id URL
function extractSteamId(claimedId: string): string | null {
  const match = claimedId.match(/https:\/\/steamcommunity\.com\/openid\/id\/(\d+)/);
  return match ? match[1] : null;
}

// Verify OpenID assertion with Steam
async function verifySteamOpenId(params: URLSearchParams): Promise<boolean> {
  const verifyParams = new URLSearchParams(params);
  verifyParams.set('openid.mode', 'check_authentication');

  const res = await fetch(STEAM_OPENID, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    verifyParams.toString(),
  });
  const text = await res.text();
  return text.includes('is_valid:true');
}

// Fetch Steam profile
async function getSteamProfile(steamId: string) {
  if (!STEAM_API_KEY) return { displayName: `Steam ${steamId}`, avatar: null, profileUrl: null };

  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`,
      { next: { revalidate: 0 } }
    );
    const data = await res.json() as {
      response?: { players?: Array<{ personaname: string; avatarfull: string; profileurl: string }> };
    };
    const player = data.response?.players?.[0];
    if (!player) return { displayName: `Steam ${steamId}`, avatar: null, profileUrl: null };
    return {
      displayName: player.personaname,
      avatar:      player.avatarfull || null,
      profileUrl:  player.profileurl || null,
    };
  } catch {
    return { displayName: `Steam ${steamId}`, avatar: null, profileUrl: null };
  }
}

// GET /api/auth/steam-callback?openid.*=...
export async function GET(req: Request) {
  const url    = new URL(req.url);
  const params = url.searchParams;

  // 1. Verify with Steam
  const valid = await verifySteamOpenId(params).catch(() => false);
  if (!valid) {
    return NextResponse.redirect(`${APP_URL}/profile?steam=error`);
  }

  // 2. Extract steamId
  const claimedId = params.get('openid.claimed_id') ?? '';
  const steamId   = extractSteamId(claimedId);
  if (!steamId) return NextResponse.redirect(`${APP_URL}/profile?steam=error`);

  const session = await getServerSession(authOptions);

  // ── Flow A: User is logged in → LINK Steam to their account ──
  if (session?.user?.id) {
    const alreadyLinked = await prisma.steam_users.findUnique({ where: { steamId } });
    if (alreadyLinked && alreadyLinked.userId !== session.user.id) {
      return NextResponse.redirect(`${APP_URL}/profile?steam=taken`);
    }
    if (!alreadyLinked) {
      const profile = await getSteamProfile(steamId);
      await prisma.steam_users.upsert({
        where:  { userId: session.user.id },
        create: { userId: session.user.id, steamId, ...profile },
        update: { steamId, ...profile },
      });
    }
    return NextResponse.redirect(`${APP_URL}/profile?steam=linked`);
  }

  // ── Flow B: Not logged in → LOGIN via Steam ───────────────────
  // The steamId is proven by the OpenID check above; hand it to the client
  // only as a single-use server-side token — never as forgeable data.
  await pruneSteamTokens();

  const tgRow = await prisma.steam_users.findUnique({
    where:  { steamId },
    select: { userId: true },
  });

  const profile = await getSteamProfile(steamId);
  const token   = await createSteamToken({ steamId, ...profile });

  if (tgRow) {
    // Existing Steam user — redirect to special login page
    return NextResponse.redirect(`${APP_URL}/auth/steam-signin?token=${token}`);
  }

  // New Steam user — redirect to create/link page (name is display-only)
  const name = encodeURIComponent(profile.displayName);
  return NextResponse.redirect(`${APP_URL}/auth/steam-callback?token=${token}&name=${name}`);
}
