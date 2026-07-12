import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

/* ── Shared select shape ── */
const LIST_SELECT = {
  id: true, title: true, slug: true, cover: true,
  genres: true, platforms: true, rating: true,
  priceUzs: true, priceUsd: true,
  stockStore: true, stockDrop: true, deliveryType: true, productType: true,
  releaseDate: true, developer: true, description: true,
  // priceUzs above is kept in sync as the minimum active variant price
  // (see lib/db/gameVariants.ts's syncGameFromVariants) — this just tells
  // the UI whether to show a "от" (starting-from) price prefix and lets a
  // picker be built without a second query.
  variants: {
    where:   { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select:  { id: true, label: true, priceUzs: true, productType: true },
  },
} as const;

export type GameListItem = Prisma.gamesGetPayload<{ select: typeof LIST_SELECT }>;

export type GameFilters = {
  q?:        string;
  genres?:   string[];
  platform?: string;
  sort?:     string;
  page?:     number;
  limit?:    number;
  inStock?:  boolean;
  priceMin?: number;
  priceMax?: number;
};

/* ── Build WHERE clause ── */
function buildWhere(f: GameFilters): Prisma.gamesWhereInput {
  return {
    isActive: true,
    // товар без цены нельзя купить — на витрину не попадает
    priceUzs: { gt: 0 },
    ...(f.inStock ? { stockStore: { gt: 0 } } : {}),
    ...(f.q ? {
      OR: [
        { title:       { contains: f.q, mode: 'insensitive' } },
        { description: { contains: f.q, mode: 'insensitive' } },
        { developer:   { contains: f.q, mode: 'insensitive' } },
        { publisher:   { contains: f.q, mode: 'insensitive' } },
      ],
    } : {}),
    ...(f.genres?.length ? { genres: { hasSome: f.genres } } : {}),
    ...(f.platform ? { platforms: { has: f.platform } } : {}),
    ...(f.priceMin != null || f.priceMax != null ? {
      priceUzs: {
        gt: 0,
        ...(f.priceMin != null ? { gte: f.priceMin } : {}),
        ...(f.priceMax != null ? { lte: f.priceMax } : {}),
      },
    } : {}),
  };
}

/* ── Build ORDER BY ── */
function buildOrder(sort = 'newest'): Prisma.gamesOrderByWithRelationInput {
  switch (sort) {
    case 'price_asc':  return { priceUzs:   'asc'  };
    case 'price_desc': return { priceUzs:   'desc' };
    case 'rating':     return { rating:     'desc' };
    case 'name':       return { title:      'asc'  };
    case 'popular':    return { salesCount: 'desc' };
    default:           return { createdAt:  'desc' };
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
      isActive: true, stockStore: true, deliveryType: true, productType: true, externalId: true, source: true,
      variants: {
        where:   { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select:  { id: true, label: true, priceUzs: true, priceUsd: true, productType: true },
      },
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
export async function getSimilarGames(
  slug: string,
  genres: string[],
  platforms: string[],
  limit = 8,
) {
  // Fetch candidates by genre overlap, fall back to platform overlap
  const byGenre = genres.length
    ? await prisma.games.findMany({
        where:   { isActive: true, priceUzs: { gt: 0 }, NOT: { slug }, genres: { hasSome: genres } },
        orderBy: [{ salesCount: 'desc' }, { rating: 'desc' }],
        take:    40,
        select:  { ...LIST_SELECT, salesCount: true },
      })
    : [];

  // If not enough matches, supplement with platform matches
  let candidates = byGenre;
  if (candidates.length < limit && platforms.length) {
    const existingIds = new Set(candidates.map(g => g.id));
    const byPlatform = await prisma.games.findMany({
      where: {
        isActive:  true,
        priceUzs:  { gt: 0 },
        NOT:       { slug },
        id:        { notIn: Array.from(existingIds) },
        platforms: { hasSome: platforms },
      },
      orderBy: [{ salesCount: 'desc' }, { rating: 'desc' }],
      take:    limit,
      select:  { ...LIST_SELECT, salesCount: true },
    });
    candidates = [...candidates, ...byPlatform];
  }

  // Score: genre overlap count × 10 + platform overlap count × 3 + rating
  const scored = candidates.map(g => {
    const genreScore    = g.genres.filter(x => genres.includes(x)).length * 10;
    const platformScore = g.platforms.filter(x => platforms.includes(x)).length * 3;
    const ratingScore   = (g.rating ?? 0);
    return { game: g, score: genreScore + platformScore + ratingScore };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ game }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { salesCount: _, ...rest } = game;
      return rest as GameListItem;
    });
}
