import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { rateLimit } from '@/lib/rateLimit';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { issueVerificationEmail } from '@/lib/emailVerification';
import { createNotification } from '@/lib/notifications';
import { verifyTurnstileToken } from '@/lib/turnstile/verify';
import { issuePostRegisterBypass } from '@/lib/turnstile/postRegisterBypass';

async function notifyReferrer(referrerId: string, newUsername: string) {
  const tgRow = await prisma.telegram_users.findUnique({
    where:  { userId: referrerId },
    select: { telegramId: true },
  });
  if (!tgRow) return;

  const referralCount = await prisma.users.count({ where: { referredBy: referrerId } });
  const bonus = referralCount >= 50 ? 500 : referralCount >= 30 ? 400 : referralCount >= 15 ? 300 : referralCount >= 5 ? 250 : 200;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://arcane.com.uz';
  const text = `🎉 По вашей реферальной ссылке зарегистрировался новый игрок!\n\n👤 ${newUsername}\n💰 Вам начислено +${bonus} ARC Coins\n\n[Открыть профиль](${appUrl}/profile?tab=referral)`;

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      chat_id:    tgRow.telegramId.toString(),
      text,
      parse_mode: 'Markdown',
    }),
  });
}

function genCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 5, windowSec: 900 });
  if (limited) return limited;

  try {
    const body = await req.json() as {
      name?: string; email?: string; password?: string; referralCode?: string; turnstileToken?: string;
    };
    const { name, email, password, referralCode, turnstileToken } = body;

    const captchaOk = await verifyTurnstileToken(turnstileToken, req.headers.get('x-forwarded-for') ?? undefined);
    if (!captchaOk) {
      return NextResponse.json({ error: 'Подтвердите, что вы не робот' }, { status: 400 });
    }

    if (!name?.trim() || name.trim().length < 2) {
      return NextResponse.json({ error: 'Имя должно содержать минимум 2 символа' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Введите корректный email' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Пароль минимум 8 символов' }, { status: 400 });
    }

    const normalEmail    = email.toLowerCase().trim();
    const normalUsername = name.trim();

    const existing = await prisma.users.findFirst({
      where:  { OR: [{ email: normalEmail }, { username: normalUsername }] },
      select: { email: true, username: true },
    });

    if (existing) {
      const error = existing.email === normalEmail
        ? 'Этот email уже зарегистрирован'
        : 'Это имя пользователя уже занято';
      return NextResponse.json({ error }, { status: 409 });
    }

    // Find referrer by code
    const refCode = referralCode?.toUpperCase().trim();
    const referrer = refCode
      ? await prisma.users.findFirst({
          where:  { referralCode: refCode },
          select: { id: true, arcCoins: true },
        })
      : null;

    // Calculate tiered bonus based on referrer's existing referral count
    const getReferralBonus = async (referrerId: string): Promise<number> => {
      const count = await prisma.users.count({ where: { referredBy: referrerId } });
      if (count >= 50) return 500;
      if (count >= 30) return 400;
      if (count >= 15) return 300;
      if (count >= 5)  return 250;
      return 200;
    };

    const hashedPassword = await hash(password, 12);
    const now            = new Date();
    const userId         = crypto.randomUUID();
    const myCode         = genCode();

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.users.create({
        data: {
          id:           userId,
          email:        normalEmail,
          username:     normalUsername,
          password:     hashedPassword,
          arcCoins:     500,
          referralCode: myCode,
          referredBy:   referrer?.id ?? null,
          updatedAt:    now,
        },
        select: { id: true, email: true, username: true },
      });

      await tx.transactions.create({
        data: {
          id:            nanoid(),
          userId,
          type:          'ADMIN_GRANT',
          amount:        500,
          balanceBefore: 0,
          balanceAfter:  500,
          description:   'Приветственный бонус за регистрацию',
        },
      });

      if (referrer) {
        const bonus = await getReferralBonus(referrer.id);
        await tx.users.update({
          where: { id: referrer.id },
          data:  { arcCoins: { increment: bonus } },
        });
        await tx.transactions.create({
          data: {
            id:            nanoid(),
            userId:        referrer.id,
            type:          'REFERRAL_BONUS',
            amount:        bonus,
            balanceBefore: referrer.arcCoins,
            balanceAfter:  referrer.arcCoins + bonus,
            description:   `Реферальный бонус за ${normalUsername}`,
          },
        });
      }

      return created;
    });

    // Confirmation link first; the welcome email goes out once the address is verified
    issueVerificationEmail(userId, user.email, user.username).catch(() => {});
    createNotification(userId, {
      type:  'system',
      title: `Добро пожаловать, ${normalUsername}!`,
      body:  '+500 Arcane Coins зачислены на счёт',
      href:  '/catalog',
    }).catch(() => {});

    // Telegram notification to referrer
    if (referrer) {
      notifyReferrer(referrer.id, normalUsername).catch(() => {});
    }

    // Lets the client's immediate post-register auto-login skip re-solving
    // Turnstile (tokens are single-use — already spent verifying THIS
    // request) — see lib/turnstile/postRegisterBypass.ts.
    const postRegisterBypassToken = issuePostRegisterBypass(user.email);

    return NextResponse.json({ success: true, user, postRegisterBypassToken }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[auth/register]', msg);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
