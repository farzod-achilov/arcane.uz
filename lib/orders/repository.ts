import { prisma } from '@/lib/prisma';
import { decryptKey } from '@/lib/keys/encryption';
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
  const { userId, items, paymentMethod, promoId } = dto;

  // Cashback % by level
  const CASHBACK_PCT: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 5 };
  function getCashbackPct(level: number) { return CASHBACK_PCT[Math.min(level, 4)] ?? 6; }
  // Coin exchange: 1000 ARC = 10 000 сум
  const COINS_TO_SUM = 10;

  return prisma.$transaction(async tx => {
    // 1. Verify user
    const user = await tx.users.findUnique({
      where:  { id: userId },
      select: { id: true, balanceUzs: true, arcCoins: true, level: true },
    });
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

    const subtotal = lineItems.reduce((sum, li) => sum + li.price, 0);

    // 2b. Apply promo code if provided
    let promoDiscount = 0;
    if (promoId) {
      const promo = await tx.promo_codes.findUnique({ where: { id: promoId } });
      if (promo && promo.isActive &&
          !(promo.expiresAt && promo.expiresAt < new Date()) &&
          !(promo.maxUses !== null && promo.usedCount >= promo.maxUses)) {
        promoDiscount = promo.type === 'PERCENT'
          ? Math.round(subtotal * promo.value / 100)
          : Math.min(promo.value, subtotal);
        await tx.promo_codes.update({
          where: { id: promoId },
          data:  { usedCount: { increment: 1 } },
        });
      }
    }

    // 2c. Apply ARC coins discount (max 30% of subtotal after promo)
    const afterPromo = Math.max(0, subtotal - promoDiscount);
    const maxCoinDiscount = Math.floor(afterPromo * 0.3);
    const requestedCoinDiscount = dto.coinsToUse ? dto.coinsToUse * COINS_TO_SUM : 0;
    const coinDiscount = Math.min(requestedCoinDiscount, maxCoinDiscount);
    const coinsSpent   = coinDiscount > 0 ? Math.ceil(coinDiscount / COINS_TO_SUM) : 0;

    if (coinsSpent > 0 && user.arcCoins < coinsSpent) {
      throw new OrderError(
        `Недостаточно ARC Coins. Есть: ${user.arcCoins}, нужно: ${coinsSpent}`,
        'INSUFFICIENT_COINS', 400,
      );
    }

    const totalPrice = Math.max(0, afterPromo - coinDiscount);

    // Deduct coins if used — conditional update guards against concurrent spends
    if (coinsSpent > 0) {
      const deducted = await tx.users.updateMany({
        where: { id: userId, arcCoins: { gte: coinsSpent } },
        data:  { arcCoins: { decrement: coinsSpent } },
      });
      if (deducted.count === 0) {
        throw new OrderError(
          `Недостаточно ARC Coins. Нужно: ${coinsSpent}`,
          'INSUFFICIENT_COINS', 400,
        );
      }
    }

    // 3a. Balance payment — check and deduct immediately
    if (paymentMethod === 'balance') {
      const paid = await tx.users.updateMany({
        where: { id: userId, balanceUzs: { gte: totalPrice } },
        data:  { balanceUzs: { decrement: totalPrice } },
      });
      if (paid.count === 0) {
        throw new OrderError(
          `Недостаточно средств. Баланс: ${user.balanceUzs} сум, нужно: ${totalPrice} сум`,
          'INSUFFICIENT_BALANCE',
          400,
        );
      }
    }

    // 3b. Create order
    const order = await tx.orders.create({
      data: {
        userId,
        totalPrice,
        status: paymentMethod === 'balance' ? 'PAID' : 'PENDING',
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

    // 3c. Cashback — award ARC coins based on level (balance orders only, PAID immediately)
    if (totalPrice > 0 && paymentMethod === 'balance') {
      const pct      = getCashbackPct(user.level);
      const cashback = Math.floor(totalPrice * pct / 100 / COINS_TO_SUM); // convert сум → ARC
      if (cashback > 0) {
        await tx.users.update({
          where: { id: userId },
          data:  { arcCoins: { increment: cashback }, totalSpent: { increment: totalPrice } },
        });
        await tx.transactions.create({
          data: {
            id:            `cb_${order.id}`,
            userId,
            type:          'ADMIN_GRANT',
            amount:        cashback,
            balanceBefore: user.arcCoins - coinsSpent,
            balanceAfter:  user.arcCoins - coinsSpent + cashback,
            description:   `Кэшбэк ${pct}% с заказа #${order.id.slice(-6)}`,
          },
        });
      }
    }

    return order;
  }, { timeout: 8_000 });
}

// ── Key delivery transaction ──────────────────────────────────────────────────

interface KeyRow { id: string; encryptedKey: string; keyIv: string; keyTag: string }

export async function deliverKeysTx(orderId: string) {
  return prisma.$transaction(async tx => {
    // Lock the order row to prevent concurrent delivery attempts
    const [orderRow] = await tx.$queryRaw<Array<{ id: string; status: string; user_id: string }>>`
      SELECT id, status, user_id FROM orders
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
        SELECT id, "encryptedKey", "keyIv", "keyTag" FROM game_keys
        WHERE "gameId" = ${item.gameId}
          AND status   = 'AVAILABLE'
        ORDER BY "createdAt" ASC
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

      const keyValue = decryptKey(keyRow);

      // Mark key as SOLD
      await tx.game_keys.update({
        where: { id: keyRow.id },
        data:  { status: 'SOLD', soldToUserId: orderRow.user_id, deliveredAt: new Date(), updatedAt: new Date() },
      });

      // Attach key to order item
      await tx.order_items.update({
        where: { id: item.id },
        data:  { keyValue, deliveredAt: new Date() },
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
        keyValue,
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
