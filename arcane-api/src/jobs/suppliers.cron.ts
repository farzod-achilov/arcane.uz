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

/**
 * Держит маржу dropship-игр: подтягивает текущую закупочную цену
 * Kinguin и пересчитывает витринную цену через Smart Pricing.
 * Без этого цена на витрине застывает, а закупка плавает — вплоть
 * до продажи в минус, когда оффер Kinguin дорожает.
 */
export async function dropshipRepriceJob(): Promise<void> {
  if (!config.suppliers.syncSecret) {
    logger.warn('[DropshipReprice] Skipping — SYNC_SECRET not configured');
    return;
  }

  const res = await fetch(`${config.suppliers.mainAppUrl}/api/admin/pricing/dropship-reprice`, {
    method: 'POST',
    headers: { 'x-sync-secret': config.suppliers.syncSecret },
    signal: AbortSignal.timeout(60_000),
  });

  const data = await res.json().catch(() => ({})) as {
    ok?: boolean; error?: string; total?: number; updated?: number;
  };

  if (!res.ok || !data.ok) {
    if (data.error && /not configured/i.test(data.error)) {
      logger.debug(`[DropshipReprice] ${data.error}`);
      return;
    }
    logger.warn(`[DropshipReprice] failed: ${data.error ?? res.status}`);
    return;
  }

  logger.info(`[DropshipReprice] ${data.updated ?? 0}/${data.total ?? 0} games repriced`);
}

/**
 * То же самое, но для game_variants — dropship-reprice выше явно
 * пропускает игры с вариантами (у каждого варианта своя закупка/SKU),
 * так что без этого джоба цена варианта обновляется только вручную
 * кнопкой в админке и застывает между кликами.
 */
export async function dropshipVariantRepriceJob(): Promise<void> {
  if (!config.suppliers.syncSecret) {
    logger.warn('[DropshipVariantReprice] Skipping — SYNC_SECRET not configured');
    return;
  }

  const res = await fetch(`${config.suppliers.mainAppUrl}/api/admin/pricing/dropship-variant-reprice`, {
    method: 'POST',
    headers: { 'x-sync-secret': config.suppliers.syncSecret },
    signal: AbortSignal.timeout(60_000),
  });

  const data = await res.json().catch(() => ({})) as {
    ok?: boolean; error?: string; total?: number; updated?: number;
  };

  if (!res.ok || !data.ok) {
    if (data.error && /not configured/i.test(data.error)) {
      logger.debug(`[DropshipVariantReprice] ${data.error}`);
      return;
    }
    logger.warn(`[DropshipVariantReprice] failed: ${data.error ?? res.status}`);
    return;
  }

  logger.info(`[DropshipVariantReprice] ${data.updated ?? 0}/${data.total ?? 0} variants repriced`);
}

/**
 * Проверка баланса Kinguin: шлёт Telegram-алерт админу, если баланс
 * упал ниже порога. Цель — узнать об этом до того, как реальный заказ
 * клиента упадёт с InsufficientBalance и тихо уйдёт в ручную доставку.
 */
export async function kinguinBalanceCheckJob(): Promise<void> {
  if (!config.suppliers.syncSecret) {
    logger.warn('[BalanceCheck] Skipping — SYNC_SECRET not configured');
    return;
  }

  const res = await fetch(`${config.suppliers.mainAppUrl}/api/admin/kinguin/balance-check`, {
    method: 'POST',
    headers: { 'x-sync-secret': config.suppliers.syncSecret },
    signal: AbortSignal.timeout(30_000),
  });

  const data = await res.json().catch(() => ({})) as {
    ok?: boolean; error?: string; balanceUsd?: number; alerted?: boolean;
  };

  if (!res.ok || !data.ok) {
    if (data.error && /not configured/i.test(data.error)) {
      logger.debug(`[BalanceCheck] ${data.error}`);
      return;
    }
    logger.warn(`[BalanceCheck] failed: ${data.error ?? res.status}`);
    return;
  }

  if (data.alerted) {
    logger.warn(`[BalanceCheck] Kinguin balance low ($${data.balanceUsd}) — Telegram alert sent`);
  } else {
    logger.debug(`[BalanceCheck] Kinguin balance $${data.balanceUsd}`);
  }
}

