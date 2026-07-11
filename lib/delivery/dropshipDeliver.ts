import { prisma } from '@/lib/prisma';
import { auditLog } from './audit';
import { deliverAutoItem } from './autoDeliver';
import { notifyOrderCompleted } from './notify';
import { createNotification } from '@/lib/notifications';
import type { DeliveryContext, DropshipDeliveryResult } from './types';

/* ─────────────────────────────────────────────────────────
   Dropship delivery — buys the key from an external supplier at
   order time instead of pulling from pre-stocked game_keys.

   Handles a MIXED cart (some items DROPSHIP, some AUTO) since a
   customer's order isn't guaranteed to be single-supplier. AUTO
   items reuse the exact same lock/decrypt/mark-SOLD logic as
   lib/delivery/autoDeliver.ts via the shared deliverAutoItem()
   helper — not duplicated here.

   The external supplier call happens OUTSIDE any DB transaction:
   holding Postgres row locks open across an HTTP round-trip to
   Kinguin/Eneba/etc. (which can itself take several seconds) would
   risk lock contention and blow past autoDeliver's existing 15s
   transaction timeout. Instead: purchase first, then a short
   transaction writes the results.

   Any purchase failure (supplier not configured, network error,
   out of stock, UnverifiedSupplierError for G2A/Gamivo) counts the
   item as "waiting" — identical to autoDeliver's existing behavior
   when game_keys has no AVAILABLE row. No game_keys row is ever
   created for a dropship purchase; the key goes straight into
   order_items.keyValue.
───────────────────────────────────────────────────────── */

type SupplierPurchase = (externalId: string) => Promise<{ ok: boolean; key?: string; error?: string }>;

async function getSupplierPurchaseFn(source: string | null): Promise<SupplierPurchase | null> {
  switch (source) {
    case 'kinguin': return (await import('@/lib/kinguin')).purchaseKey;
    case 'eneba':   return (await import('@/lib/eneba')).purchaseKey;
    case 'g2a':     return (await import('@/lib/g2a')).purchaseKey;
    case 'gamivo':  return (await import('@/lib/gamivo')).purchaseKey;
    default:        return null;
  }
}

interface DropshipPurchase {
  itemId: string;
  gameTitle: string;
  keyValue: string;
}

export async function dropshipDeliver(ctx: DeliveryContext): Promise<DropshipDeliveryResult> {
  await auditLog(ctx.orderId, 'DROPSHIP_DELIVERY_START');

  const dropshipItems = ctx.items.filter(i => i.deliveryType === 'DROPSHIP');
  const otherItems     = ctx.items.filter(i => i.deliveryType !== 'DROPSHIP');

  // ── Phase 1: purchase from suppliers, outside any transaction ──────────
  const purchased: DropshipPurchase[] = [];
  let dropshipWaiting = 0;

  for (const item of dropshipItems) {
    const purchaseFn = await getSupplierPurchaseFn(item.source);

    if (!purchaseFn || !item.externalId) {
      dropshipWaiting++;
      await auditLog(ctx.orderId, 'DROPSHIP_PURCHASE_FAILED', 'system', undefined, {
        itemId: item.id, gameId: item.gameId, reason: 'no supplier/externalId on game',
      });
      continue;
    }

    try {
      const result = await purchaseFn(item.externalId);
      if (!result.ok || !result.key) {
        dropshipWaiting++;
        await auditLog(ctx.orderId, 'DROPSHIP_PURCHASE_FAILED', 'system', undefined, {
          itemId: item.id, gameId: item.gameId, source: item.source, reason: result.error ?? 'no key returned',
        });
        continue;
      }
      purchased.push({ itemId: item.id, gameTitle: item.gameTitle, keyValue: result.key });
    } catch (err) {
      dropshipWaiting++;
      await auditLog(ctx.orderId, 'DROPSHIP_PURCHASE_FAILED', 'system', undefined, {
        itemId: item.id, gameId: item.gameId, source: item.source,
        reason: err instanceof Error ? err.message : 'unknown error',
      });
    }
  }

  // ── Phase 2: short transaction — write results + handle AUTO items ─────
  const keys: DropshipDeliveryResult['keys'] = [];
  let waiting = dropshipWaiting;

  await prisma.$transaction(async tx => {
    for (const p of purchased) {
      await tx.order_items.update({
        where: { id: p.itemId },
        data:  { keyValue: p.keyValue, deliveredAt: new Date() },
      });
      const item = dropshipItems.find(i => i.id === p.itemId);
      if (item) {
        await tx.games.update({
          where: { id: item.gameId },
          data:  { salesCount: { increment: 1 } },
        });
      }
      keys.push({ itemId: p.itemId, gameTitle: p.gameTitle, keyValue: p.keyValue });
    }

    for (const item of otherItems) {
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

  await auditLog(ctx.orderId, 'DROPSHIP_DELIVERY_COMPLETE', 'system', undefined, {
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

  return { type: 'DROPSHIP', delivered: keys.length, waiting, keys };
}
