import cron from 'node-cron';
import { logger } from '../lib/logger';

// ── Game sync jobs ────────────────────────────────────────────────────────────
import { gamesSyncJob, priceRefreshJob, ratingsRefreshJob, newReleasesJob, cacheWarmupJob } from './games.cron';

// ── Key inventory jobs ────────────────────────────────────────────────────────
import {
  releaseExpiredReservationsJob,
  lowStockScanJob,
  autoDisableEmptyGamesJob,
  warmKeyStockCacheJob,
  dailyKeyAuditJob,
} from './keys.cron';

// ── Dropship supplier cache jobs ─────────────────────────────────────────────
import { kinguinCatalogSyncJob, enebaCatalogSyncJob } from './suppliers.cron';

interface ScheduledJob {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
  task?: cron.ScheduledTask;
  lastRun?: Date;
  lastError?: string;
}

class Scheduler {
  private jobs: ScheduledJob[] = [
    // ── Game sync ──────────────────────────────────────────────────────────────
    { name: 'games-full-sync',    schedule: '0 */12 * * *',  handler: gamesSyncJob },
    { name: 'price-refresh',      schedule: '0 */6 * * *',   handler: priceRefreshJob },
    { name: 'ratings-refresh',    schedule: '0 2 * * *',     handler: ratingsRefreshJob },
    { name: 'new-releases-sync',  schedule: '0 8 * * *',     handler: newReleasesJob },
    { name: 'cache-warmup',       schedule: '*/15 * * * *',  handler: cacheWarmupJob },

    // ── Key inventory ──────────────────────────────────────────────────────────
    { name: 'key-release-expired', schedule: '*/2 * * * *',  handler: releaseExpiredReservationsJob },
    { name: 'key-low-stock-scan',  schedule: '*/30 * * * *', handler: lowStockScanJob },
    { name: 'key-auto-disable',    schedule: '*/30 * * * *', handler: autoDisableEmptyGamesJob },
    { name: 'key-stock-cache',     schedule: '*/10 * * * *', handler: warmKeyStockCacheJob },
    { name: 'key-daily-audit',     schedule: '0 6 * * *',    handler: dailyKeyAuditJob },

    // ── Dropship supplier caches ──────────────────────────────────────────────
    { name: 'kinguin-catalog-sync', schedule: '*/15 * * * *', handler: kinguinCatalogSyncJob },
    { name: 'eneba-catalog-sync',   schedule: '*/15 * * * *', handler: enebaCatalogSyncJob },
  ];

  start(): void {
    for (const job of this.jobs) {
      if (!cron.validate(job.schedule)) {
        logger.error(`[Scheduler] Invalid cron schedule for ${job.name}: ${job.schedule}`);
        continue;
      }

      job.task = cron.schedule(job.schedule, async () => {
        const start = Date.now();
        try {
          await job.handler();
          job.lastRun = new Date();
          logger.debug(`[Scheduler] ${job.name} done in ${Date.now() - start}ms`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'unknown error';
          job.lastError = msg;
          logger.error(`[Scheduler] ${job.name} failed: ${msg}`);
        }
      });

      logger.info(`[Scheduler] Registered: ${job.name} (${job.schedule})`);
    }

    logger.info(`[Scheduler] ${this.jobs.length} cron jobs active`);
  }

  stop(): void {
    for (const job of this.jobs) job.task?.stop();
    logger.info('[Scheduler] All cron jobs stopped');
  }

  async runNow(jobName: string): Promise<void> {
    const job = this.jobs.find((j) => j.name === jobName);
    if (!job) throw new Error(`Job "${jobName}" not found`);
    await job.handler();
    job.lastRun = new Date();
  }

  status(): Array<{ name: string; schedule: string; lastRun?: Date; lastError?: string }> {
    return this.jobs.map(({ name, schedule, lastRun, lastError }) => ({
      name, schedule, lastRun, lastError,
    }));
  }
}

export const scheduler = new Scheduler();
