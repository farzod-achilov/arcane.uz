import { NextRequest, NextResponse } from 'next/server';
import { CASES, pickWeightedReward, CaseTier } from '@/lib/casesData';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const tier = params.id as CaseTier;
  const caseConfig = CASES[tier];

  if (!caseConfig) {
    return NextResponse.json({ ok: false, error: 'Case not found' }, { status: 404 });
  }

  // Anticipation delay — spins while user waits
  await new Promise((r) => setTimeout(r, 600));

  const reward = pickWeightedReward(caseConfig.rewards);
  return NextResponse.json({ ok: true, reward });
}
