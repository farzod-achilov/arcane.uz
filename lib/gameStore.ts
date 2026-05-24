import { prisma } from './prisma';
import type { ArcaneGame } from './arcaneApi';

// Maps Prisma games row → ArcaneGame shape used by the storefront
function toArcaneGame(g: {
  id: string; externalId: string | null; source: string; title: string; slug: string;
  cover: string | null; screenshots: string[]; description: string | null;
  genres: string[]; platforms: string[]; rating: number | null; priceUsd: number | null;
  priceUzs: number | null; releaseDate: Date | null; developer: string | null;
  publisher: string | null; isActive: boolean; stockStore: number; stockDrop: number;
  syncedAt: Date | null; createdAt: Date;
}): ArcaneGame {
  return {
    id:          g.id,
    externalId:  g.externalId,
    source:      g.source,
    title:       g.title,
    slug:        g.slug,
    cover:       g.cover,
    screenshots: g.screenshots,
    description: g.description,
    genres:      g.genres,
    platforms:   g.platforms,
    rating:      g.rating,
    priceUsd:    g.priceUsd,
    priceUzs:    g.priceUzs,
    releaseDate: g.releaseDate?.toISOString() ?? null,
    developer:   g.developer,
    publisher:   g.publisher,
    isActive:    g.isActive,
    stockStore:  g.stockStore,
    stockDrop:   g.stockDrop,
    syncedAt:    g.syncedAt?.toISOString() ?? null,
    createdAt:   g.createdAt.toISOString(),
  };
}

export const gameStore = {
  async add(game: ArcaneGame): Promise<void> {
    await prisma.games.create({
      data: {
        id:          game.id,
        externalId:  game.externalId,
        source:      game.source,
        title:       game.title,
        slug:        game.slug,
        cover:       game.cover,
        screenshots: game.screenshots,
        description: game.description,
        genres:      game.genres,
        platforms:   game.platforms,
        rating:      game.rating,
        priceUsd:    game.priceUsd,
        priceUzs:    game.priceUzs,
        releaseDate: game.releaseDate ? new Date(game.releaseDate) : null,
        developer:   game.developer,
        publisher:   game.publisher,
        isActive:    game.isActive,
        stockStore:  game.stockStore,
        stockDrop:   game.stockDrop,
        updatedAt:   new Date(),
      },
    });
  },

  async getAll(): Promise<ArcaneGame[]> {
    const rows = await prisma.games.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toArcaneGame);
  },

  async getById(id: string): Promise<ArcaneGame | null> {
    const row = await prisma.games.findUnique({ where: { id } });
    return row ? toArcaneGame(row) : null;
  },

  async deleteById(id: string): Promise<void> {
    await prisma.games.delete({ where: { id } });
  },
};
