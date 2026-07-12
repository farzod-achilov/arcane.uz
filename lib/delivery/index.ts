import { prisma } from '@/lib/prisma';
import { auditLog } from './audit';
import { autoDeliver } from './autoDeliver';
import { dropshipDeliver } from './dropshipDeliver';
import { queueManual } from './manualDeliver';
import { DeliveryError } from './types';
import type { DeliveryContext, DeliveryResult } from './types';

/* ── Main dispatcher — call after payment confirmed ─────────────────────────── */

export async function processDelivery(orderId: string): Promise<DeliveryResult> {
  const order = await prisma.orders.findUnique({
    where:   { id: orderId },
    include: {
      items: {
        include: {
          game: {
            select: {
              id: true, title: true, cover: true, deliveryType: true,
              dropshipSource: true, dropshipExternalId: true,
            },
          },
        },
      },
      user: { select: { id: true, email: true, username: true } },
    },
  });

  if (!order) throw new DeliveryError('Order not found', 'ORDER_NOT_FOUND', 404);
  if (order.status === 'COMPLETED') {
    throw new DeliveryError('Order already completed', 'ALREADY_COMPLETED', 409);
  }
  if (order.status === 'CANCELLED') {
    throw new DeliveryError('Cannot deliver a cancelled order', 'ORDER_CANCELLED', 409);
  }

  await auditLog(orderId, 'ORDER_PAID');

  const ctx: DeliveryContext = {
    orderId:    order.id,
    userId:     order.userId,
    userEmail:  order.user?.email    ?? '',
    username:   order.user?.username ?? '',
    totalPrice: order.totalPrice,
    items: order.items.map(i => ({
      id:           i.id,
      gameId:       i.gameId,
      gameTitle:    i.game?.title    ?? i.gameId,
      gameCover:    i.game?.cover    ?? null,
      deliveryType: (i.game?.deliveryType ?? 'MANUAL') as 'AUTO' | 'MANUAL' | 'DROPSHIP',
      price:        i.price,
      source:       i.game?.dropshipSource     ?? null,
      externalId:   i.game?.dropshipExternalId ?? null,
      keyValue:     i.keyValue,
    })),
  };

  // Priority: MANUAL > DROPSHIP > AUTO — the most-restrictive/most-involved
  // item in the cart decides the whole order's delivery path. A single
  // MANUAL item still forces the whole order to manual queue (unchanged
  // behavior); otherwise any DROPSHIP item routes the order (including any
  // AUTO items in the same cart) through dropshipDeliver, which handles
  // both kinds together.
  const needsManual   = ctx.items.some(i => i.deliveryType === 'MANUAL');
  const needsDropship = ctx.items.some(i => i.deliveryType === 'DROPSHIP');

  if (needsManual)   return queueManual(ctx);
  if (needsDropship) return dropshipDeliver(ctx);
  return autoDeliver(ctx);
}

// Re-export helpers
export { completeManual } from './manualDeliver';
export { getOrderAudit } from './audit';
export type { DeliveryResult, ManualCompleteInput } from './types';
export { DeliveryError } from './types';
