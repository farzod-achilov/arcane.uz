import { prisma } from '@/lib/prisma';
import { auditLog } from './audit';
import { notifyNewManualOrder, notifyOrderCompleted, notifyUserOrderComplete } from './notify';
import { DeliveryError } from './types';
import type { DeliveryContext, ManualDeliveryResult, ManualCompleteInput } from './types';

/* ── Queue a MANUAL order (called on payment) ──────────────────────────────── */

export async function queueManual(ctx: DeliveryContext): Promise<ManualDeliveryResult> {
  await prisma.orders.update({
    where: { id: ctx.orderId },
    data:  { status: 'WAITING_MANUAL' },
  });

  await auditLog(ctx.orderId, 'MANUAL_QUEUED', 'system');

  notifyNewManualOrder({
    orderId:    ctx.orderId,
    username:   ctx.username,
    email:      ctx.userEmail,
    gameTitle:  ctx.items.map(i => i.gameTitle).join(', '),
    totalPrice: ctx.totalPrice,
  }).then(() => auditLog(ctx.orderId, 'MANUAL_ADMIN_NOTIFIED')).catch(() => null);

  return { type: 'MANUAL', status: 'WAITING_MANUAL', orderId: ctx.orderId };
}

/* ── Admin/operator completes a manual order ────────────────────────────────── */

export async function completeManual(input: ManualCompleteInput) {
  const { orderId, actorId, actorName, deliveryNote, keyValue } = input;

  const order = await prisma.orders.findUnique({
    where:   { id: orderId },
    include: {
      items: { include: { game: { select: { id: true, title: true } } } },
      user:  { select: { id: true, email: true, username: true } },
    },
  });

  if (!order) throw new DeliveryError('Order not found', 'ORDER_NOT_FOUND', 404);
  if (order.status === 'COMPLETED') {
    throw new DeliveryError('Order already completed', 'ALREADY_COMPLETED', 409);
  }
  if (order.status === 'CANCELLED') {
    throw new DeliveryError('Cannot complete a cancelled order', 'ORDER_CANCELLED', 409);
  }
  if (order.status === 'PENDING') {
    throw new DeliveryError('Order not yet paid', 'NOT_PAID', 402);
  }

  const now = new Date();

  await prisma.$transaction(async tx => {
    // If a key was provided, write it to all undelivered items
    if (keyValue?.trim()) {
      const undelivered = order.items.filter(i => !i.keyValue);
      for (const item of undelivered) {
        await tx.order_items.update({
          where: { id: item.id },
          data:  { keyValue: keyValue.trim(), deliveredAt: now },
        });
      }
    }

    await tx.orders.update({
      where: { id: orderId },
      data:  {
        status:      'COMPLETED',
        deliveredAt: now,
        deliveredBy: actorName,
        deliveryNote: deliveryNote?.trim() || null,
      },
    });
  });

  await auditLog(
    orderId,
    'MANUAL_COMPLETE',
    `admin:${actorId}`,
    deliveryNote,
    { actorName, keyProvided: !!keyValue },
  );

  const gameTitle = order.items[0]?.game?.title ?? '—';
  notifyOrderCompleted({
    orderId,
    username:  order.user?.username ?? '—',
    email:     order.user?.email    ?? '—',
    gameTitle,
    method:    'MANUAL',
    actorName,
  }).catch(() => null);

  if (order.user?.id) {
    notifyUserOrderComplete({
      userId:    order.user.id,
      orderId,
      gameTitle,
      keyValue,
    }).catch(() => null);
  }

  return prisma.orders.findUnique({
    where:   { id: orderId },
    include: {
      items: { include: { game: { select: { id: true, title: true, cover: true } } } },
      user:  { select: { id: true, email: true, username: true } },
    },
  });
}
