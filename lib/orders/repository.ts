import { prisma } from '@/lib/prisma';
import type { OrderFilters, CreateOrderDto, Order, mapOrder } from './types';
import { OrderError } from './types';

// Re-export for convenience
export { mapOrder } from './types';

// ── Order Repository ──────────────────────────────────────────────────────────

const ORDER_INCLUDE = {
  items: {
    include: {
      game: { select: { id: true, title: true, slug: true, cover: true } },
    },
  },
  user: { select: { id: true, email: true, username: true } },
} as const;

export async function findOrderById(id: string) {
  return prisma.orders.findUnique({
    where: { id },
    include: ORDER_INCLUDE,
  });
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

export async function createOrderTx(dto: CreateOrderDto) {
  const { userId, items } = dto;

  return prisma.$transaction(async tx => {
    // 1. Verify user exists
    const user = await tx.users.findUnique({ where: { id: userId } });
    if (!user) throw new OrderError('User not found', 'USER_NOT_FOUND', 404);

    // 2. Load games and validate stock
    const gameIds = [...new Set(items.map(i => i.gameId))];
    const games = await tx.games.findMany({
      where: { id: { in: gameIds }, isActive: true },
      select: { id: true, title: true, priceUzs: true, stockStore: true },
    });

    if (games.length !== gameIds.length) {
      const missing = gameIds.find(id => !games.find(g => g.id === id));
      throw new OrderError(`Game not found: ${missing}`, 'GAME_NOT_FOUND', 404);
    }

    // 3. Check stock and build line items
    const lineItems = items.map(item => {
      const game = games.find(g => g.id === item.gameId)!;
      if (game.stockStore < 1) {
        throw new OrderError(`No keys available for "${game.title}"`, 'OUT_OF_STOCK', 409);
      }
      return { gameId: game.id, price: game.priceUzs ?? 0 };
    });

    const totalPrice = lineItems.reduce((sum, li) => sum + li.price, 0);

    // 4. Allocate keys (one per game, SELECT … SKIP LOCKED)
    const allocatedKeys: Record<string, string> = {};
    for (const li of lineItems) {
      const [keyRow] = await tx.$queryRaw<Array<{ id: string; key_value: string }>>`
        SELECT id, key_value FROM game_keys
        WHERE game_id = ${li.gameId}
          AND status  = 'AVAILABLE'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;
      if (!keyRow) {
        throw new OrderError(`No keys available for game ${li.gameId}`, 'OUT_OF_STOCK', 409);
      }
      await tx.game_keys.update({
        where: { id: keyRow.id },
        data:  { status: 'SOLD' },
      });
      allocatedKeys[li.gameId] = keyRow.key_value;
    }

    // 5. Create order with items
    const order = await tx.orders.create({
      data: {
        userId,
        totalPrice,
        status: 'PAID',           // immediate delivery — mark as PAID right away
        items: {
          create: lineItems.map(li => ({
            gameId:   li.gameId,
            price:    li.price,
            keyValue: allocatedKeys[li.gameId] ?? null,
          })),
        },
      },
      include: ORDER_INCLUDE,
    });

    // 6. Decrement stock counters
    for (const li of lineItems) {
      await tx.games.update({
        where: { id: li.gameId },
        data:  { stockStore: { decrement: 1 } },
      });
    }

    return order;
  }, { timeout: 10_000 });
}

export async function updateOrderStatus(id: string, status: string) {
  const order = await prisma.orders.findUnique({ where: { id } });
  if (!order) throw new OrderError('Order not found', 'ORDER_NOT_FOUND', 404);

  return prisma.orders.update({
    where: { id },
    data:  { status: status as never },
    include: ORDER_INCLUDE,
  });
}
