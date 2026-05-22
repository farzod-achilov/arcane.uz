import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { keysService } from '../modules/keys/keys.service';
import { KeyStatus, KeyType } from '@prisma/client';

// ── Release expired reservations (every 2 minutes) ───────────────────────────

export async function releaseExpiredReservationsJob(): Promise<void> {
  const released = await keysService.releaseExpiredReservations();
  if (released > 0) {
    logger.info(`[CronJob] key-reservations: released ${released} expired`);
  }
}

// ── Low stock scan (every 30 minutes) ────────────────────────────────────────

export async function lowStockScanJob(): Promise<void> {
  const games = await prisma.game.findMany({
    where: { isActive: true },
    select: { id: true, title: true, stockStore: true, stockDrop: true, lowStockThreshold: true },
  });

  const warnings: string[] = [];
  const criticals: string[] = [];
  const empty: string[] = [];

  for (const game of games) {
    const total = game.stockStore + game.stockDrop;
    if (total === 0) empty.push(game.title);
    else if (total <= Math.floor(game.lowStockThreshold * 0.5)) criticals.push(game.title);
    else if (total <= game.lowStockThreshold) warnings.push(game.title);
  }

  if (empty.length > 0) {
    logger.error(`[LowStock] OUT OF STOCK: ${empty.join(', ')}`);
  }
  if (criticals.length > 0) {
    logger.warn(`[LowStock] CRITICAL (<50% threshold): ${criticals.join(', ')}`);
  }
  if (warnings.length > 0) {
    logger.warn(`[LowStock] LOW STOCK: ${warnings.join(', ')}`);
  }

  if (empty.length === 0 && criticals.length === 0 && warnings.length === 0) {
    logger.debug('[LowStock] All games have adequate stock');
  }
}

// ── Auto-disable games with zero keys ────────────────────────────────────────

export async function autoDisableEmptyGamesJob(): Promise<void> {
  const emptyGames = await prisma.game.findMany({
    where: {
      isActive: true,
      stockStore: 0,
      stockDrop: 0,
    },
    select: { id: true, title: true },
  });

  if (emptyGames.length === 0) return;

  await prisma.game.updateMany({
    where: { id: { in: emptyGames.map((g) => g.id) } },
    data: { isActive: false },
  });

  logger.warn(
    `[AutoDisable] Deactivated ${emptyGames.length} out-of-stock games: ` +
    emptyGames.map((g) => g.title).join(', ')
  );
}

// ── Warm key stock cache ──────────────────────────────────────────────────────

export async function warmKeyStockCacheJob(): Promise<void> {
  await keysService.warmStockCache();
}

// ── Daily key audit ───────────────────────────────────────────────────────────

export async function dailyKeyAuditJob(): Promise<void> {
  const [byStatus, sold24h, totalGames] = await Promise.all([
    prisma.gameKey.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.gameKey.count({
      where: {
        status: KeyStatus.SOLD,
        deliveredAt: { gte: new Date(Date.now() - 86_400_000) },
      },
    }),
    prisma.game.count({ where: { isActive: true } }),
  ]);

  const statusSummary = Object.fromEntries(byStatus.map((s) => [s.status, s._count.id]));

  logger.info('[DailyAudit] Key inventory summary', {
    ...statusSummary,
    deliveredLast24h: sold24h,
    activeGames: totalGames,
  });
}
