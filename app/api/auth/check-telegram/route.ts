import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/auth/check-telegram?telegramId=XXX → { linked: boolean }
export async function GET(req: Request) {
  const telegramId = new URL(req.url).searchParams.get('telegramId');
  if (!telegramId) return NextResponse.json({ linked: false });

  const row = await prisma.telegram_users.findUnique({
    where:  { telegramId: BigInt(telegramId) },
    select: { userId: true },
  });

  return NextResponse.json({ linked: !!row });
}
