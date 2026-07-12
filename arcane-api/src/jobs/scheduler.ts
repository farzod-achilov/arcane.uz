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
import { kinguinCatalogSyncJob, enebaCatalogSyncJob, dropshipRepriceJob, kinguinBalanceCheckJob, dropshipAutoRetryJob } from './suppliers.cron';
import { alertJobFailure } from './alertFailure';

// A job failing once is often transient (a timeout, a flaky upstream) — only
// alert once it's failed this many runs in a row, so a single blip doesn't
// page anyone.
const FAILURE_ALERT_THRESHOLD = 3;

interface ScheduledJob {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
  task?: cron.ScheduledTask;
  lastRun?: Date;
  lastError?: string;
  consecutiveFailures?: number;
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
    // маржа dropship-игр: закупка Kinguin → Smart Pricing → цена витрины
    { name: 'dropship-reprice',     schedule: '20 */6 * * *', handler: dropshipRepriceJob },
    // алерт в Telegram при низком балансе Kinguin
    { name: 'kinguin-balance-check', schedule: '10 */2 * * *', handler: kinguinBalanceCheckJob },
    // авто-повтор доставки застрявших dropship-заказов
    { name: 'dropship-auto-retry', schedule: '*/15 * * * *', handler: dropshipAutoRetryJob },
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
          job.consecutiveFailures = 0;
          logger.debug(`[Scheduler] ${job.name} done in ${Date.now() - start}ms`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'unknown error';
          job.lastError = msg;
          job.consecutiveFailures = (job.consecutiveFailures ?? 0) + 1;
          logger.error(`[Scheduler] ${job.name} failed (${job.consecutiveFailures} in a row): ${msg}`);
          if (job.consecutiveFailures >= FAILURE_ALERT_THRESHOLD) {
            void alertJobFailure(job.name, msg, job.consecutiveFailures);
          }
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

  status(): Array<{ name: string; schedule: string; lastRun?: Date; lastError?: string; consecutiveFailures?: number }> {
    return this.jobs.map(({ name, schedule, lastRun, lastError, consecutiveFailures }) => ({
      name, schedule, lastRun, lastError, consecutiveFailures,
    }));
  }
}

export const scheduler = new Scheduler();
