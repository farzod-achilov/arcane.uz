import { logger } from '../lib/logger';
import { config } from '../config';

/* ─────────────────────────────────────────────────────────
   Keeps the main Next.js app's in-memory supplier catalog caches
   (lib/kinguin/, lib/eneba/, etc.) warm. Those caches reset on every
   deploy/restart of the `arcane` process — without this job, the
   FIRST dropship purchase attempt after any restart fails with
   "No cached offer — run a catalog sync first" and falls back to
   WAITING_MANUAL, even though the supplier itself is configured and
   working. Hitting the same /api/{supplier}/sync POST endpoint an
   admin would click in /admin/suppliers, on a schedule instead.
───────────────────────────────────────────────────────── */

async function syncSupplier(name: string, path: string): Promise<void> {
  if (!config.suppliers.syncSecret) {
    logger.warn(`[SupplierSync] Skipping ${name} — SYNC_SECRET not configured`);
    return;
  }

  const res = await fetch(`${config.suppliers.mainAppUrl}${path}`, {
    method: 'POST',
    headers: { 'x-sync-secret': config.suppliers.syncSecret },
    signal: AbortSignal.timeout(30_000),
  });

  const data = await res.json().catch(() => ({})) as {
    ok?: boolean;
    error?: string;
    result?: { synced?: number };
  };

  if (!res.ok || !data.ok) {
    // Not configured (no supplier credentials yet) is expected/normal for
    // most suppliers today — only warn loudly on an actual HTTP failure.
    if (data.error && /not configured/i.test(data.error)) {
      logger.debug(`[SupplierSync] ${name}: ${data.error}`);
      return;
    }
    logger.warn(`[SupplierSync] ${name} sync failed: ${data.error ?? res.status}`);
    return;
  }

  logger.info(`[SupplierSync] ${name}: synced ${data.result?.synced ?? '?'} products`);
}

export async function kinguinCatalogSyncJob(): Promise<void> {
  await syncSupplier('kinguin', '/api/kinguin/sync');
}

export async function enebaCatalogSyncJob(): Promise<void> {
  await syncSupplier('eneba', '/api/eneba/sync');
}
