import {
  findOrderById,
  findOrders,
  findUserOrders,
  createOrderTx,
  updateOrderStatus,
  mapOrder,
} from './repository';
import { OrderError, type CreateOrderDto, type OrderFilters, type OrderStatus } from './types';

// ── Validation ────────────────────────────────────────────────────────────────

function validateCreateOrder(body: unknown): CreateOrderDto {
  if (!body || typeof body !== 'object') {
    throw new OrderError('Request body required', 'INVALID_BODY', 400);
  }
  const b = body as Record<string, unknown>;

  if (typeof b.userId !== 'string' || !b.userId.trim()) {
    throw new OrderError('userId is required', 'INVALID_USER_ID', 400);
  }
  if (!Array.isArray(b.items) || b.items.length === 0) {
    throw new OrderError('items must be a non-empty array', 'INVALID_ITEMS', 400);
  }

  const items = b.items.map((item: unknown, idx: number) => {
    if (!item || typeof item !== 'object') {
      throw new OrderError(`items[${idx}]: must be an object`, 'INVALID_ITEM', 400);
    }
    const it = item as Record<string, unknown>;
    if (typeof it.gameId !== 'string' || !it.gameId.trim()) {
      throw new OrderError(`items[${idx}].gameId is required`, 'INVALID_ITEM', 400);
    }
    return { gameId: it.gameId.trim() };
  });

  if (items.length > 10) {
    throw new OrderError('Maximum 10 items per order', 'TOO_MANY_ITEMS', 400);
  }

  return { userId: b.userId.trim(), items };
}

const VALID_STATUSES: OrderStatus[] = ['PENDING', 'PAID', 'COMPLETED', 'CANCELLED'];

// ── Service methods ───────────────────────────────────────────────────────────

export async function createOrder(body: unknown) {
  const dto = validateCreateOrder(body);
  const raw = await createOrderTx(dto);
  return mapOrder(raw);
}

export async function getOrder(id: string) {
  if (!id) throw new OrderError('Order ID required', 'INVALID_ID', 400);
  const raw = await findOrderById(id);
  if (!raw) throw new OrderError('Order not found', 'ORDER_NOT_FOUND', 404);
  return mapOrder(raw);
}

export async function listOrders(filters: OrderFilters = {}) {
  const { rows, total } = await findOrders(filters);
  return { orders: rows.map(mapOrder), total };
}

export async function getUserOrders(userId: string, limit?: number, offset?: number) {
  if (!userId) throw new OrderError('User ID required', 'INVALID_USER_ID', 400);
  const { rows, total } = await findUserOrders(userId, limit, offset);
  return { orders: rows.map(mapOrder), total };
}

export async function patchOrderStatus(id: string, status: unknown) {
  if (typeof status !== 'string' || !VALID_STATUSES.includes(status as OrderStatus)) {
    throw new OrderError(
      `status must be one of: ${VALID_STATUSES.join(', ')}`,
      'INVALID_STATUS', 400,
    );
  }
  const raw = await updateOrderStatus(id, status);
  return mapOrder(raw);
}
