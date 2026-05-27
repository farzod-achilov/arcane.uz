import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { verifyTelegramAuth, isTelegramAuthFresh, type TelegramAuthData } from '@/lib/telegram-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id:   'telegram',
      name: 'Telegram',
      credentials: {
        id:         {},
        first_name: {},
        last_name:  {},
        username:   {},
        photo_url:  {},
        auth_date:  {},
        hash:       {},
      },
      async authorize(creds) {
        if (!creds?.id || !creds?.hash) return null;

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) return null;

        const authData: TelegramAuthData = {
          id:         creds.id,
          first_name: creds.first_name ?? '',
          last_name:  creds.last_name  || undefined,
          username:   creds.username   || undefined,
          photo_url:  creds.photo_url  || undefined,
          auth_date:  creds.auth_date,
          hash:       creds.hash,
        };

        if (!verifyTelegramAuth(authData, botToken))     return null;
        if (!isTelegramAuthFresh(authData.auth_date))    return null;

        const telegramId = BigInt(creds.id);

        const tgRow = await prisma.telegram_users.findUnique({
          where:  { telegramId },
          select: { userId: true },
        });

        let userId: string;

        if (tgRow) {
          userId = tgRow.userId;
        } else {
          // Create a new account linked to this Telegram identity
          const newId    = crypto.randomUUID();
          const baseUser = creds.username || `tg${creds.id}`;
          const refCode  = crypto.randomBytes(4).toString('hex').toUpperCase();
          const tgCode   = crypto.randomBytes(4).toString('hex').toUpperCase();

          // Ensure username uniqueness
          const taken = await prisma.users.findUnique({ where: { username: baseUser }, select: { id: true } });
          const username = taken ? `${baseUser}_${crypto.randomBytes(2).toString('hex')}` : baseUser;

          await prisma.$transaction([
            prisma.users.create({
              data: {
                id:           newId,
                email:        `tg_${creds.id}@arcane.internal`,
                username,
                password:     '$tg$', // no password — Telegram-only account
                avatar:       creds.photo_url || null,
                arcCoins:     500,
                referralCode: refCode,
                updatedAt:    new Date(),
              },
            }),
            prisma.telegram_users.create({
              data: {
                userId:          newId,
                telegramId,
                telegramUsername: creds.username || null,
                firstName:        creds.first_name,
                userName:         creds.username || creds.first_name,
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
          ]);

          userId = newId;
        }

        const user = await prisma.users.findUnique({
          where:  { id: userId },
          select: {
            id: true, email: true, username: true, avatar: true,
            isAdmin: true, isBanned: true, arcCoins: true, xp: true, level: true,
          },
        });

        if (!user || user.isBanned) return null;

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
