import { prisma } from '@/lib/prisma';
import { OrderError } from '@/lib/orders/types';
import { decryptKey } from '@/lib/keys/encryption';
import { auditLog } from './audit';
import { notifyOrderCompleted, notifyLowStock } from './notify';
import { createNotification } from '@/lib/notifications';
import type { DeliveryContext, AutoDeliveryResult } from './types';

interface KeyRow { id: string; encryptedKey: string; keyIv: string; keyTag: string }

export async function autoDeliver(ctx: DeliveryContext): Promise<AutoDeliveryResult> {
  await auditLog(ctx.orderId, 'AUTO_DELIVERY_START');

  const keys:    AutoDeliveryResult['keys'] = [];
  let   waiting = 0;

  await prisma.$transaction(async tx => {
    for (const item of ctx.items) {
      // Concurrent-safe key lock
      const [keyRow] = await tx.$queryRaw<KeyRow[]>`
        SELECT id, "encryptedKey", "keyIv", "keyTag" FROM game_keys
        WHERE "gameId" = ${item.gameId}
          AND status   = 'AVAILABLE'
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;

      if (!keyRow) {
        waiting++;
        await auditLog(ctx.orderId, 'AUTO_KEY_WAITING_STOCK', 'system', undefined, {
          gameId: item.gameId, gameTitle: item.gameTitle,
        });
        continue;
      }

      const keyValue = decryptKey(keyRow);

      // Mark key as SOLD
      await tx.game_keys.update({
        where: { id: keyRow.id },
        data:  { status: 'SOLD', soldToUserId: ctx.userId, deliveredAt: new Date(), updatedAt: new Date() },
      });

      // Write key to order item
      await tx.order_items.update({
        where: { id: item.id },
        data:  { keyValue, deliveredAt: new Date() },
      });

      // Decrement stock, increment sales counter
      const updated = await tx.games.update({
        where:  { id: item.gameId },
        data:   { stockStore: { decrement: 1 }, salesCount: { increment: 1 } },
        select: { stockStore: true, lowStockThreshold: true, title: true },
      });

      keys.push({ itemId: item.id, gameTitle: item.gameTitle, keyValue });

      await auditLog(ctx.orderId, 'AUTO_KEY_ISSUED', 'system', undefined, {
        itemId: item.id, gameId: item.gameId,
      });

      // Low stock warning (fire and forget)
      if (updated.stockStore <= updated.lowStockThreshold) {
        notifyLowStock(updated.title, updated.stockStore).catch(() => null);
      }
    }

    // Set order status
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

  // Notify admin
  if (keys.length > 0) {
    notifyOrderCompleted({
      orderId:   ctx.orderId,
      username:  ctx.username,
      email:     ctx.userEmail,
      gameTitle: ctx.items[0]?.gameTitle ?? '—',
      method:    'AUTO',
    }).catch(() => null);

    // Review nudge — only when order fully completed (no waiting items)
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
