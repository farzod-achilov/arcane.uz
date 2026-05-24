import cron from 'node-cron';
import { OffersService } from '../services/offers.service';

/**
 * Scheduled job — recalculates finalPrice for every active offer.
 *
 * Use cases:
 *  - Supplier changed their prices in bulk (supplierPrice updated externally)
 *  - globalMarkupPercent was updated
 *  - New pricing rules were added
 *
 * Default schedule: every hour at :00
 * Override via UPDATE_PRICES_CRON env var (standard cron syntax).
 */
export function startUpdatePricesJob(service: OffersService): cron.ScheduledTask {
  const expression = process.env.UPDATE_PRICES_CRON ?? '0 * * * *';

  const task = cron.schedule(expression, async () => {
    const start = Date.now();
    try {
      console.log(`[cron:updatePrices] starting at ${new Date().toISOString()}`);
      const { updated } = await service.recalculateAll();
      console.log(`[cron:updatePrices] done — ${updated} offers updated in ${Date.now() - start}ms`);
    } catch (err) {
      console.error('[cron:updatePrices] failed:', err);
    }
  });

  console.log(`[cron:updatePrices] scheduled with expression "${expression}"`);
  return task;
}
