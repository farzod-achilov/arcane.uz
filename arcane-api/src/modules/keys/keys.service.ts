import { KeyStatus, KeyType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { logger } from '../../lib/logger';
import { encryptKey, hashKey, normalizeSteamKey } from '../../utils/encryption';
import { AppError } from '../../middlewares/error.middleware';
import type { ImportKeysDto, AddKeyDto, MoveKeysDto, DisableKeysDto } from './keys.schema';

// ── Redis stock key helpers ───────────────────────────────────────────────────

export function stockRedisKey(gameId: string, type: 'STORE' | 'DROP' | 'BOTH'): string {
  return `stock:${gameId}:${type}`;
}

async function syncStockToRedis(gameId: string): Promise<void> {
  const counts = await prisma.gameKey.groupBy({
    by: ['type'],
    where: { gameId, status: KeyStatus.AVAILABLE },
    _count: { id: true },
  });

  const map: Record<string, number> = { STORE: 0, DROP: 0, BOTH: 0 };
  for (const c of counts) map[c.type] = c._count.id;

  await Promise.all([
    redis.set(stockRedisKey(gameId, 'STORE'), map.STORE, 'EX', 3600),
    redis.set(stockRedisKey(gameId, 'DROP'), map.DROP, 'EX', 3600),
    redis.set(stockRedisKey(gameId, 'BOTH'), map.BOTH, 'EX', 3600),
  ]);
}

// Total available for a delivery type: type=STORE means STORE + BOTH keys
async function getAvailableCount(gameId: string, type: 'STORE' | 'DROP'): Promise<number> {
  const [specific, both] = await Promise.all([
    redis.get(stockRedisKey(gameId, type)),
    redis.get(stockRedisKey(gameId, 'BOTH')),
  ]);
  return (parseInt(specific ?? '0', 10) + parseInt(both ?? '0', 10));
}

// ── Low stock alert ───────────────────────────────────────────────────────────

async function checkAndAlertLowStock(gameId: string): Promise<void> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { title: true, lowStockThreshold: true, stockStore: true, stockDrop: true },
  });
  if (!game) return;

  const total = game.stockStore + game.stockDrop;
  if (total <= game.lowStockThreshold && total > 0) {
    logger.warn(`[LowStock] "${game.title}" has only ${total} keys left`);
    // Emit to admin Socket.io room if needed
  }

  // Auto-disable game when completely out of stock
  if (total === 0) {
    await prisma.game.update({ where: { id: gameId }, data: { isActive: false } });
    logger.warn(`[OutOfStock] "${game.title}" auto-disabled — no keys remaining`);
  }
}

// ── Recalculate & persist stock counters ─────────────────────────────────────

async function recalcStock(gameId: string): Promise<{ store: number; drop: number }> {
  const [storeCount, dropCount] = await Promise.all([
    prisma.gameKey.count({
      where: {
        gameId,
        status: KeyStatus.AVAILABLE,
        type: { in: [KeyType.STORE, KeyType.BOTH] },
      },
    }),
    prisma.gameKey.count({
      where: {
        gameId,
        status: KeyStatus.AVAILABLE,
        type: { in: [KeyType.DROP, KeyType.BOTH] },
      },
    }),
  ]);

  await prisma.game.update({
    where: { id: gameId },
    data: { stockStore: storeCount, stockDrop: dropCount },
  });

  await syncStockToRedis(gameId);
  return { store: storeCount, drop: dropCount };
}

// ── Import keys ───────────────────────────────────────────────────────────────

export interface ImportResult {
  imported: number;
  duplicates: number;
  invalid: number;
  total: number;
}

