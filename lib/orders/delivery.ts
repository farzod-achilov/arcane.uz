import { findOrderById, updateOrderStatus } from './repository';
import { mapOrder, OrderError } from './types';
import { processDelivery } from '@/lib/delivery';

// ── Mark order as paid → trigger delivery ─────────────────────────────────────

export async function confirmPaymentAndDeliver(orderId: string) {
  const order = await findOrderById(orderId);
  if (!order) throw new OrderError('Order not found', 'ORDER_NOT_FOUND', 404);
  if (order.status !== 'PENDING') {
    throw new OrderError(`Order is already ${order.status}`, 'INVALID_STATE', 409);
  }

  await updateOrderStatus(orderId, 'PAID');

  const delivery = await processDelivery(orderId);
  const updated  = await findOrderById(orderId);

  return { order: mapOrder(updated!), delivery };
}

// ── Retry waiting MANUAL orders ────────────────────────────────────────────────

export async function retryWaitingOrders() {
  // Re-exported for backward compat — no-op in new system (manual = operator handles it)
  return { processed: 0, completed: 0, stillWaiting: 0, errors: 0 };
}
