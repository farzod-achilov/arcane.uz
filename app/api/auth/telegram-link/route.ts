import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { verifyTelegramAuth, isTelegramAuthFresh, type TelegramAuthData } from '@/lib/telegram-auth';

export const dynamic = 'force-dynamic';

// POST /api/auth/telegram-link
// Body: { telegramData: TelegramAuthData, email: string, password: string }
// Links the Telegram account to the existing email/password account
export async function POST(req: Request) {
  const body = await req.json() as {
    telegramData?: TelegramAuthData;
    email?:        string;
    password?:     string;
  };

  if (!body.telegramData || !body.email || !body.password) {
    return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return NextResponse.json({ error: 'Конфигурация сервера' }, { status: 500 });

  // 1. Verify Telegram hash + freshness
  if (!verifyTelegramAuth(body.telegramData, botToken)) {
    return NextResponse.json({ error: 'Подпись Telegram недействительна' }, { status: 401 });
  }
  if (!isTelegramAuthFresh(body.telegramData.auth_date)) {
    return NextResponse.json({ error: 'Сессия Telegram устарела, войдите заново' }, { status: 401 });
  }

  // 2. Find user by email
  const user = await prisma.users.findUnique({
    where:  { email: body.email.toLowerCase().trim() },
    select: { id: true, password: true, isBanned: true },
  });

  if (!user || user.isBanned) {
    return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
  }

  const validPassword = await compare(body.password, user.password);
  if (!validPassword) {
    return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
  }

  const telegramId = BigInt(body.telegramData.id);

  // 3. Check if this Telegram ID is already linked to another account
  const existingLink = await prisma.telegram_users.findUnique({
    where: { telegramId },
  });

  if (existingLink) {
    if (existingLink.userId === user.id) {
      return NextResponse.json({ ok: true, alreadyLinked: true });
    }
    return NextResponse.json({ error: 'Этот Telegram уже привязан к другому аккаунту' }, { status: 409 });
  }

  // 4. Link Telegram to existing account
  await prisma.telegram_users.create({
    data: {
      userId:           user.id,
      telegramId,
      telegramUsername: body.telegramData.username ?? null,
      firstName:        body.telegramData.first_name,
      userName:         body.telegramData.username ?? body.telegramData.first_name,
      referralCode:     randomBytes(4).toString('hex').toUpperCase(),
    },
  });

  return NextResponse.json({ ok: true });
}
