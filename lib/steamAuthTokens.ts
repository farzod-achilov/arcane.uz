/* ─────────────────────────────────────────────────────────
   One-time Steam auth tokens.

   The Steam OpenID assertion is verified server-side in
   /api/auth/steam-callback. The client must never be trusted
   with a bare steamId (SteamID64s are public), so the callback
   issues a random single-use token bound to the verified
   steamId, and every downstream consumer (NextAuth `steam`
   provider, steam-create, steam-link) exchanges that token.
───────────────────────────────────────────────────────── */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const TOKEN_TTL_MINUTES = 10;

export interface SteamTokenData {
  steamId:     string;
  displayName: string;
  avatar?:     string | null;
  profileUrl?: string | null;
}

/** Issue a single-use token for a Steam identity verified via OpenID. */
export async function createSteamToken(data: SteamTokenData): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.steam_auth_tokens.create({
    data: {
      token,
      steamId:     data.steamId,
      displayName: data.displayName,
      avatar:      data.avatar     ?? null,
      profileUrl:  data.profileUrl ?? null,
      expiresAt:   new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000),
    },
  });
  return token;
}

/** Look up a token without consuming it (for flows that must not burn it on user error). */
export async function peekSteamToken(token: string): Promise<SteamTokenData | null> {
  if (!token) return null;
  const row = await prisma.steam_auth_tokens.findUnique({ where: { token } });
  if (!row || row.expiresAt < new Date()) return null;
  return { steamId: row.steamId, displayName: row.displayName, avatar: row.avatar, profileUrl: row.profileUrl };
}

/** Atomically consume a token: delete-first guarantees single use even under races. */
export async function consumeSteamToken(token: string): Promise<SteamTokenData | null> {
  if (!token) return null;
  try {
    const row = await prisma.steam_auth_tokens.delete({ where: { token } });
    if (row.expiresAt < new Date()) return null;
    return { steamId: row.steamId, displayName: row.displayName, avatar: row.avatar, profileUrl: row.profileUrl };
  } catch {
    return null; // not found — already used or never issued
  }
}

/** Housekeeping — drop expired tokens (called lazily from the callback route). */
export async function pruneSteamTokens(): Promise<void> {
  await prisma.steam_auth_tokens.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
}
