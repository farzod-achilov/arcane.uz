import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { hash } from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/profile/link-email — attach email+password to a Telegram-only account
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, password } = await req.json() as { email?: string; password?: string };

  if (!email || !password)       return NextResponse.json({ error: 'Введите email и пароль' }, { status: 400 });
  if (password.length < 6)       return NextResponse.json({ error: 'Пароль минимум 6 символов' }, { status: 400 });
  if (!/\S+@\S+\.\S+/.test(email)) return NextResponse.json({ error: 'Некорректный email' }, { status: 400 });

  const user = await prisma.users.findUnique({
    where:  { id: session.user.id },
    select: { email: true, password: true },
  });

  if (!user) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });

  // Only allowed for Telegram-only accounts (internal fake email)
  if (!user.email.endsWith('@arcane.internal')) {
    return NextResponse.json({ error: 'Email уже привязан к аккаунту' }, { status: 409 });
  }

  // Check email not taken by another user
  const taken = await prisma.users.findUnique({
    where:  { email: email.toLowerCase().trim() },
    select: { id: true },
  });
  if (taken) return NextResponse.json({ error: 'Этот email уже используется' }, { status: 409 });

  const hashedPassword = await hash(password, 12);

  await prisma.users.update({
    where: { id: session.user.id },
    data:  {
      email:     email.toLowerCase().trim(),
      password:  hashedPassword,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
