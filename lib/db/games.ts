import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

/* ── Shared select shape ── */
const LIST_SELECT = {
  id: true, title: true, slug: true, cover: true,
  genres: true, platforms: true, rating: true,
  priceUzs: true, priceUsd: true,
  stockStore: true, releaseDate: true,
  developer: true, description: true,
} as const;

export type GameListItem = Prisma.gamesGetPayload<{ select: typeof LIST_SELECT }>;

export type GameFilters = {
  q?:        string;
  genre?:    string;
  platform?: string;
  sort?:     string;
  page?:     number;
  limit?:    number;
  inStock?:  boolean;
};

/* ── Build WHERE clause ── */
function buildWhere(f: GameFilters): Prisma.gamesWhereInput {
  return {
    isActive: true,
    ...(f.inStock ? { stockStore: { gt: 0 } } : {}),
    ...(f.q ? {
      OR: [
        { title:       { contains: f.q, mode: 'insensitive' } },
        { description: { contains: f.q, mode: 'insensitive' } },
        { developer:   { contains: f.q, mode: 'insensitive' } },
        { publisher:   { contains: f.q, mode: 'insensitive' } },
      ],
    } : {}),
    ...(f.genre    ? { genres:    { has: f.genre    } } : {}),
    ...(f.platform ? { platforms: { has: f.platform } } : {}),
  };
}

/* ── Build ORDER BY ── */
function buildOrder(sort = 'newest'): Prisma.gamesOrderByWithRelationInput {
  switch (sort) {
    case 'price_asc':  return { priceUzs: 'asc'  };
    case 'price_desc': return { priceUzs: 'desc' };
    case 'rating':     return { rating:   'desc' };
    case 'name':       return { title:    'asc'  };
    default:           return { createdAt: 'desc' };
  }
}

/* ── List games (with pagination) ── */
export async function getGames(f: GameFilters = {}) {
  const page  = Math.max(1, f.page  ?? 1);
  const limit = Math.min(48, Math.max(1, f.limit ?? 24));
  const where = buildWhere(f);

  const [total, games] = await prisma.$transaction([
    prisma.games.count({ where }),
    prisma.games.findMany({
      where,
      orderBy: buildOrder(f.sort),
      skip:    (page - 1) * limit,
      take:    limit,
      select:  LIST_SELECT,
    }),
  ]);

  return { games: games as GameListItem[], total, page, limit, pages: Math.ceil(total / limit) };
}

/* ── Single game by slug ── */
export async function getGameBySlug(slug: string) {
  return prisma.games.findUnique({
    where:  { slug },
    select: {
      id: true, title: true, slug: true, cover: true,
      screenshots: true, description: true,
      genres: true, platforms: true, rating: true,
      priceUzs: true, priceUsd: true,
      releaseDate: true, developer: true, publisher: true,
      isActive: true, stockStore: true, externalId: true, source: true,
    },
  });
}

/* ── Distinct genres (cached 5 min) ── */
export const getDistinctGenres = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await prisma.games.findMany({
      where:  { isActive: true },
      select: { genres: true },
    });
    const all = rows.flatMap((r) => r.genres);
    return Array.from(new Set(all)).sort();
  },
  ['distinct-genres'],
  { revalidate: 300 },
);

/* ── Similar games by genres ── */
export async function getSimilarGames(slug: string, genres: string[], limit = 4) {
  if (!genres.length) return [];
  return prisma.games.findMany({
    where:   { isActive: true, NOT: { slug }, genres: { hasSome: genres } },
    orderBy: { rating: 'desc' },
    take:    limit,
    select:  LIST_SELECT,
  });
}
