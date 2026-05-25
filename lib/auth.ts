import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
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
