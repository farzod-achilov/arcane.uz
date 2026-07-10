import { prisma } from '@/lib/prisma';
import NewReleasesClient from './NewReleasesClient';

export const dynamic = 'force-dynamic';

export type NewGame = {
  id:           string;
  title:        string;
  slug:         string;
  cover:        string | null;
  priceUzs:     number | null;
  rating:       number | null;
  genres:       string[];
  platforms:    string[];
  deliveryType: 'AUTO' | 'MANUAL';
  createdAt:    string;
  isNew7:       boolean;
  isNew30:      boolean;
};

async function getNewReleases(): Promise<NewGame[]> {
  const now    = new Date();
  const ago7   = new Date(now.getTime() - 7  * 24 * 3_600_000);
  const ago30  = new Date(now.getTime() - 30 * 24 * 3_600_000);

  const rows = await prisma.games.findMany({
    where:   { isActive: true, priceUzs: { gt: 0 }, createdAt: { gte: ago30 } },
    orderBy: { createdAt: 'desc' },
    take:    48,
    select: {
      id: true, title: true, slug: true, cover: true,
      priceUzs: true, rating: true, genres: true,
      platforms: true, deliveryType: true, createdAt: true,
    },
  });

  return rows.map(g => ({
    id:           g.id,
    title:        g.title,
    slug:         g.slug,
    cover:        g.cover,
    priceUzs:     g.priceUzs,
    rating:       g.rating,
    genres:       g.genres,
    platforms:    g.platforms,
    deliveryType: g.deliveryType as 'AUTO' | 'MANUAL',
    createdAt:    g.createdAt.toISOString(),
    isNew7:       g.createdAt >= ago7,
    isNew30:      true,
  }));
}

export default async function NewReleasesPage() {
  const games = await getNewReleases();
  return <NewReleasesClient games={games} />;
}
