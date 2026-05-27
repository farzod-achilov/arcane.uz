import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = 30;

  const [promos, total] = await Promise.all([
    prisma.promo_codes.findMany({
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.promo_codes.count(),
  ]);

  return NextResponse.json({ promos, total, pages: Math.ceil(total / limit) });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as {
    code?: string; type?: string; value?: number;
    maxUses?: number | null; expiresAt?: string | null;
  };

  const code = (body.code ?? '').trim().toUpperCase();
  if (!code || code.length < 3) return NextResponse.json({ error: 'Код минимум 3 символа' }, { status: 400 });

  const type  = body.type === 'FIXED' ? 'FIXED' : 'PERCENT';
  const value = Math.round(body.value ?? 0);
  if (!value || value <= 0) return NextResponse.json({ error: 'Укажите значение скидки' }, { status: 400 });
  if (type === 'PERCENT' && value > 100) return NextResponse.json({ error: 'Процент не более 100' }, { status: 400 });

  try {
    const promo = await prisma.promo_codes.create({
      data: {
        code,
        type:      type as 'PERCENT' | 'FIXED',
        value,
        maxUses:   body.maxUses ?? null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });
    return NextResponse.json({ ok: true, promo }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Такой код уже существует' }, { status: 409 });
  }
}
