import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { sendWelcomeEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// POST /api/auth/verify-email — { token }
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 10, windowSec: 900 });
  if (limited) return limited;

  try {
    const { token } = await req.json() as { token?: string };
    if (!token?.trim()) {
      return NextResponse.json({ error: 'Токен обязателен' }, { status: 400 });
    }

    const record = await prisma.email_verification_tokens.findUnique({
      where:   { token: token.trim() },
      include: { user: { select: { id: true, email: true, username: true, emailVerified: true } } },
    });

    if (!record) {
      return NextResponse.json({ error: 'Ссылка недействительна' }, { status: 400 });
    }
    if (record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Ссылка истекла. Запросите новую в профиле.' }, { status: 400 });
    }

    const alreadyVerified = !!record.user.emailVerified;

    await prisma.$transaction([
      prisma.users.update({
        where: { id: record.userId },
        data:  { emailVerified: record.user.emailVerified ?? new Date(), updatedAt: new Date() },
      }),
      prisma.email_verification_tokens.deleteMany({ where: { userId: record.userId } }),
    ]);

    // Welcome email lands only after the address is proven real
    if (!alreadyVerified) {
      sendWelcomeEmail(record.user.email, record.user.username).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[verify-email]', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
