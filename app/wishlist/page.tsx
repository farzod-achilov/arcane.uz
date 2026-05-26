import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import WishlistClient from './WishlistClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Вишлист — ARCANE.UZ' };
export const dynamic = 'force-dynamic';

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login?next=/wishlist');

  const rows = await prisma.wishlists.findMany({
    where: { userId: session.user.id },
    include: {
      game: {
        select: {
          id: true, title: true, slug: true, cover: true,
          genres: true, platforms: true,
          priceUzs: true, priceUsd: true,
          rating: true, stockStore: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const items = rows.map(r => ({
    ...r.game,
    savedAt: r.createdAt.toISOString(),
  }));

  return <WishlistClient items={items} />;
}
