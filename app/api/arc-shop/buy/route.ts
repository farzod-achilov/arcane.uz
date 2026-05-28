import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

export interface ShopItem {
  id:          string;
  title:       string;
  description: string;
  icon:        string;
  cost:        number;        // ARC coins
  type:        'promo' | 'coins' | 'badge';
  value:       number | string; // % discount or amount
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'promo5',   title: 'Скидка 5%',    description: 'Промокод на 5% скидку',    icon: '🎟️', cost: 300,  type: 'promo',  value: 5  },
  { id: 'promo10',  title: 'Скидка 10%',   description: 'Промокод на 10% скидку',   icon: '🎫', cost: 600,  type: 'promo',  value: 10 },
  { id: 'promo15',  title: 'Скидка 15%',   description: 'Промокод на 15% скидку',   icon: '🏷️', cost: 1000, type: 'promo',  value: 15 },
  { id: 'coins50',  title: '+50 000 сум',  description: 'Пополнить баланс на 50 000 сум',  icon: '💰', cost: 2000, type: 'coins',  value: 50000  },
  { id: 'coins100', title: '+100 000 сум', description: 'Пополнить баланс на 100 000 сум', icon: '💎', cost: 3500, type: 'coins',  value: 100000 },
];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { itemId } = await req.json() as { itemId?: string };
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });

  const user = await prisma.users.findUnique({
    where:  { id: session.user.id },
    select: { arcCoins: true, balanceUzs: true },
  });
  if (!user) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });

  if (user.arcCoins < item.cost) {
    return NextResponse.json({ error: `Недостаточно монет. Нужно ${item.cost} ARC, у вас ${user.arcCoins}` }, { status: 400 });
  }

  // Deduct coins
  await prisma.users.update({
    where: { id: session.user.id },
    data:  { arcCoins: { decrement: item.cost } },
  });

  let result: Record<string, unknown> = {};

  if (item.type === 'promo') {
    // Generate single-use promo code
    const code = `ARC-${nanoid(6).toUpperCase()}`;
    const promo = await prisma.promo_codes.create({
      data: {
        code,
        type:        'PERCENT',
        value:       item.value as number,
        maxUses:     1,
        usedCount:   0,
        isActive:    true,
        expiresAt:   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
    result = { promoCode: promo.code, discount: item.value, expiresAt: promo.expiresAt };
  } else if (item.type === 'coins') {
    // Add UZS balance
    await prisma.users.update({
      where: { id: session.user.id },
      data:  { balanceUzs: { increment: item.value as number } },
    });
    result = { addedBalance: item.value };
  }

  // Log transaction
  await prisma.transactions.create({
    data: {
      id:            nanoid(),
      userId:        session.user.id,
      type:          'ADMIN_GRANT',
      amount:        -item.cost,
      balanceBefore: user.arcCoins,
      balanceAfter:  user.arcCoins - item.cost,
      description:   `Магазин ARC: ${item.title}`,
    },
  });

  return NextResponse.json({ ok: true, item, ...result });
}
