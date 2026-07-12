import { prisma } from '../../lib/prisma';
import { cacheSet, cacheDel } from '../../lib/redis';
import { logger } from '../../lib/logger';
import { config } from '../../config';
import { igdbService } from '../../services/igdb/igdb.service';
import { rawgService } from '../../services/rawg/rawg.service';
import { steamService } from '../../services/steam/steam.service';
import { steamClient } from '../../services/steam/steam.client';
import { assignRarity, calculateSellValue, getDropChance } from './games.filter';
import { usdToUzs } from './games.normalizer';
import type { NormalizedGame } from './games.normalizer';

// ── Import result ─────────────────────────────────────────────────────────────

export interface ImportResult {
  source: string;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  durationMs: number;
}

// ── Upsert single game into DB ────────────────────────────────────────────────

async function upsertGame(game: NormalizedGame): Promise<'created' | 'updated' | 'skipped'> {
  if (!game.title || !game.slug) return 'skipped';

  const priceUzs = game.priceUsd != null ? usdToUzs(game.priceUsd) : null;

  const data = {
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
    source: game.source,
    syncedAt: new Date(),
  };

  const existing = await prisma.game.findUnique({
    where: { externalId_source: { externalId: game.externalId, source: game.source } },
  });

  if (existing) {
    // isActive is deliberately left untouched here — keys.cron.ts's
    // autoDisableEmptyGamesJob turns it off for zero-stock games every 30min,
    // and an admin can also flip it by hand. Resetting it to true on every
    // metadata re-sync (this job runs every 12h) fought that decision and
    // produced an endless disable→resync→re-enable→disable loop for every
    // game with no keys uploaded — which is all of them right now.
    await prisma.game.update({ where: { id: existing.id }, data });
    return 'updated';
  }

  // New imports have no key inventory yet either, but starting them active
  // is fine — the very next autoDisableEmptyGamesJob run (≤30min) will
  // correctly flip them to false until someone uploads keys.
  await prisma.game.create({ data: { ...data, externalId: game.externalId, isActive: true } });
  return 'created';
}

// ── Import from source ────────────────────────────────────────────────────────

async function importGames(
  source: string,
  fetcher: () => Promise<NormalizedGame[]>
): Promise<ImportResult> {
  const start = Date.now();
  const result: ImportResult = {
    source,
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    durationMs: 0,
  };

  logger.info(`[GameImport] Starting import from ${source}`);

  let games: NormalizedGame[] = [];
  try {
    games = await fetcher();
  } catch (err) {
    logger.error(`[GameImport] Failed to fetch from ${source}`, err);
    result.errors++;
    result.durationMs = Date.now() - start;
    return result;
  }

  result.total = games.length;
  logger.info(`[GameImport] Fetched ${games.length} games from ${source}`);

  for (const game of games) {
    try {
      const outcome = await upsertGame(game);
      result[outcome]++;
    } catch (err) {
      logger.error(`[GameImport] Error upserting game "${game.title}"`, err);
      result.errors++;
    }
  }

  result.durationMs = Date.now() - start;
  logger.info(`[GameImport] ${source} done`, result);

  // Bust hot-games cache
  await cacheDel('cache:games:hot');

  return result;
}

// ── Public import functions ───────────────────────────────────────────────────

export async function importFromIgdb(): Promise<ImportResult> {
  // IGDB_CLIENT_ID/SECRET are unset in production — RAWG already covers game
  // metadata sync on its own. Without this guard, igdbClient.getToken() hits
  // Twitch's OAuth endpoint with empty credentials on every 12h sync run,
  // guaranteed to 400, forever — a silent, permanent failure that never
  // surfaced anywhere (runFullSync swallows it into an `errors` counter, so
  // even the cron failure alerting added elsewhere never sees it).
  if (!config.games.igdbClientId || !config.games.igdbClientSecret) {
    logger.debug('[GameImport] Skipping igdb — IGDB_CLIENT_ID/SECRET not configured');
    return {
      source: 'igdb', total: 0, created: 0, updated: 0, skipped: 0, errors: 0, durationMs: 0,
    };
  }
  return importGames('igdb', () => igdbService.getTopRatedGames(100));
}

export async function importFromRawg(): Promise<ImportResult> {
  return importGames('rawg', async () => {
    const [topRated, newReleases] = await Promise.all([
      rawgService.getTopRatedGames(1, 40),
      rawgService.getNewReleases(1, 40),
    ]);

    // Deduplicate by externalId
    const seen = new Set<string>();
    const deduped = [...topRated, ...newReleases].filter((g) => {
      if (seen.has(g.externalId)) return false;
      seen.add(g.externalId);
      return true;
    });

    // Enrich games that have a Steam App ID with trailer from Steam API
    const enriched = await Promise.allSettled(
      deduped.map(async (game) => {
        if (!game._steamAppId || game.screenshots.some((s) => s.startsWith('video:'))) {
          return game;
        }
        try {
          const steam = await steamClient.fetchAppDetails(game._steamAppId);
          const trailerUrl = steam?.movies?.[0]?.mp4?.max;
          if (trailerUrl) {
            return { ...game, screenshots: [`video:${trailerUrl}`, ...game.screenshots] };
          }
        } catch { /* non-fatal — skip trailer for this game */ }
        return game;
      })
    );

    return enriched
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<typeof deduped[0]>).value);
  });
}

export async function importFromSteam(appIds: number[]): Promise<ImportResult> {
  return importGames('steam', () => steamService.getMultipleGames(appIds));
}

// ── Full sync ─────────────────────────────────────────────────────────────────

export async function runFullSync(): Promise<ImportResult[]> {
  logger.info('[GameImport] Running full sync from all sources');
  const results = await Promise.allSettled([importFromRawg(), importFromIgdb()]);

  return results.map((r) =>
    r.status === 'fulfilled'
      ? r.value
      : { source: 'unknown', total: 0, created: 0, updated: 0, skipped: 0, errors: 1, durationMs: 0 }
  );
}

// ── Price refresh ─────────────────────────────────────────────────────────────

export async function refreshPrices(): Promise<number> {
  const steamGames = await prisma.game.findMany({
    where: { source: 'steam', isActive: true },
    select: { id: true, externalId: true },
  });

  let updated = 0;
  const USD_RATE = parseInt(process.env.USD_TO_UZS || '12700', 10);

  for (const g of steamGames) {
    try {
      const details = await steamService.getGameDetails(parseInt(g.externalId!, 10));
      if (!details || details.priceUsd == null) continue;

      const priceUzs = Math.round((details.priceUsd * USD_RATE) / 1000) * 1000;
      await prisma.game.update({
        where: { id: g.id },
        data: { priceUsd: details.priceUsd, priceUzs, syncedAt: new Date() },
      });
      updated++;
    } catch {
      // Non-fatal: skip and continue
    }
  }

  logger.info(`[PriceRefresh] Updated prices for ${updated} Steam games`);
  return updated;
}

// ── Cache hot games ───────────────────────────────────────────────────────────

export async function cacheHotGames(): Promise<void> {
  const hotGames = await prisma.game.findMany({
    where: { isActive: true, rating: { gte: 75 } },
    orderBy: [{ rating: 'desc' }],
    take: 20,
  });

  await cacheSet('cache:games:hot', hotGames, config.redis_ttl.hotGames);
  logger.info('[Cache] Hot games cached');
}
