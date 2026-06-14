import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { verifyTelegramRaw, decodeTgAuthResult, isTelegramAuthFresh } from '@/lib/telegram-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id:   'telegram',
      name: 'Telegram',
      credentials: {
        tgAuthResult: {}, // raw base64url from OIDC flow — decoded server-side
        id:           {}, // fallback: classic widget params
        first_name:   {},
        last_name:    {},
        username:     {},
        photo_url:    {},
        auth_date:    {},
        hash:         {},
      },
      async authorize(creds) {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) { console.error('[TG] no TELEGRAM_BOT_TOKEN'); return null; }

        // Decode all fields — use raw tgAuthResult if available so we include ALL fields in hash check
        let raw: Record<string, string>;
        try {
          if (creds?.tgAuthResult) {
            raw = decodeTgAuthResult(creds.tgAuthResult);
          } else {
            raw = {};
            for (const [k, v] of Object.entries(creds ?? {})) {
              if (v) raw[k] = v;
            }
          }
        } catch (e) {
          console.error('[TG] decode error', e);
          return null;
        }

        if (!raw.id || !raw.hash) {
          console.error('[TG] missing id or hash after decode', raw);
          return null;
        }

        const hashOk  = verifyTelegramRaw(raw, botToken);
        const freshOk = isTelegramAuthFresh(raw.auth_date);

        if (!hashOk)  return null;
        if (!freshOk) return null;

        const telegramId = BigInt(raw.id);
        const creds_id         = raw.id;
        const creds_first_name = raw.first_name ?? '';
        const creds_username   = raw.username   ?? undefined;
        const creds_photo_url  = raw.photo_url  ?? undefined;

        let tgRow: { userId: string } | null = null;
        try {
          tgRow = await prisma.telegram_users.findUnique({
            where:  { telegramId },
            select: { userId: true },
          });
        } catch (e) {
          console.error('[TG] DB error finding telegram_users:', e);
          return null;
        }

        let userId: string = '';

        if (tgRow) {
          // Check if the linked user actually exists (guard against orphaned records)
          const linkedUser = await prisma.users.findUnique({
            where:  { id: tgRow.userId },
            select: { id: true },
          });
          if (linkedUser) {
            userId = tgRow.userId;
          } else {
            // Orphaned telegram_users record — delete it and fall through to create new account
            await prisma.telegram_users.delete({ where: { telegramId } });
            tgRow = null;
          }
        }

        if (!tgRow) {
          // Create a new account linked to this Telegram identity
          const newId    = crypto.randomUUID();
          const baseUser = creds_username || `tg${creds_id}`;
          const refCode  = crypto.randomBytes(4).toString('hex').toUpperCase();
          const tgCode   = crypto.randomBytes(4).toString('hex').toUpperCase();

          // Ensure username uniqueness
          const taken = await prisma.users.findUnique({ where: { username: baseUser }, select: { id: true } });
          const username = taken ? `${baseUser}_${crypto.randomBytes(2).toString('hex')}` : baseUser;

          try { await prisma.$transaction([
            prisma.users.create({
              data: {
                id:           newId,
                email:        `tg_${creds_id}@arcane.internal`,
                username,
                password:     '$tg$',
                avatar:       creds_photo_url || null,
                arcCoins:     500,
                referralCode: refCode,
                updatedAt:    new Date(),
              },
            }),
            prisma.telegram_users.create({
              data: {
                userId:           newId,
                telegramId,
                telegramUsername: creds_username || null,
                firstName:        creds_first_name,
                userName:         creds_username || creds_first_name,
                referralCode:     tgCode,
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
                description:   'Приветственный бонус за регистрацию',
              },
            }),
          ]); } catch (e) {
            console.error('[TG] DB error creating user:', e);
            return null;
          }

          userId = newId;
        }

        const user = await prisma.users.findUnique({
          where:  { id: userId },
          select: {
            id: true, email: true, username: true, avatar: true,
            isAdmin: true, isBanned: true, arcCoins: true, xp: true, level: true,
          },
        });

        if (!user)         { console.error('[TG] user record not found for userId:', userId); return null; }
        if (user.isBanned) { console.error('[TG] user is banned:', userId); return null; }

        await prisma.users.update({
          where: { id: userId },
          data:  { lastLoginAt: new Date(), updatedAt: new Date() },
        });

        return {
          id:       user.id,
          email:    user.email,
          name:     user.username,
          image:    user.avatar ?? null,
          isAdmin:  user.isAdmin,
          arcCoins: user.arcCoins,
          xp:       user.xp,
          level:    user.level,
        };
      },
    }),

    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.users.findUnique({
          where:  { email: credentials.email.toLowerCase().trim() },
          select: {
            id: true, email: true, username: true, password: true,
            avatar: true, isAdmin: true, isBanned: true,
            arcCoins: true, xp: true, level: true,
          },
        });

        if (!user || user.isBanned) return null;

        const valid = await compare(credentials.password, user.password);
        if (!valid) return null;

        await prisma.users.update({
          where: { id: user.id },
          data:  { lastLoginAt: new Date(), updatedAt: new Date() },
        });

        return {
          id:       user.id,
          email:    user.email,
          name:     user.username,
          image:    user.avatar ?? null,
          isAdmin:  user.isAdmin,
          arcCoins: user.arcCoins,
          xp:       user.xp,
          level:    user.level,
        };
      },
    }),

    // Steam sign-in provider — receives steamId after server-side OpenID verification
    CredentialsProvider({
      id:   'steam',
      name: 'Steam',
      credentials: { steamId: {} },
      async authorize(creds) {
        if (!creds?.steamId) return null;

        const steamRow = await prisma.steam_users.findUnique({
          where:  { steamId: creds.steamId },
          select: { userId: true },
        });
        if (!steamRow) return null;

        const user = await prisma.users.findUnique({
          where:  { id: steamRow.userId },
          select: {
            id: true, email: true, username: true, avatar: true,
            isAdmin: true, isBanned: true, arcCoins: true, xp: true, level: true,
          },
        });
        if (!user || user.isBanned) return null;

        await prisma.users.update({
          where: { id: user.id },
          data:  { lastLoginAt: new Date(), updatedAt: new Date() },
        });

        return {
          id:       user.id,
          email:    user.email,
          name:     user.username,
          image:    user.avatar ?? null,
          isAdmin:  user.isAdmin,
          arcCoins: user.arcCoins,
          xp:       user.xp,
          level:    user.level,
        };
      },
    }),
  ],

  session: { strategy: 'jwt' },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id       = user.id;
        token.isAdmin  = (user as { isAdmin?: boolean }).isAdmin  ?? false;
        token.arcCoins = (user as { arcCoins?: number }).arcCoins ?? 0;
        token.xp       = (user as { xp?: number }).xp             ?? 0;
        token.level    = (user as { level?: number }).level        ?? 1;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id       = token.id       as string;
      session.user.isAdmin  = token.isAdmin  as boolean;
      session.user.arcCoins = token.arcCoins as number;
      session.user.xp       = token.xp       as number;
      session.user.level    = token.level    as number;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
