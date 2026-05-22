import { Rarity } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { cacheGet, cacheSet } from '../../lib/redis';
import { config } from '../../config';
import { assignRarity, calculateSellValue } from './games.filter';
import type { NormalizedGame } from './games.normalizer';

export interface GameFilters {
  search?: string;
  genre?: string;
  platform?: string;
  rarity?: Rarity;
  source?: string;
  minRating?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

class GamesService {
  async list(filters: GameFilters = {}) {
    const {
      search, genre, platform, minRating, maxPrice,
      source, page = 1, limit = 24,
    } = filters;

    const where: Record<string, unknown> = { isActive: true };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    if (genre) {
      where.genres = { has: genre };
    }
    if (platform) {
      where.platforms = { has: platform };
    }
    if (minRating) {
      where.rating = { gte: minRating };
    }
    if (maxPrice) {
      where.priceUzs = { lte: maxPrice };
    }
    if (source) {
      where.source = source;
    }

    const skip = (page - 1) * limit;

    const [total, games] = await Promise.all([
      prisma.game.count({ where }),
      prisma.game.findMany({
        where,
        orderBy: [{ rating: 'desc' }, { syncedAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      data: games,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    return prisma.game.findUnique({ where: { id } });
  }

  async findBySlug(slug: string) {
    return prisma.game.findUnique({ where: { slug } });
  }

  async getHotGames() {
    const cacheKey = 'cache:games:hot';
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const games = await prisma.game.findMany({
      where: { isActive: true, rating: { gte: 75 } },
      orderBy: { rating: 'desc' },
      take: 20,
    });

    await cacheSet(cacheKey, games, config.redis_ttl.hotGames);
    return games;
  }

  async getByRarity(rarity: Rarity, limit = 10) {
    const cacheKey = `cache:games:rarity:${rarity}`;
    const cached = await cacheGet<unknown[]>(cacheKey);
    if (cached) return cached;

    // Fetch candidates and filter by computed rarity
    const candidates = await prisma.game.findMany({
      where: { isActive: true },
      orderBy: { rating: 'desc' },
      take: 500,
    });

    const filtered = candidates.filter((g) => {
      const norm: NormalizedGame = {
        externalId: g.externalId ?? '',
        source: g.source as 'igdb' | 'rawg' | 'steam',
        title: g.title,
        slug: g.slug,
        rating: g.rating ?? undefined,
        priceUsd: g.priceUsd ?? undefined,
        genres: g.genres,
        platforms: g.platforms,
        screenshots: g.screenshots,
      };
      return assignRarity(norm) === rarity;
    });

    const result = filtered.slice(0, limit);
    await cacheSet(cacheKey, result, 300);
    return result;
  }

  async updateGame(id: string, data: Partial<{
    isActive: boolean;
    rarity: string;
    priceUsd: number;
    priceUzs: number;
  }>) {
    return prisma.game.update({ where: { id }, data });
  }

  async getSyncStats() {
    const [total, bySource, lastSync] = await Promise.all([
      prisma.game.count({ where: { isActive: true } }),
      prisma.game.groupBy({ by: ['source'], _count: { id: true } }),
      prisma.game.findFirst({ orderBy: { syncedAt: 'desc' }, select: { syncedAt: true } }),
    ]);

    return {
      total,
      bySource: Object.fromEntries(bySource.map((s) => [s.source, s._count.id])),
      lastSyncedAt: lastSync?.syncedAt ?? null,
    };
  }

  // Compute reward metadata for assigning a game to a drop
  computeRewardMeta(game: {
    title: string; priceUsd: number | null; rating: number | null;
    cover: string | null; id: string;
  }) {
    const norm: NormalizedGame = {
      externalId: game.id,
      source: 'igdb',
      title: game.title,
      slug: '',
      rating: game.rating ?? undefined,
      priceUsd: game.priceUsd ?? undefined,
      genres: [],
      platforms: [],
      screenshots: [],
    };

    return {
      rarity: assignRarity(norm),
      sellValue: calculateSellValue(norm),
      dropChance: 0, // set explicitly by admin when assigning to drop
    };
  }
}

export const gamesService = new GamesService();