/**
 * Автоматический повтор доставки для заказов, застрявших в
 * WAITING_MANUAL из-за неудачной закупки у dropship-поставщика
 * (не хватило баланса, временная ошибка сети, холодный кэш каталога).
 * Раньше это делал только админ вручную кнопкой «Повторить закупку».
 */
export async function dropshipAutoRetryJob(): Promise<void> {
  if (!config.suppliers.syncSecret) {
    logger.warn('[AutoRetryDropship] Skipping — SYNC_SECRET not configured');
    return;
  }

  const res = await fetch(`${config.suppliers.mainAppUrl}/api/admin/orders/auto-retry-dropship`, {
    method: 'POST',
    headers: { 'x-sync-secret': config.suppliers.syncSecret },
    signal: AbortSignal.timeout(60_000),
  });

  const data = await res.json().catch(() => ({})) as {
    ok?: boolean; error?: string; candidates?: number; completed?: number; stillWaiting?: number; errored?: number;
  };

  if (!res.ok || !data.ok) {
    logger.warn(`[AutoRetryDropship] failed: ${data.error ?? res.status}`);
    return;
  }

  if ((data.candidates ?? 0) > 0) {
    logger.info(`[AutoRetryDropship] ${data.candidates} candidates → ${data.completed} completed, ${data.stillWaiting} still waiting, ${data.errored} errored`);
  } else {
    logger.debug('[AutoRetryDropship] no stuck dropship orders');
  }
}

/**
 * Автономное пополнение каталога: раз в день сам берёт трендовые
 * игры (RAWG), подбирает чистый Steam-оффер на Kinguin и создаёт
 * dropship-игру — без участия админа. Дневной лимит (10 игр) и
 * "пропустить, если нет RAWG-матча" считаются НА СТОРОНЕ main app
 * (/api/admin/dropship/auto-import) — здесь только расписание.
 * Важно: лимит завязан на то, что этот джоб запускается максимум
 * раз в день (см. schedule в scheduler.ts) — если когда-нибудь
 * понадобится запускать чаще, дневной лимит нужно будет пересчитать
 * иначе (сейчас он просто считает все kinguin-dropship игры,
 * созданные сегодня, включая ручные через админку).
 */
export async function dropshipAutoImportJob(): Promise<void> {
  if (!config.suppliers.syncSecret) {
    logger.warn('[DropshipAutoImport] Skipping — SYNC_SECRET not configured');
    return;
  }

  const res = await fetch(`${config.suppliers.mainAppUrl}/api/admin/dropship/auto-import`, {
    method:  'POST',
    headers: { 'x-sync-secret': config.suppliers.syncSecret },
    signal:  AbortSignal.timeout(180_000),
  });

  const data = await res.json().catch(() => ({})) as {
    ok?: boolean; error?: string; created?: number; duplicates?: number; skippedNoRawg?: number; failed?: number; reason?: string;
  };

  if (!res.ok || !data.ok) {
    if (data.error && /не настроен/i.test(data.error)) {
      logger.debug(`[DropshipAutoImport] ${data.error}`);
      return;
    }
    logger.warn(`[DropshipAutoImport] failed: ${data.error ?? res.status}`);
    return;
  }

  if (data.reason) {
    logger.debug(`[DropshipAutoImport] ${data.reason}`);
    return;
  }

  logger.info(`[DropshipAutoImport] +${data.created ?? 0} added, ${data.duplicates ?? 0} duplicates, ${data.skippedNoRawg ?? 0} skipped (no RAWG match), ${data.failed ?? 0} failed`);
}
