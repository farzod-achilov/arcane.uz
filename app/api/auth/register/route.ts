import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/email';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any;

function genCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name?: string; email?: string; password?: string; referralCode?: string;
    };
    const { name, email, password, referralCode } = body;

    if (!name?.trim() || name.trim().length < 2) {
      return NextResponse.json({ error: 'Имя должно содержать минимум 2 символа' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Введите корректный email' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Пароль минимум 6 символов' }, { status: 400 });
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
      ? await (prisma.users.findFirst as AnyData)({
          where:  { referralCode: refCode },
          select: { id: true, arcCoins: true },
        })
      : null;

    const hashedPassword = await hash(password, 12);
    const now            = new Date();
    const userId         = crypto.randomUUID();
    const myCode         = genCode();

    const user = await prisma.$transaction(async (tx) => {
      const created = await (tx.users.create as AnyData)({
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
        await (tx.users.update as AnyData)({
          where: { id: referrer.id },
          data:  { arcCoins: { increment: 200 } },
        });
        await tx.transactions.create({
          data: {
            id:            nanoid(),
            userId:        referrer.id,
            type:          'REFERRAL_BONUS',
            amount:        200,
            balanceBefore: referrer.arcCoins,
            balanceAfter:  referrer.arcCoins + 200,
            description:   `Реферальный бонус за ${normalUsername}`,
          },
        });
      }

      return created;
    });

    sendWelcomeEmail(user.email, user.username).catch(() => {});

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[auth/register]', msg);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
