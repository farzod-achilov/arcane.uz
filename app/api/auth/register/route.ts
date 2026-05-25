import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { name?: string; email?: string; password?: string };
    const { name, email, password } = body;

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

    const hashedPassword = await hash(password, 12);
    const now            = new Date();

    const user = await prisma.users.create({
      data: {
        id:        crypto.randomUUID(),
        email:     normalEmail,
        username:  normalUsername,
        password:  hashedPassword,
        arcCoins:  500,
        updatedAt: now,
      },
      select: { id: true, email: true, username: true },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[auth/register]', msg);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
