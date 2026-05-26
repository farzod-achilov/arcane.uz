import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const cases = await prisma.drop_machines.findMany({
    orderBy: [{ featuredOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id:           true,
      name:         true,
      slug:         true,
      theme:        true,
      price:        true,
      description:  true,
      imageUrl:     true,
      isActive:     true,
      totalOpened:  true,
      featuredOrder:true,
      drop_rewards: {
        where:   { isActive: true },
        select:  { id: true, name: true, rarity: true, dropChance: true, type: true },
        orderBy: { dropChance: 'desc' },
      },
    },
  });

  return NextResponse.json({ cases });
}
