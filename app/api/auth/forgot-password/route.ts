import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rateLimit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 3, windowSec: 900 });
  if (limited) return limited;

  try {
    const { email } = await req.json() as { email?: string };
    const normalEmail = email?.toLowerCase().trim() ?? '';

    if (!normalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalEmail)) {
      return NextResponse.json({ error: 'Введите корректный email' }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where:  { email: normalEmail },
      select: { id: true, username: true, email: true },
    });

    // Always return success to avoid user enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Invalidate old tokens for this user
    await db.password_reset_tokens.deleteMany({ where: { userId: user.id } });

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.password_reset_tokens.create({
      data: { userId: user.id, token, expiresAt },
    });

    const baseUrl  = process.env.NEXTAUTH_URL ?? 'https://arcane.com.uz';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    sendPasswordResetEmail({
      to:       user.email,
      username: user.username,
      resetUrl,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[forgot-password]', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
