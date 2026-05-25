import { prisma } from '@/lib/prisma';
import type { OrderFilters, CreateOrderDto } from './types';
import { OrderError } from './types';

export { mapOrder } from './types';

// ── Shared include ────────────────────────────────────────────────────────────

export const ORDER_INCLUDE = {
  items: {
    include: {
      game: { select: { id: true, title: true, slug: true, cover: true } },
    },
  },
  user: { select: { id: true, email: true, username: true } },
} as const;

// ── Queries ───────────────────────────────────────────────────────────────────

export async function findOrderById(id: string) {
  return prisma.orders.findUnique({ where: { id }, include: ORDER_INCLUDE });
}

export async function findOrders(filters: OrderFilters = {}) {
  const { userId, status, limit = 20, offset = 0 } = filters;
  const where = {
    ...(userId ? { userId } : {}),
    ...(status ? { status } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.orders.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
    }),
    prisma.orders.count({ where }),
  ]);
  return { rows, total };
}

export async function findUserOrders(userId: string, limit = 20, offset = 0) {
  return findOrders({ userId, limit, offset });
}

export async function findWaitingOrders() {
  return prisma.orders.findMany({
    where: { status: 'WAITING_MANUAL' },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: 'asc' },
  });
}

// ── Create (PENDING, no key allocation yet) ───────────────────────────────────

export async function createOrderTx(dto: CreateOrderDto) {
  const { userId, items } = dto;

  return prisma.$transaction(async tx => {
    // 1. Verify user
    const user = await tx.users.findUnique({ where: { id: userId } });
    if (!user) throw new OrderError('User not found', 'USER_NOT_FOUND', 404);

    // 2. Load & validate games
    const gameIds = Array.from(new Set(items.map(i => i.gameId)));
    const games = await tx.games.findMany({
      where: { id: { in: gameIds }, isActive: true },
      select: { id: true, title: true, priceUzs: true },
    });

    if (games.length !== gameIds.length) {
      const missing = gameIds.find(id => !games.find(g => g.id === id));
      throw new OrderError(`Game not found: ${missing}`, 'GAME_NOT_FOUND', 404);
    }

    const lineItems = items.map(item => {
      const game = games.find(g => g.id === item.gameId)!;
      return { gameId: game.id, price: game.priceUzs ?? 0 };
    });

    const totalPrice = lineItems.reduce((sum, li) => sum + li.price, 0);

    // 3. Create PENDING order — keys delivered in separate step after payment
    return tx.orders.create({
      data: {
        userId,
        totalPrice,
        status: 'PENDING',
        items: {
          create: lineItems.map(li => ({
            gameId:   li.gameId,
            price:    li.price,
            keyValue: null,
          })),
        },
      },
      include: ORDER_INCLUDE,
    });
  }, { timeout: 8_000 });
}

// ── Key delivery transaction ──────────────────────────────────────────────────

interface KeyRow { id: string; key_value: string }

export async function deliverKeysTx(orderId: string) {
  return prisma.$transaction(async tx => {
    // Lock the order row to prevent concurrent delivery attempts
    const [orderRow] = await tx.$queryRaw<Array<{ id: string; status: string }>>`
      SELECT id, status FROM orders
      WHERE id = ${orderId}
      FOR UPDATE
    `;

    if (!orderRow) throw new OrderError('Order not found', 'ORDER_NOT_FOUND', 404);
    if (orderRow.status === 'COMPLETED') {
      throw new OrderError('Order already completed', 'ALREADY_COMPLETED', 409);
    }
    if (orderRow.status === 'CANCELLED') {
      throw new OrderError('Cannot deliver a cancelled order', 'ORDER_CANCELLED', 409);
    }
    if (orderRow.status === 'PENDING') {
      throw new OrderError('Order not yet paid', 'NOT_PAID', 402);
    }

    // Load items that still need a key
    const items = await tx.order_items.findMany({
      where:   { orderId, keyValue: null },
      include: { game: { select: { id: true, title: true } } },
    });

    if (items.length === 0) {
      // All items already have keys — just mark completed
      await tx.orders.update({ where: { id: orderId }, data: { status: 'COMPLETED' } });
      return { deliveredItems: [], waitingItems: [] };
    }

    const deliveredItems: Array<{ itemId: string; gameId: string; gameTitle: string; keyValue: string }> = [];
    const waitingItems:   Array<{ itemId: string; gameId: string; gameTitle: string }> = [];

    for (const item of items) {
      // SELECT FOR UPDATE SKIP LOCKED — concurrent-safe key lock
      const [keyRow] = await tx.$queryRaw<KeyRow[]>`
        SELECT id, key_value FROM game_keys
        WHERE game_id = ${item.gameId}
          AND status  = 'AVAILABLE'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;

      if (!keyRow) {
        waitingItems.push({
          itemId:    item.id,
          gameId:    item.gameId,
          gameTitle: item.game?.title ?? item.gameId,
        });
        continue;
      }

      // Mark key as SOLD
      await tx.game_keys.update({
        where: { id: keyRow.id },
        data:  { status: 'SOLD', soldToUserId: item.orderId },
      });

      // Attach key to order item
      await tx.order_items.update({
        where: { id: item.id },
        data:  { keyValue: keyRow.key_value, deliveredAt: new Date() },
      });

      // Decrement game stock
      await tx.games.update({
        where: { id: item.gameId },
        data:  { stockStore: { decrement: 1 } },
      });

      deliveredItems.push({
        itemId:    item.id,
        gameId:    item.gameId,
        gameTitle: item.game?.title ?? item.gameId,
        keyValue:  keyRow.key_value,
      });
    }

    // Set final order status
    const newStatus = waitingItems.length === 0 ? 'COMPLETED' : 'WAITING_MANUAL';
    await tx.orders.update({ where: { id: orderId }, data: { status: newStatus } });

    return { deliveredItems, waitingItems };
  }, { timeout: 15_000 });
}

// ── Status update ─────────────────────────────────────────────────────────────

export async function updateOrderStatus(id: string, status: string) {
  const order = await prisma.orders.findUnique({ where: { id } });
  if (!order) throw new OrderError('Order not found', 'ORDER_NOT_FOUND', 404);
  return prisma.orders.update({
    where: { id },
    data:  { status: status as never },
    include: ORDER_INCLUDE,
  });
}
