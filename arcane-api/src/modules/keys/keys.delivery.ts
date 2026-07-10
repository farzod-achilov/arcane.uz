import { KeyStatus, KeyType, KeyTransactionType, InventoryStatus, Prisma } from '@prisma/client';
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
//   2. Run the caller's preflight check (order/inventory ownership) — still
//      inside the lock, so it can't race against a second delivery for the
//      same game+deliveryType
//   3. Find one AVAILABLE key (SELECT … FOR UPDATE via raw SQL)
//   4. Mark SOLD in the same transaction, plus whatever the preflight wants
//      written (e.g. inventory → CLAIMED, order_items.key_value) — atomic
//      with the key handoff so a crash can't deliver a key without
//      consuming the thing that authorized it
//   5. Log KeyTransaction
//   6. Recalc stock + alert
//   7. Decrypt and return plaintext — one time only
//
//   The lock ensures only one coroutine processes a key at a time.
//   The SELECT FOR UPDATE ensures DB-level atomicity.

interface PreflightResult {
  /** Extra writes to run inside the same transaction as the key handoff (e.g. mark inventory claimed). */
  onDeliver?: (tx: Prisma.TransactionClient) => Promise<void>;
  /** Extra metadata to attach to the KeyTransaction row. */
  txMeta?: object;
}

async function deliverKey(
  gameId: string,
  userId: string,
  deliveryType: 'STORE' | 'DROP',
  txType: KeyTransactionType,
  txNote: string,
  preflight: () => Promise<PreflightResult>,
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
    // Verify the caller is actually entitled to a key BEFORE touching stock.
    // Runs inside the lock so a concurrent request for the same game can't
    // slip through with the same order/inventory reference.
    const { onDeliver, txMeta } = await preflight();

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

    // Atomically mark as SOLD in the same DB transaction as the caller's
    // own bookkeeping (inventory claim / order_items key_value write)
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
          deliveredAt: true,
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

      if (onDeliver) await onDeliver(tx);

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
 *
 * arcane-api has no `orders` Prisma model of its own (orders live in the
 * shared DB, modeled only by the main Next.js app's schema), so ownership
 * is verified with a raw SQL check against the physical `orders`/
 * `order_items` tables: the order must belong to this user, be paid, contain
 * this game, and not already have a key recorded for it — that last check
 * is also what stops the same orderId being replayed for extra keys.
 */
export async function deliverStoreKey(
  gameId: string,
  userId: string,
  orderId: string
): Promise<DeliveryResult> {
  return deliverKey(gameId, userId, 'STORE', KeyTransactionType.PURCHASE, 'Store purchase delivery', async () => {
    // Real replay/race protection is the per-(gameId, STORE) Redis lock this
    // preflight runs inside — a second call for the same order+game blocks
    // until the first one commits, then sees key_value is no longer NULL.
    const [item] = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT oi.id FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.order_id  = ${orderId}
        AND oi.game_id   = ${gameId}
        AND o.user_id    = ${userId}
        AND o.status IN ('PAID', 'WAITING_MANUAL', 'COMPLETED')
        AND oi.key_value IS NULL
      LIMIT 1
    `;

    if (!item) {
      throw new AppError('No paid, undelivered order item found for this game/order', 403);
    }

    return {
      txMeta: { orderId },
      onDeliver: async (tx) => {
        // Mirror the key back onto order_items so the main app's own order
        // view stays consistent, and so a replayed orderId sees key_value
        // is no longer NULL and gets rejected above.
        await tx.$executeRaw`
          UPDATE order_items
          SET key_value = 'delivered-via-arcane-api', delivered_at = NOW()
          WHERE id = ${item.id}
        `;
      },
    };
  });
}

/**
 * Called when a drop reward resolves to a GAME type.
 * Verifies the inventory row exists, belongs to this user, is still
 * PENDING (not already claimed/sold), and its reward actually points at
 * this gameId — then marks it CLAIMED atomically with the key handoff.
 */
export async function deliverDropKey(
  gameId: string,
  userId: string,
  inventoryId: string
): Promise<DeliveryResult> {
  return deliverKey(gameId, userId, 'DROP', KeyTransactionType.DROP_REWARD, 'Drop reward delivery', async () => {
    const item = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: { id: true, userId: true, status: true, reward: { select: { gameId: true } } },
    });

    if (!item || item.userId !== userId) {
      throw new AppError('Inventory item not found', 404);
    }
    if (item.status !== InventoryStatus.PENDING) {
      throw new AppError('Inventory item already claimed', 409);
    }
    if (item.reward.gameId !== gameId) {
      throw new AppError('Inventory item does not match this game', 400);
    }

    return {
      txMeta: { inventoryId },
      onDeliver: async (tx) => {
        // Guarded update: fails the whole transaction if another request
        // already flipped this row out of PENDING between the check above
        // and here (belt-and-suspenders alongside the per-game Redis lock).
        const { count } = await tx.inventory.updateMany({
          where: { id: inventoryId, status: InventoryStatus.PENDING },
          data: { status: InventoryStatus.CLAIMED, claimedAt: new Date() },
        });
        if (count === 0) throw new AppError('Inventory item already claimed', 409);
      },
    };
  });
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
  return deliverKey(gameId, userId, 'STORE', KeyTransactionType.MANUAL_ASSIGN, reason, async () => ({
    txMeta: { adminId },
  }));
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