class KeysService {
  async importKeys(dto: ImportKeysDto, adminId: string): Promise<ImportResult> {
    const result: ImportResult = { imported: 0, duplicates: 0, invalid: 0, total: dto.keys.length };

    const game = await prisma.game.findUnique({ where: { id: dto.gameId } });
    if (!game) throw new AppError('Game not found', 404);

    // Pre-check existing hashes in one query
    const incomingHashes = dto.keys.map((k) => hashKey(normalizeSteamKey(k)));
    const existing = await prisma.gameKey.findMany({
      where: { keyHash: { in: incomingHashes } },
      select: { keyHash: true },
    });
    const existingHashSet = new Set(existing.map((e) => e.keyHash));

    // Deduplicate within batch
    const seenInBatch = new Set<string>();
    const toInsert: Array<{
      gameId: string; encryptedKey: string; keyIv: string;
      keyTag: string; keyHash: string; type: KeyType; status: KeyStatus;
    }> = [];

    for (const rawKey of dto.keys) {
      const normalized = normalizeSteamKey(rawKey);
      const hash = hashKey(normalized);

      if (existingHashSet.has(hash) || seenInBatch.has(hash)) {
        result.duplicates++;
        continue;
      }

      seenInBatch.add(hash);
      const encrypted = encryptKey(normalized);

      toInsert.push({
        gameId: dto.gameId,
        encryptedKey: encrypted.encryptedKey,
        keyIv: encrypted.keyIv,
        keyTag: encrypted.keyTag,
        keyHash: hash,
        type: dto.type as KeyType,
        status: KeyStatus.AVAILABLE,
      });
    }

    if (toInsert.length === 0) {
      return result;
    }

    // Bulk insert in batches of 100
    const BATCH = 100;
    for (let i = 0; i < toInsert.length; i += BATCH) {
      const chunk = toInsert.slice(i, i + BATCH);
      await prisma.gameKey.createMany({ data: chunk, skipDuplicates: true });
    }

    result.imported = toInsert.length;

    // Log one transaction record per import batch
    const insertedKeys = await prisma.gameKey.findMany({
      where: { keyHash: { in: toInsert.map((k) => k.keyHash) } },
      select: { id: true },
      take: toInsert.length,
    });

    await prisma.keyTransaction.createMany({
      data: insertedKeys.map((k) => ({
        keyId: k.id,
        adminId,
        type: 'BULK_IMPORT' as const,
        note: `Bulk import of ${result.imported} keys`,
        metadata: { batchSize: result.imported, type: dto.type },
      })),
    });

    await recalcStock(dto.gameId);
    logger.info(`[KeyImport] ${result.imported} keys imported for game ${dto.gameId}`);

    return result;
  }

  async addSingleKey(dto: AddKeyDto, adminId: string) {
    const game = await prisma.game.findUnique({ where: { id: dto.gameId } });
    if (!game) throw new AppError('Game not found', 404);

    const normalized = normalizeSteamKey(dto.key);
    const hash = hashKey(normalized);

    const exists = await prisma.gameKey.findUnique({ where: { keyHash: hash } });
    if (exists) throw new AppError('This key already exists in the system', 409);

    const encrypted = encryptKey(normalized);
    const key = await prisma.gameKey.create({
      data: {
        gameId: dto.gameId,
        encryptedKey: encrypted.encryptedKey,
        keyIv: encrypted.keyIv,
        keyTag: encrypted.keyTag,
        keyHash: hash,
        type: dto.type as KeyType,
        status: KeyStatus.AVAILABLE,
      },
    });

    await prisma.keyTransaction.create({
      data: { keyId: key.id, adminId, type: 'IMPORT', note: 'Single key added by admin' },
    });

    await recalcStock(dto.gameId);
    return { id: key.id, gameId: key.gameId, type: key.type, status: key.status };
  }

  async moveKeys(dto: MoveKeysDto, adminId: string) {
    const keys = await prisma.gameKey.findMany({
      where: {
        gameId: dto.gameId,
        type: dto.fromType as KeyType,
        status: KeyStatus.AVAILABLE,
      },
      take: dto.count,
      select: { id: true },
    });

    if (keys.length === 0) {
      throw new AppError(`No AVAILABLE ${dto.fromType} keys found for this game`, 404);
    }

    const ids = keys.map((k) => k.id);

    await prisma.$transaction([
      prisma.gameKey.updateMany({
        where: { id: { in: ids } },
        data: { type: dto.toType as KeyType },
      }),
      prisma.keyTransaction.createMany({
        data: ids.map((keyId) => ({
          keyId,
          adminId,
          type: 'MOVE' as const,
          note: `Moved from ${dto.fromType} → ${dto.toType}`,
          metadata: { fromType: dto.fromType, toType: dto.toType },
        })),
      }),
    ]);

    await recalcStock(dto.gameId);
    return { moved: keys.length, fromType: dto.fromType, toType: dto.toType };
  }

