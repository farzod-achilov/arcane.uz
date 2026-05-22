import { prisma } from '../../lib/prisma';
import { cacheGet, cacheSet } from '../../lib/redis';
import { KeyStatus, KeyType } from '@prisma/client';

export interface InventorySnapshot {
  gameId: string;
  title: string;
  cover: string | null;
  available: { store: number; drop: number; both: number; total: number };
  sold: number;
  disabled: number;
  stockHealth: 'OK' | 'LOW' | 'CRITICAL' | 'EMPTY';
  lowStockThreshold: number;
  isActive: boolean;
}

export interface KeyAnalytics {
  snapshot: InventorySnapshot[];
  totals: {
    available: number;
    sold: number;
    disabled: number;
    reserved: number;
  };
  deliveryStats: {
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };
  topGamesBySales: Array<{ gameId: string; title: string; sold: number }>;
}

async function getDeliveryCount(sinceMs: number): Promise<number> {
  return prisma.gameKey.count({
    where: {
      status: KeyStatus.SOLD,
      deliveredAt: { gte: new Date(Date.now() - sinceMs) },
    },
  });
}

export async function getKeyAnalytics(): Promise<KeyAnalytics> {
  const cacheKey = 'analytics:keys';
  const cached = await cacheGet<KeyAnalytics>(cacheKey);
  if (cached) return cached;

  const [games, allKeys, deliveryDay, deliveryWeek, deliveryMonth] = await Promise.all([
    prisma.game.findMany({
      select: {
        id: true, title: true, cover: true,
        stockStore: true, stockDrop: true,
        lowStockThreshold: true, isActive: true,
      },
    }),
    prisma.gameKey.groupBy({
      by: ['gameId', 'type', 'status'],
      _count: { id: true },
    }),
    getDeliveryCount(86_400_000),         // 24h
    getDeliveryCount(7 * 86_400_000),     // 7d
    getDeliveryCount(30 * 86_400_000),    // 30d
  ]);

  // Build per-game maps
  type KeyMap = Record<string, Record<string, Record<string, number>>>;
  const keyMap: KeyMap = {};
  for (const row of allKeys) {
    if (!keyMap[row.gameId]) keyMap[row.gameId] = {};
    if (!keyMap[row.gameId][row.type]) keyMap[row.gameId][row.type] = {};
    keyMap[row.gameId][row.type][row.status] = row._count.id;
  }

  function getCount(gameId: string, type: string, status: string): number {
    return keyMap[gameId]?.[type]?.[status] ?? 0;
  }

  const snapshot: InventorySnapshot[] = games.map((g) => {
    const availStore = getCount(g.id, KeyType.STORE, KeyStatus.AVAILABLE);
    const availDrop = getCount(g.id, KeyType.DROP, KeyStatus.AVAILABLE);
    const availBoth = getCount(g.id, KeyType.BOTH, KeyStatus.AVAILABLE);
    const totalAvail = availStore + availDrop + availBoth;

    const threshold = g.lowStockThreshold;
    let stockHealth: InventorySnapshot['stockHealth'] = 'OK';
    if (totalAvail === 0) stockHealth = 'EMPTY';
    else if (totalAvail <= Math.floor(threshold * 0.5)) stockHealth = 'CRITICAL';
    else if (totalAvail <= threshold) stockHealth = 'LOW';

    return {
      gameId: g.id,
      title: g.title,
      cover: g.cover,
      available: {
        store: availStore,
        drop: availDrop,
        both: availBoth,
        total: totalAvail,
      },
      sold: (
        getCount(g.id, KeyType.STORE, KeyStatus.SOLD) +
        getCount(g.id, KeyType.DROP, KeyStatus.SOLD) +
        getCount(g.id, KeyType.BOTH, KeyStatus.SOLD)
      ),
      disabled: (
        getCount(g.id, KeyType.STORE, KeyStatus.DISABLED) +
        getCount(g.id, KeyType.DROP, KeyStatus.DISABLED) +
        getCount(g.id, KeyType.BOTH, KeyStatus.DISABLED)
      ),
      stockHealth,
      lowStockThreshold: threshold,
      isActive: g.isActive,
    };
  });

  // Global totals
  const totals = {
    available: allKeys.filter((k) => k.status === KeyStatus.AVAILABLE).reduce((s, k) => s + k._count.id, 0),
    sold:      allKeys.filter((k) => k.status === KeyStatus.SOLD).reduce((s, k) => s + k._count.id, 0),
    disabled:  allKeys.filter((k) => k.status === KeyStatus.DISABLED).reduce((s, k) => s + k._count.id, 0),
    reserved:  allKeys.filter((k) => k.status === KeyStatus.RESERVED).reduce((s, k) => s + k._count.id, 0),
  };

  // Top games by total sold
  const topGamesBySales = snapshot
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 10)
    .map((s) => ({ gameId: s.gameId, title: s.title, sold: s.sold }));

  const result: KeyAnalytics = {
    snapshot,
    totals,
    deliveryStats: { lastDay: deliveryDay, lastWeek: deliveryWeek, lastMonth: deliveryMonth },
    topGamesBySales,
  };

  await cacheSet(cacheKey, result, 120); // 2 min cache
  return result;
}
