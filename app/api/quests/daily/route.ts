import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DAILY_QUESTS, todayDate } from '@/lib/quests';

export const dynamic = 'force-dynamic';

// GET /api/quests/daily — return today's quest status for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ quests: [] });

  const today = todayDate();
  const completions = await prisma.daily_quest_completions.findMany({
    where: { userId: session.user.id, date: today },
    select: { questId: true, reward: true, createdAt: true },
  });

  const completedMap = new Map(completions.map(c => [c.questId, c]));

  const quests = DAILY_QUESTS.map(q => ({
    ...q,
    completed:   completedMap.has(q.id),
    completedAt: completedMap.get(q.id)?.createdAt ?? null,
  }));

  const totalReward  = completions.reduce((s, c) => s + c.reward, 0);
  const maxReward    = DAILY_QUESTS.reduce((s, q) => s + q.reward, 0);
  const completedCnt = completions.length;

  return NextResponse.json({ quests, totalReward, maxReward, completedCnt, total: DAILY_QUESTS.length });
}
