import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 5, windowSec: 900 });
  if (limited) return limited;

  try {
    const { token, password } = await req.json() as { token?: string; password?: string };

    if (!token?.trim()) {
      return NextResponse.json({ error: 'Токен обязателен' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Пароль минимум 8 символов' }, { status: 400 });
    }

    const record = await prisma.password_reset_tokens.findUnique({
      where: { token: token.trim() },
    });

    if (!record) {
      return NextResponse.json({ error: 'Ссылка недействительна' }, { status: 400 });
    }
    if (record.usedAt) {
      return NextResponse.json({ error: 'Ссылка уже использована' }, { status: 400 });
    }
    if (new Date(record.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Ссылка истекла. Запросите новую.' }, { status: 400 });
    }

    const hashed = await hash(password, 12);

    await Promise.all([
      prisma.users.update({
        where: { id: record.userId },
        data:  { password: hashed, updatedAt: new Date() },
      }),
      prisma.password_reset_tokens.update({
        where: { id: record.id },
        data:  { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[reset-password]', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
