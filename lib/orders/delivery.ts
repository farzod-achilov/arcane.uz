import { createLogger } from '@/lib/logger';
import { findOrderById, deliverKeysTx, updateOrderStatus, findWaitingOrders } from './repository';
import { mapOrder } from './types';
import { OrderError, type DeliveryResult } from './types';

const log = createLogger('key-delivery');

// ── Core delivery ─────────────────────────────────────────────────────────────

export async function deliverKeys(orderId: string): Promise<DeliveryResult> {
  log.info('Starting key delivery', { orderId });

  let txResult: Awaited<ReturnType<typeof deliverKeysTx>>;
  try {
    txResult = await deliverKeysTx(orderId);
  } catch (err) {
    if (err instanceof OrderError) {
      log.warn('Delivery blocked', { orderId, code: err.code, msg: err.message });
      throw err;
    }
    log.error('Delivery transaction failed', { orderId, err: String(err) });
    throw new OrderError('Key delivery failed — please retry', 'DELIVERY_FAILED', 500);
  }

  const { deliveredItems, waitingItems } = txResult;
  const outcome =
    waitingItems.length === 0 ? 'completed'
    : deliveredItems.length === 0 ? 'waiting_stock'
    : 'partial';

  log.info('Delivery finished', {
    orderId,
    outcome,
    delivered: deliveredItems.length,
    waiting:   waitingItems.length,
    games:     deliveredItems.map(d => d.gameTitle),
  });

  if (waitingItems.length > 0) {
    log.warn('Keys not available — order set to WAITING_STOCK', {
      orderId,
      games: waitingItems.map(w => w.gameTitle),
    });
  }

  return {
    orderId,
    outcome,
    delivered: deliveredItems.length,
    waiting:   waitingItems.length,
    items: [
      ...deliveredItems.map(d => ({
        itemId:    d.itemId,
        gameId:    d.gameId,
        gameTitle: d.gameTitle,
        delivered: true,
        keyValue:  d.keyValue,
      })),
      ...waitingItems.map(w => ({
        itemId:    w.itemId,
        gameId:    w.gameId,
        gameTitle: w.gameTitle,
        delivered: false,
        reason:    'No keys in stock',
      })),
    ],
  };
}

// ── Mark order as paid → trigger delivery ─────────────────────────────────────

export async function confirmPaymentAndDeliver(orderId: string) {
  log.info('Payment confirmed — marking PAID', { orderId });

  const order = await findOrderById(orderId);
  if (!order) throw new OrderError('Order not found', 'ORDER_NOT_FOUND', 404);
  if (order.status !== 'PENDING') {
    throw new OrderError(
      `Order is already ${order.status}`,
      'INVALID_STATE',
      409,
    );
  }

  await updateOrderStatus(orderId, 'PAID');
  log.info('Order marked PAID, delivering keys', { orderId });

  const delivery = await deliverKeys(orderId);
  const updatedOrder = await findOrderById(orderId);

  return { order: mapOrder(updatedOrder!), delivery };
}

// ── Retry all WAITING_STOCK orders ────────────────────────────────────────────

export interface RetryResult {
  processed: number;
  completed: number;
  stillWaiting: number;
  errors: number;
}

export async function retryWaitingOrders(): Promise<RetryResult> {
  const waiting = await findWaitingOrders();
  log.info('Retrying WAITING_STOCK orders', { count: waiting.length });

  const result: RetryResult = {
    processed: waiting.length,
    completed: 0,
    stillWaiting: 0,
    errors: 0,
  };

  for (const order of waiting) {
    try {
      const delivery = await deliverKeys(order.id);
      if (delivery.outcome === 'completed') {
        result.completed++;
        log.info('Waiting order fulfilled', { orderId: order.id });
      } else {
        result.stillWaiting++;
      }
    } catch (err) {
      result.errors++;
      log.error('Failed to retry order', { orderId: order.id, err: String(err) });
    }
  }

  log.info('Retry batch done', result);
  return result;
}
