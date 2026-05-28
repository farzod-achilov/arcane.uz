import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { compare, hash } from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json() as {
    currentPassword?: string;
    newPassword?:     string;
  };

  if (!currentPassword || !newPassword)
    return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });
  if (newPassword.length < 6)
    return NextResponse.json({ error: 'Новый пароль минимум 6 символов' }, { status: 400 });
  if (currentPassword === newPassword)
    return NextResponse.json({ error: 'Новый пароль совпадает со старым' }, { status: 400 });

  const user = await prisma.users.findUnique({
    where:  { id: session.user.id },
    select: { password: true },
  });
  if (!user) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });

  // Telegram-only account has no password
  if (user.password === '$tg$' || user.password === '$steam$') {
    return NextResponse.json({ error: 'У вашего аккаунта нет пароля — войдите через Telegram/Steam' }, { status: 400 });
  }

  const valid = await compare(currentPassword, user.password);
  if (!valid) return NextResponse.json({ error: 'Неверный текущий пароль' }, { status: 401 });

  const hashed = await hash(newPassword, 12);
  await prisma.users.update({
    where: { id: session.user.id },
    data:  { password: hashed, updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
