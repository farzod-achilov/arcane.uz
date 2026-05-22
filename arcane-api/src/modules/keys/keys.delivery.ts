import { KeyStatus, KeyType, KeyTransactionType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { logger } from '../../lib/logger';
import { decryptKey } from '../../utils/encryption';
import { AppError } from '../../middlewares/error.middleware';
import { recalcStock, checkAndAlertLowStock } from './keys.service';

// ── Delivery result ───────────────────────────────────────────────────────────

export interface DeliveryResult {
  keyId: string;
  gameId: string;
  gameTitle: string;
  plaintextKey: string;       // returned ONCE — never stored again in plaintext
  deliveredAt: Date;
}

// ── Redis distributed lock ────────────────────────────────────────────────────
//
//   Prevents two simultaneous requests from grabbing the same key.
//   Lock TTL is short (10s) — enough for the DB transaction.

const LOCK_TTL_MS = 10_000;

async function acquireLock(lockKey: string): Promise<boolean> {
  const result = await redis.set(lockKey, '1', 'PX', LOCK_TTL_MS, 'NX');
  return result === 'OK';
}

async function releaseLock(lockKey: string): Promise<void> {
  await redis.del(lockKey);
}

// ── Core delivery engine ──────────────────────────────────────────────────────
//
//   Flow:
//   1. Acquire Redis lock for game + delivery type
//   2. Find one AVAILABLE key (SELECT … FOR UPDATE via raw SQL)
//   3. Mark SOLD in the same transaction
//   4. Log KeyTransaction
//   5. Recalc stock + alert
//   6. Decrypt and return plaintext — one time only
//
//   The lock ensures only one coroutine processes a key at a time.
//   The SELECT FOR UPDATE ensures DB-level atomicity.

async function deliverKey(
  gameId: string,
  userId: string,
  deliveryType: 'STORE' | 'DROP',
  txType: KeyTransactionType,
  txNote: string,
  txMeta?: object
): Promise<DeliveryResult> {
  const lockKey = `lock:key_delivery:${gameId}:${deliveryType}`;
  const acquired = await acquireLock(lockKey);

  if (!acquired) {
    // Another request is in progress for this game — brief retry
    await new Promise((r) => setTimeout(r, 200));
    const retry = await acquireLock(lockKey);
    if (!retry) throw new AppError('Key delivery temporarily busy, please retry', 503);
  }

  try {
    // Types that satisfy this delivery: exact type OR BOTH
    const eligibleTypes: KeyType[] =
      deliveryType === 'STORE'
        ? [KeyType.STORE, KeyType.BOTH]
        : [KeyType.DROP, KeyType.BOTH];

    // SELECT … SKIP LOCKED prevents deadlocks under high concurrency
    const [candidate] = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM game_keys
      WHERE game_id   = ${gameId}
        AND status    = 'AVAILABLE'
        AND type      = ANY(${eligibleTypes}::text[])
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    if (!candidate) {
      throw new AppError(`No keys available for this game (${deliveryType})`, 409);
    }

    // Atomically mark as SOLD in the same DB transaction
    const key = await prisma.$transaction(async (tx) => {
      const updated = await tx.gameKey.update({
        where: { id: candidate.id },
        data: {
          status: KeyStatus.SOLD,
          soldToUserId: userId,
          deliveredAt: new Date(),
          usedAt: new Date(),
          // Clear any stale reservation data
          reservedFor: null,
          reservedAt: null,
          reserveExpiry: null,
        },
        select: {
          id: true,
          gameId: true,
          encryptedKey: true,
          keyIv: true,
          keyTag: true,
          game: { select: { title: true } },
        },
      });

      await tx.keyTransaction.create({
        data: {
          keyId: updated.id,
          userId,
          type: txType,
          note: txNote,
          metadata: txMeta ?? {},
        },
      });

      return updated;
    });

    // Decrypt in-memory — never written to DB
    const plaintextKey = decryptKey({
      encryptedKey: key.encryptedKey,
      keyIv: key.keyIv,
      keyTag: key.keyTag,
    });

    // Update stock (non-blocking)
    recalcStock(gameId)
      .then(() => checkAndAlertLowStock(gameId))
      .catch((err) => logger.error('[Delivery] Stock recalc failed', err));

    logger.info(`[KeyDelivery] Key ${key.id} delivered to user ${userId} (${txType})`);

    return {
      keyId: key.id,
      gameId: key.gameId,
      gameTitle: key.game.title,
      plaintextKey,
      deliveredAt: key.deliveredAt!,
    };
  } finally {
    await releaseLock(lockKey);
  }
}

// ── Public delivery functions ─────────────────────────────────────────────────

/**
 * Called when a user purchases a game from the store.
 * Coins are deducted BEFORE calling this — pass orderId for audit.
 */
export async function deliverStoreKey(
  gameId: string,
  userId: string,
  orderId: string
): Promise<DeliveryResult> {
  return deliverKey(
    gameId,
    userId,
    'STORE',
    KeyTransactionType.PURCHASE,
    'Store purchase delivery',
    { orderId }
  );
}

/**
 * Called when a drop reward resolves to a GAME type.
 * Pass inventoryId for the inventory record link.
 */
export async function deliverDropKey(
  gameId: string,
  userId: string,
  inventoryId: string
): Promise<DeliveryResult> {
  return deliverKey(
    gameId,
    userId,
    'DROP',
    KeyTransactionType.DROP_REWARD,
    'Drop reward delivery',
    { inventoryId }
  );
}

/**
 * Admin manual assign — bypasses stock type restriction.
 */
export async function deliverManualKey(
  gameId: string,
  userId: string,
  adminId: string,
  reason: string
): Promise<DeliveryResult> {
  return deliverKey(
    gameId,
    userId,
    'STORE',
    KeyTransactionType.MANUAL_ASSIGN,
    reason,
    { adminId }
  );
}

// ── Stock check helper ────────────────────────────────────────────────────────

export async function hasStockFor(
  gameId: string,
  type: 'STORE' | 'DROP'
): Promise<boolean> {
  const eligibleTypes: KeyType[] =
    type === 'STORE' ? [KeyType.STORE, KeyType.BOTH] : [KeyType.DROP, KeyType.BOTH];

  const count = await prisma.gameKey.count({
    where: {
      gameId,
      status: KeyStatus.AVAILABLE,
      type: { in: eligibleTypes },
    },
  });
  return count > 0;
}
