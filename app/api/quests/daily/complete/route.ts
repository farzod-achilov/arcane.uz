import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DAILY_QUESTS, todayDate } from '@/lib/quests';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

// POST /api/quests/daily/complete — { questId }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { questId?: string };
  const questId = body.questId;
  if (!questId) return NextResponse.json({ error: 'questId required' }, { status: 400 });
  const quest = DAILY_QUESTS.find(q => q.id === questId);
  if (!quest) return NextResponse.json({ error: 'Quest not found' }, { status: 404 });

  const today = todayDate();

  // Check already completed today
  const existing = await prisma.daily_quest_completions.findUnique({
    where: { userId_questId_date: { userId: session.user.id, questId, date: today } },
  });
  if (existing) return NextResponse.json({ ok: true, alreadyDone: true });

  // Award coins + record completion
  const user = await prisma.users.findUnique({
    where:  { id: session.user.id },
    select: { arcCoins: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await prisma.$transaction([
    prisma.daily_quest_completions.create({
      data: { userId: session.user.id, questId, date: today, reward: quest.reward },
    }),
    prisma.users.update({
      where: { id: session.user.id },
      data:  { arcCoins: { increment: quest.reward } },
    }),
    prisma.transactions.create({
      data: {
        id:            nanoid(),
        userId:        session.user.id,
        type:          'ADMIN_GRANT',
        amount:        quest.reward,
        balanceBefore: user.arcCoins,
        balanceAfter:  user.arcCoins + quest.reward,
        description:   `Дневное задание: ${quest.title}`,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, reward: quest.reward });
}
