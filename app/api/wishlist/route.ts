import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/wishlist — full game objects for wishlist page
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await prisma.wishlists.findMany({
    where: { userId: session.user.id },
    include: {
      game: {
        select: {
          id: true, title: true, slug: true, cover: true,
          genres: true, platforms: true, priceUzs: true, priceUsd: true,
          rating: true, stockStore: true, deliveryType: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(rows.map(r => ({ ...r.game, wishlistId: r.id, savedAt: r.createdAt })));
}
