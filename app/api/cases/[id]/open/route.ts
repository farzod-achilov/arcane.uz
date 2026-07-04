import { NextRequest, NextResponse } from 'next/server';
import { getServerSession }          from 'next-auth';
import { authOptions }               from '@/lib/auth';
import { prisma }                    from '@/lib/prisma';
import { nanoid }                    from 'nanoid';
import { CASES, pickWeightedReward, CaseTier } from '@/lib/casesData';
import { rateLimit } from '@/lib/rateLimit';
import { CASES_COMING_SOON } from '@/lib/featureFlags';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (CASES_COMING_SOON) {
    return NextResponse.json(
      { ok: false, error: 'Раздел кейсов в разработке — запуск скоро' },
      { status: 503 },
    );
  }

  const tier       = params.id as CaseTier;
  const caseConfig = CASES[tier];
  if (!caseConfig) return NextResponse.json({ ok: false, error: 'Case not found' }, { status: 404 });

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  // 20 opens per minute per user to prevent abuse while allowing normal play
  const limited = rateLimit(_req, { limit: 20, windowSec: 60, key: `cases:${userId}` });
  if (limited) return limited;
  const price  = caseConfig.price;

  const user = await prisma.users.findUnique({ where: { id: userId }, select: { arcCoins: true, balanceUzs: true } });
  if (!user)                   return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
  if (user.balanceUzs < price) return NextResponse.json({ ok: false, error: 'Недостаточно средств на балансе', code: 'INSUFFICIENT_BALANCE' }, { status: 400 });

  // Anticipation delay — UI spins while we wait
  await new Promise((r) => setTimeout(r, 600));

  const reward = pickWeightedReward(caseConfig.rewards);

  // Atomic DB writes
  await prisma.$transaction(async (tx) => {
    // 1. Deduct UZS balance
    await tx.users.update({
      where: { id: userId },
      data:  { balanceUzs: { decrement: price }, totalDrops: { increment: 1 } },
    });

    // 2. If coins reward — credit arcCoins
    if (reward.type === 'coins' && reward.coinValue > 0) {
      await tx.users.update({
        where: { id: userId },
        data:  { arcCoins: { increment: reward.coinValue } },
      });
      await tx.transactions.create({
        data: {
          id:            nanoid(),
          userId,
          type:          'ADMIN_GRANT',
          amount:        reward.coinValue,
          balanceBefore: user.arcCoins,
          balanceAfter:  user.arcCoins + reward.coinValue,
          description:   `Награда из кейса: ${reward.name}`,
          metadata:      { source: 'case_open', tier },
        },
      });
    }

    // 4. Persist to drop_history + inventory if machine exists in DB
    const machine = await tx.drop_machines.findUnique({
      where:  { slug: tier },
      select: { id: true },
    });

    if (machine) {
      await tx.drop_machines.update({
        where: { id: machine.id },
        data:  { totalOpened: { increment: 1 } },
      });

      const dbReward = await tx.drop_rewards.findFirst({
        where:   { dropId: machine.id, isActive: true },
        orderBy: { createdAt: 'asc' },
        select:  { id: true },
      });

      if (dbReward) {
        await tx.drop_history.create({
          data: {
            id:             nanoid(),
            userId,
            dropId:         machine.id,
            rewardId:       dbReward.id,
            coinsSpent:     price,
            jackpotContrib: 0,
          },
        });
        await tx.inventory.create({
          data: {
            id:       nanoid(),
            userId,
            rewardId: dbReward.id,
            status:   'PENDING',
          },
        });
      }
    }
  });

  return NextResponse.json({ ok: true, reward });
}
