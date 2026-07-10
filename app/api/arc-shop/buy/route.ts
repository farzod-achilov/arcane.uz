import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { SHOP_ITEMS } from '@/lib/arc-shop';

export const dynamic = 'force-dynamic';

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

  // Deduct coins + grant reward atomically; conditional update guards against concurrent spends
  const result = await prisma.$transaction(async (tx) => {
    const deducted = await tx.users.updateMany({
      where: { id: session.user.id, arcCoins: { gte: item.cost } },
      data:  { arcCoins: { decrement: item.cost } },
    });
    if (deducted.count === 0) return null; // nothing written yet — safe to bail out

    let reward: Record<string, unknown> = {};

    if (item.type === 'promo') {
      // Generate single-use promo code
      const code = `ARC-${nanoid(6).toUpperCase()}`;
      const promo = await tx.promo_codes.create({
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
      reward = { promoCode: promo.code, discount: item.value, expiresAt: promo.expiresAt };
    } else if (item.type === 'coins') {
      // Add UZS balance
      await tx.users.update({
        where: { id: session.user.id },
        data:  { balanceUzs: { increment: item.value as number } },
      });
      reward = { addedBalance: item.value };
    }

    // Log transaction
    await tx.transactions.create({
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

    return reward;
  });

  if (result === null) {
    return NextResponse.json({ error: `Недостаточно монет. Нужно ${item.cost} ARC` }, { status: 400 });
  }

  return NextResponse.json({ ok: true, item, ...result });
}
