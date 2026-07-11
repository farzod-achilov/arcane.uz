import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { decryptKey } from '@/lib/keys/encryption';
import { auditLog } from './audit';
import { notifyOrderCompleted, notifyLowStock } from './notify';
import { createNotification } from '@/lib/notifications';
import type { DeliveryContext, AutoDeliveryResult } from './types';

interface KeyRow { id: string; encryptedKey: string; keyIv: string; keyTag: string }

export type DeliverAutoItemResult =
  | { status: 'delivered'; keyValue: string }
  | { status: 'waiting' };

/**
 * Pulls one AVAILABLE key for a single item, marks it SOLD, writes it to
 * the order item, decrements stock. Extracted so lib/delivery/dropshipDeliver.ts
 * can reuse the exact same locking/decrypt/mark-SOLD logic for the AUTO
 * items that share a cart with DROPSHIP items — not duplicated there.
 */
export async function deliverAutoItem(
  tx: Prisma.TransactionClient,
  ctx: DeliveryContext,
  item: DeliveryContext['items'][number],
): Promise<DeliverAutoItemResult> {
  const [keyRow] = await tx.$queryRaw<KeyRow[]>`
    SELECT id, "encryptedKey", "keyIv", "keyTag" FROM game_keys
    WHERE "gameId" = ${item.gameId}
      AND status   = 'AVAILABLE'
    ORDER BY "createdAt" ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  `;

  if (!keyRow) {
    await auditLog(ctx.orderId, 'AUTO_KEY_WAITING_STOCK', 'system', undefined, {
      gameId: item.gameId, gameTitle: item.gameTitle,
    });
    return { status: 'waiting' };
  }

  const keyValue = decryptKey(keyRow);

  await tx.game_keys.update({
    where: { id: keyRow.id },
    data:  { status: 'SOLD', soldToUserId: ctx.userId, deliveredAt: new Date(), updatedAt: new Date() },
  });

  await tx.order_items.update({
    where: { id: item.id },
    data:  { keyValue, deliveredAt: new Date() },
  });

  const updated = await tx.games.update({
    where:  { id: item.gameId },
    data:   { stockStore: { decrement: 1 }, salesCount: { increment: 1 } },
    select: { stockStore: true, lowStockThreshold: true, title: true },
  });

  await auditLog(ctx.orderId, 'AUTO_KEY_ISSUED', 'system', undefined, {
    itemId: item.id, gameId: item.gameId,
  });

  if (updated.stockStore <= updated.lowStockThreshold) {
    notifyLowStock(updated.title, updated.stockStore).catch(() => null);
  }

  return { status: 'delivered', keyValue };
}

export async function autoDeliver(ctx: DeliveryContext): Promise<AutoDeliveryResult> {
  await auditLog(ctx.orderId, 'AUTO_DELIVERY_START');

  const keys:    AutoDeliveryResult['keys'] = [];
  let   waiting = 0;

  await prisma.$transaction(async tx => {
    for (const item of ctx.items) {
      const result = await deliverAutoItem(tx, ctx, item);
      if (result.status === 'waiting') {
        waiting++;
        continue;
      }
      keys.push({ itemId: item.id, gameTitle: item.gameTitle, keyValue: result.keyValue });
    }

    const newStatus = waiting === 0 ? 'COMPLETED' : 'WAITING_MANUAL';
    await tx.orders.update({
      where: { id: ctx.orderId },
      data:  {
        status:      newStatus,
        deliveredAt: waiting === 0 ? new Date() : null,
        deliveredBy: waiting === 0 ? 'system' : null,
      },
    });
  }, { timeout: 15_000 });

  await auditLog(ctx.orderId, 'AUTO_DELIVERY_COMPLETE', 'system', undefined, {
    delivered: keys.length, waiting,
  });

  if (keys.length > 0) {
    notifyOrderCompleted({
      orderId:   ctx.orderId,
      username:  ctx.username,
      email:     ctx.userEmail,
      gameTitle: ctx.items[0]?.gameTitle ?? '—',
      method:    'AUTO',
    }).catch(() => null);

    if (waiting === 0) {
      const firstItem = ctx.items[0];
      if (firstItem) {
        createNotification(ctx.userId, {
          type:  'review',
          title: keys.length === 1
            ? `Как вам «${firstItem.gameTitle}»?`
            : `Оцените купленные игры`,
          body:  'Оставьте отзыв — помогите другим покупателям',
          href:  `/product/${firstItem.gameId}#reviews`,
        }).catch(() => null);
      }
    }
  }

  return { type: 'AUTO', delivered: keys.length, waiting, keys };
}
