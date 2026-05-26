import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/wishlist/toggle — { gameId } → { inWishlist: boolean }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { gameId } = await req.json() as { gameId?: string };
  if (!gameId) return NextResponse.json({ error: 'gameId required' }, { status: 400 });

  const existing = await prisma.wishlists.findUnique({
    where: { userId_gameId: { userId: session.user.id, gameId } },
  });

  if (existing) {
    await prisma.wishlists.delete({ where: { id: existing.id } });
    return NextResponse.json({ inWishlist: false });
  }

  await prisma.wishlists.create({ data: { userId: session.user.id, gameId } });
  return NextResponse.json({ inWishlist: true });
}
