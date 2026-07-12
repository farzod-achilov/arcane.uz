import { logger } from '../lib/logger';
import { config } from '../config';

/* ─────────────────────────────────────────────────────────
   Reports a cron job's failure to the main app's Telegram alert
   route once scheduler.ts's consecutiveFailures counter crosses
   FAILURE_ALERT_THRESHOLD. Same fetch/x-sync-secret pattern as the
   other suppliers.cron.ts calls into the main app.
───────────────────────────────────────────────────────── */

export async function alertJobFailure(jobName: string, error: string, consecutiveFailures: number): Promise<void> {
  if (!config.suppliers.syncSecret) return;

  try {
    const res = await fetch(`${config.suppliers.mainAppUrl}/api/admin/jobs/alert-failure`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-sync-secret': config.suppliers.syncSecret },
      body:    JSON.stringify({ jobName, error, consecutiveFailures }),
      signal:  AbortSignal.timeout(10_000),
    });
    const data = await res.json().catch(() => ({})) as { ok?: boolean; alerted?: boolean };
    if (data.alerted) {
      logger.warn(`[JobFailureAlert] ${jobName}: Telegram alert sent (${consecutiveFailures} in a row)`);
    }
  } catch (err) {
    logger.warn(`[JobFailureAlert] failed to report ${jobName}: ${err instanceof Error ? err.message : err}`);
  }
}
