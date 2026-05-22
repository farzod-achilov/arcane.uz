import { InventoryStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/error.middleware';

class InventoryService {
  async getUserInventory(userId: string, status?: InventoryStatus, page = 1, limit = 20) {
    const where: Record<string, unknown> = { userId };
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      prisma.inventory.count({ where }),
      prisma.inventory.findMany({
        where,
        include: {
          reward: {
            select: {
              id: true, name: true, type: true, rarity: true,
              imageUrl: true, sellValue: true, metadata: true,
              game: { select: { id: true, title: true, cover: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { data: items, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async claim(userId: string, inventoryId: string) {
    const item = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { reward: { select: { name: true, type: true, metadata: true } } },
    });

    if (!item) throw new AppError('Inventory item not found', 404);
    if (item.userId !== userId) throw new AppError('This item does not belong to you', 403);
    if (item.status !== 'PENDING') throw new AppError('Item has already been claimed or sold', 400);

    const updated = await prisma.inventory.update({
      where: { id: inventoryId },
      data: { status: 'CLAIMED', claimedAt: new Date() },
      include: { reward: true },
    });

    return updated;
  }

  async getDropHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, history] = await Promise.all([
      prisma.dropHistory.count({ where: { userId } }),
      prisma.dropHistory.findMany({
        where: { userId },
        include: {
          drop: { select: { id: true, name: true, theme: true, imageUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { data: history, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
}

export const inventoryService = new InventoryService();
