import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limited = rateLimit(req, { limit: 10, windowSec: 300, key: `promo:${session.user.id}` });
  if (limited) return limited;

  const body = await req.json() as { code?: string; subtotal?: number };
  const code     = (body.code ?? '').trim().toUpperCase();
  const subtotal = Math.round(body.subtotal ?? 0);

  if (!code) return NextResponse.json({ error: 'Введите промокод' }, { status: 400 });

  const promo = await prisma.promo_codes.findUnique({ where: { code } });

  if (!promo || !promo.isActive)
    return NextResponse.json({ error: 'Промокод не найден' }, { status: 404 });

  if (promo.expiresAt && promo.expiresAt < new Date())
    return NextResponse.json({ error: 'Промокод истёк' }, { status: 400 });

  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses)
    return NextResponse.json({ error: 'Лимит использований исчерпан' }, { status: 400 });

  const discount = promo.type === 'PERCENT'
    ? Math.round(subtotal * promo.value / 100)
    : Math.min(promo.value, subtotal);

  return NextResponse.json({
    ok:       true,
    promoId:  promo.id,
    type:     promo.type,
    value:    promo.value,
    discount,
    label:    promo.type === 'PERCENT' ? `−${promo.value}%` : `−${promo.value.toLocaleString('ru')} сум`,
  });
}
