import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { cacheSet } from '../lib/redis';
import { config } from '../config';
import {
  runFullSync,
  importFromRawg,
  importFromIgdb,
  refreshPrices,
  cacheHotGames,
} from '../modules/games/games.import';
import { rawgService } from '../services/rawg/rawg.service';
import { usdToUzs } from '../modules/games/games.normalizer';

// ── Full sync (every 12h) ─────────────────────────────────────────────────────

export async function gamesSyncJob(): Promise<void> {
  logger.info('[CronJob] games-full-sync: starting');
  const results = await runFullSync();

  const summary = results.reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      created: acc.created + r.created,
      updated: acc.updated + r.updated,
      errors: acc.errors + r.errors,
    }),
    { total: 0, created: 0, updated: 0, errors: 0 }
  );

  logger.info('[CronJob] games-full-sync: complete', summary);
}

// ── Price refresh (every 6h) ──────────────────────────────────────────────────

export async function priceRefreshJob(): Promise<void> {
  logger.info('[CronJob] price-refresh: starting');
  const updated = await refreshPrices();
  logger.info(`[CronJob] price-refresh: updated ${updated} prices`);
}

// ── Ratings refresh from RAWG (daily 2am) ────────────────────────────────────

export async function ratingsRefreshJob(): Promise<void> {
  logger.info('[CronJob] ratings-refresh: starting');

  const rawgGames = await prisma.game.findMany({
    where: { source: 'rawg', isActive: true },
    select: { id: true, externalId: true },
    take: 200,
  });

  let updated = 0;
  for (const g of rawgGames) {
    try {
      const normalized = await rawgService.getGameById(parseInt(g.externalId!, 10));
      if (!normalized || !normalized.rating) continue;

      await prisma.game.update({
        where: { id: g.id },
        data: { rating: normalized.rating, syncedAt: new Date() },
      });
      updated++;
      await new Promise((r) => setTimeout(r, 100)); // rate limit buffer
    } catch {
      // Non-fatal: continue
    }
  }

  logger.info(`[CronJob] ratings-refresh: updated ${updated} ratings`);
}

// ── New releases (daily 8am) ──────────────────────────────────────────────────

export async function newReleasesJob(): Promise<void> {
  logger.info('[CronJob] new-releases: starting');

  try {
    const games = await rawgService.getNewReleases(1, 40);
    logger.info(`[CronJob] new-releases: fetched ${games.length} new releases`);

    let created = 0;
    for (const game of games) {
      const exists = await prisma.game.findUnique({
        where: { externalId_source: { externalId: game.externalId, source: game.source } },
        select: { id: true },
      });

      if (exists) continue;

      const priceUzs = game.priceUsd != null ? usdToUzs(game.priceUsd) : null;

      await prisma.game.create({
        data: {
          externalId: game.externalId,
          source: game.source,
          title: game.title,
          slug: game.slug,
          cover: game.cover ?? null,
          screenshots: game.screenshots,
          description: game.description ?? null,
          genres: game.genres,
          platforms: game.platforms,
          rating: game.rating ?? null,
          priceUsd: game.priceUsd ?? null,
          priceUzs,
          releaseDate: game.releaseDate ?? null,
          developer: game.developer ?? null,
          publisher: game.publisher ?? null,
          syncedAt: new Date(),
        },
      });
      created++;
    }

    logger.info(`[CronJob] new-releases: saved ${created} new games`);
  } catch (err) {
    logger.error('[CronJob] new-releases: failed', err);
    throw err;
  }
}

// ── Cache warmup (every 15min) ────────────────────────────────────────────────

export async function cacheWarmupJob(): Promise<void> {
  await Promise.allSettled([
    cacheHotGames(),
    cacheFeaturedDrops(),
    cacheHomepageData(),
  ]);
}

async function cacheFeaturedDrops(): Promise<void> {
  const drops = await prisma.dropMachine.findMany({
    where: { isActive: true },
    orderBy: [{ featuredOrder: 'asc' }, { totalOpened: 'desc' }],
    take: 6,
    include: { rewards: { where: { isActive: true } } },
  });

  await cacheSet('cache:drops:featured', drops, 300);
}

async function cacheHomepageData(): Promise<void> {
  const [hotGames, latestDrops, jackpot] = await Promise.all([
    prisma.game.findMany({
      where: { isActive: true, rating: { gte: 80 } },
      orderBy: { rating: 'desc' },
      take: 8,
    }),
    prisma.liveDrop.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.jackpot.findFirst(),
  ]);

  await cacheSet(
    'cache:homepage',
    { hotGames, latestDrops, jackpot },
    config.redis_ttl.hotGames
  );
}