  async disableKeys(dto: DisableKeysDto, adminId: string) {
    const keys = await prisma.gameKey.findMany({
      where: { id: { in: dto.keyIds }, status: { not: KeyStatus.SOLD } },
      select: { id: true, gameId: true },
    });

    if (keys.length === 0) throw new AppError('No eligible keys found', 404);

    const gameIds = [...new Set(keys.map((k) => k.gameId))];
    const ids = keys.map((k) => k.id);

    await prisma.$transaction([
      prisma.gameKey.updateMany({
        where: { id: { in: ids } },
        data: { status: KeyStatus.DISABLED },
      }),
      prisma.keyTransaction.createMany({
        data: ids.map((keyId) => ({
          keyId,
          adminId,
          type: 'DISABLE' as const,
          note: dto.reason ?? 'Disabled by admin',
        })),
      }),
    ]);

    await Promise.all(gameIds.map((gid) => recalcStock(gid)));
    return { disabled: keys.length };
  }

  async getStats(gameId?: string) {
    const where = gameId ? { gameId } : {};

    const [byStatus, byType, recentTransactions, games] = await Promise.all([
      prisma.gameKey.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.gameKey.groupBy({
        by: ['type'],
        where: { ...where, status: KeyStatus.AVAILABLE },
        _count: { id: true },
      }),
      prisma.keyTransaction.findMany({
        where: gameId ? { key: { gameId } } : {},
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { key: { select: { gameId: true } } },
      }),
      gameId
        ? prisma.game.findMany({
            where: { id: gameId },
            select: { id: true, title: true, stockStore: true, stockDrop: true, lowStockThreshold: true, isActive: true },
          })
        : prisma.game.findMany({
            where: { OR: [{ stockStore: { gt: 0 } }, { stockDrop: { gt: 0 } }] },
            select: { id: true, title: true, stockStore: true, stockDrop: true, lowStockThreshold: true, isActive: true },
            orderBy: { title: 'asc' },
          }),
    ]);

    const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count.id]));
    const typeMap = Object.fromEntries(byType.map((t) => [t.type, t._count.id]));

    const lowStockGames = games.filter(
      (g) => g.stockStore + g.stockDrop <= g.lowStockThreshold
    );

    return {
      total: Object.values(statusMap).reduce((a, b) => a + b, 0),
      byStatus: statusMap,
      availableByType: typeMap,
      lowStockGames,
      recentTransactions,
      games,
    };
  }

  async listKeys(
    gameId: string,
    status?: KeyStatus,
    page = 1,
    limit = 50
  ) {
    const where: Record<string, unknown> = { gameId };
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [total, keys] = await Promise.all([
      prisma.gameKey.count({ where }),
      prisma.gameKey.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        // Never select encryptedKey/keyIv/keyTag in listings
        select: {
          id: true, gameId: true, status: true, type: true,
          reservedFor: true, reservedAt: true, reserveExpiry: true,
          soldToUserId: true, deliveredAt: true, createdAt: true,
        },
      }),
    ]);

    return { data: keys, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  // Release expired reservations (called by cron)
  async releaseExpiredReservations(): Promise<number> {
    const expired = await prisma.gameKey.findMany({
      where: {
        status: KeyStatus.RESERVED,
        reserveExpiry: { lt: new Date() },
      },
      select: { id: true, gameId: true },
    });

    if (expired.length === 0) return 0;

    const ids = expired.map((k) => k.id);
    const gameIds = [...new Set(expired.map((k) => k.gameId))];

    await prisma.gameKey.updateMany({
      where: { id: { in: ids } },
      data: {
        status: KeyStatus.AVAILABLE,
        reservedFor: null,
        reservedAt: null,
        reserveExpiry: null,
      },
    });

    await Promise.all(gameIds.map((gid) => recalcStock(gid)));
    logger.info(`[KeyService] Released ${expired.length} expired reservations`);
    return expired.length;
  }

  // Sync all stock counters to Redis (used on startup)
  async warmStockCache(): Promise<void> {
    const games = await prisma.game.findMany({ select: { id: true } });
    await Promise.all(games.map((g) => syncStockToRedis(g.id)));
    logger.info(`[KeyService] Stock cache warmed for ${games.length} games`);
  }
}

export const keysService = new KeysService();
export { recalcStock, checkAndAlertLowStock, getAvailableCount };
