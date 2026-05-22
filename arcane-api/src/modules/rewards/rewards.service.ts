import { Rarity, RewardType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/error.middleware';

class RewardsService {
  async listByDrop(dropId: string) {
    return prisma.dropReward.findMany({
      where: { dropId, isActive: true },
      include: { game: { select: { id: true, title: true, cover: true, slug: true } } },
      orderBy: { rarity: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.dropReward.findUnique({
      where: { id },
      include: { game: true, drop: { select: { id: true, name: true, theme: true } } },
    });
  }

  async create(data: {
    dropId: string; name: string; type: RewardType; rarity: Rarity;
    dropChance: number; sellValue: number; gameId?: string;
    imageUrl?: string; metadata?: object;
  }) {
    // Validate total chance doesn't exceed 100
    const existing = await prisma.dropReward.aggregate({
      where: { dropId: data.dropId, isActive: true },
      _sum: { dropChance: true },
    });
    const usedChance = existing._sum.dropChance ?? 0;
    if (usedChance + data.dropChance > 100) {
      throw new AppError(
        `Drop chance overflow. Used: ${usedChance}%, Adding: ${data.dropChance}%. Max: 100%`,
        400
      );
    }

    return prisma.dropReward.create({ data });
  }

  async update(id: string, data: Partial<{
    name: string; dropChance: number; sellValue: number;
    rarity: Rarity; isActive: boolean; metadata: object;
  }>) {
    return prisma.dropReward.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.dropReward.update({ where: { id }, data: { isActive: false } });
  }

  async sell(userId: string, inventoryId: string) {
    const item = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: {
        reward: { select: { sellValue: true, name: true } },
        user: { select: { arcCoins: true } },
      },
    });

    if (!item) throw new AppError('Inventory item not found', 404);
    if (item.userId !== userId) throw new AppError('This item does not belong to you', 403);
    if (item.status !== 'PENDING') throw new AppError('Item has already been sold or claimed', 400);

    const { sellValue } = item.reward;

    await prisma.$transaction([
      prisma.inventory.update({
        where: { id: inventoryId },
        data: { status: 'SOLD', soldAt: new Date(), soldFor: sellValue },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          arcCoins: { increment: sellValue },
          totalWon: { increment: sellValue },
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'REWARD_SELL',
          amount: sellValue,
          balanceBefore: item.user.arcCoins,
          balanceAfter: item.user.arcCoins + sellValue,
          description: `Sold: ${item.reward.name}`,
          metadata: { inventoryId },
        },
      }),
    ]);

    return { soldFor: sellValue, newBalance: item.user.arcCoins + sellValue };
  }
}

export const rewardsService = new RewardsService();
