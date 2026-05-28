import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { compare, hash } from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/profile/link-email
// Case A: email is free → attach it to the current TG-only account
// Case B: email already exists → verify password, move TG link to that account, delete TG-only account
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, password } = await req.json() as { email?: string; password?: string };

  if (!email || !password)          return NextResponse.json({ error: 'Введите email и пароль' },   { status: 400 });
  if (password.length < 6)          return NextResponse.json({ error: 'Пароль минимум 6 символов' }, { status: 400 });
  if (!/\S+@\S+\.\S+/.test(email))  return NextResponse.json({ error: 'Некорректный email' },        { status: 400 });

  const normalEmail = email.toLowerCase().trim();

  const tgUser = await prisma.users.findUnique({
    where:  { id: session.user.id },
    select: { email: true },
  });
  if (!tgUser) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });

  if (!tgUser.email.endsWith('@arcane.internal')) {
    return NextResponse.json({ error: 'Email уже привязан к аккаунту' }, { status: 409 });
  }

  const existing = await prisma.users.findUnique({
    where:  { email: normalEmail },
    select: { id: true, password: true, isBanned: true },
  });

  if (!existing) {
    // ── Case A: free email — just attach it ──────────────────────────
    const hashedPassword = await hash(password, 12);
    await prisma.users.update({
      where: { id: session.user.id },
      data:  { email: normalEmail, password: hashedPassword, updatedAt: new Date() },
    });
    return NextResponse.json({ ok: true, merged: false });
  }

  // ── Case B: email taken — verify password then merge accounts ───────
  if (existing.isBanned) return NextResponse.json({ error: 'Аккаунт заблокирован' }, { status: 403 });

  const validPassword = await compare(password, existing.password);
  if (!validPassword) return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });

  if (existing.id === session.user.id) {
    return NextResponse.json({ error: 'Это уже ваш аккаунт' }, { status: 409 });
  }

  // Move telegram_users record from TG-only account → existing account
  // Do NOT delete the TG placeholder — it may have FK references; just neutralise it
  await prisma.$transaction(async (tx) => {
    // Re-link telegram record to the main account
    await tx.telegram_users.updateMany({
      where: { userId: session.user.id },
      data:  { userId: existing.id },
    });

    // Merge wishlists into the main account (skip duplicates)
    const tgWishlists = await tx.wishlists.findMany({ where: { userId: session.user.id } });
    for (const w of tgWishlists) {
      const alreadyExists = await tx.wishlists.findUnique({
        where: { userId_gameId: { userId: existing.id, gameId: w.gameId } },
      });
      if (!alreadyExists) {
        await tx.wishlists.update({
          where: { userId_gameId: { userId: session.user.id, gameId: w.gameId } },
          data:  { userId: existing.id },
        });
      } else {
        await tx.wishlists.delete({
          where: { userId_gameId: { userId: session.user.id, gameId: w.gameId } },
        });
      }
    }

    // Neutralise the TG placeholder (can't delete due to FK constraints)
    // Mark with a special prefix so it's invisible and can't be logged into
    await tx.users.update({
      where: { id: session.user.id },
      data:  {
        email:     `_merged_${session.user.id}@arcane.internal`,
        isBanned:  true,
        updatedAt: new Date(),
      },
    });
  });

  return NextResponse.json({ ok: true, merged: true, targetEmail: normalEmail });
}
