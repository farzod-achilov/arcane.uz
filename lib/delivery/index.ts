import { prisma } from '@/lib/prisma';
import { auditLog } from './audit';
import { autoDeliver } from './autoDeliver';
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
              id: true, title: true, cover: true,
              deliveryType: true,
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
      deliveryType: (i.game?.deliveryType ?? 'MANUAL') as 'AUTO' | 'MANUAL',
      price:        i.price,
    })),
  };

  // Determine delivery type by most-restrictive item
  // MANUAL takes priority — if any item needs manual, whole order is manual
  const needsManual = ctx.items.some(i => i.deliveryType === 'MANUAL');

  if (needsManual) {
    return queueManual(ctx);
  }
  return autoDeliver(ctx);
}

// Re-export helpers
export { completeManual } from './manualDeliver';
export { getOrderAudit } from './audit';
export type { DeliveryResult, ManualCompleteInput } from './types';
export { DeliveryError } from './types';
