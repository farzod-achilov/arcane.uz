import { prisma } from '../../lib/prisma';
import { redis, cacheGet, cacheSet } from '../../lib/redis';
import { selectReward, calcJackpotContribution, calcXpGain, calcLevelFromXp } from '../../utils/rewardEngine';
import { AppError } from '../../middlewares/error.middleware';
import { config } from '../../config';
import type { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export function attachSocket(socketServer: SocketServer): void {
  io = socketServer;
}

class DropsService {
  async list() {
    const cached = await cacheGet('cache:drops:featured');
    if (cached) return cached;

    const drops = await prisma.dropMachine.findMany({
      where: { isActive: true },
      orderBy: [{ featuredOrder: 'asc' }, { totalOpened: 'desc' }],
      include: {
        rewards: {
          where: { isActive: true },
          select: { id: true, name: true, type: true, rarity: true, imageUrl: true, dropChance: true, sellValue: true },
        },
      },
    });

    await cacheSet('cache:drops:featured', drops, 300);
    return drops;
  }

  async findById(id: string) {
    return prisma.dropMachine.findUnique({
      where: { id },
      include: {
        rewards: { where: { isActive: true } },
        _count: { select: { history: true } },
      },
    });
  }

  async openDrop(userId: string, dropId: string) {
    const [user, drop] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.dropMachine.findUnique({
        where: { id: dropId },
        include: { rewards: { where: { isActive: true } } },
      }),
    ]);

    if (!user) throw new AppError('User not found', 404);
    if (!drop) throw new AppError('Drop machine not found', 404);
    if (!drop.isActive) throw new AppError('This drop machine is currently inactive', 400);
    if (user.arcCoins < drop.price) {
      throw new AppError(`Insufficient ARC coins. Need ${drop.price}, have ${user.arcCoins}`, 402);
    }
    if (drop.rewards.length === 0) throw new AppError('Drop has no active rewards', 400);

    // ── Secure reward selection (backend-only) ──────────────────────────────
    const selected = selectReward(
      drop.rewards.map((r) => ({ id: r.id, rarity: r.rarity, dropChance: r.dropChance }))
    );

    const reward = drop.rewards.find((r) => r.id === selected.id)!;
    const jackpotContrib = calcJackpotContribution(drop.price, config.jackpot.contributionPercent);
    const xpGain = calcXpGain(reward.rarity);
    const newXp = user.xp + xpGain;
    const newLevel = calcLevelFromXp(newXp);

    // ── Atomic transaction ──────────────────────────────────────────────────
    // Guarded decrement (arcCoins >= price) is what actually prevents two
    // concurrent openDrop() calls from both passing the balance check above
    // and both spending coins the user only had once (TOCTOU race) — the
    // whole transaction aborts if the guard fails, so no reward/history/
    // jackpot row gets created for an unpaid drop.
    const inventoryItem = await prisma.$transaction(async (tx) => {
      const { count } = await tx.user.updateMany({
        where: { id: userId, arcCoins: { gte: drop.price } },
        data: {
          arcCoins: { decrement: drop.price },
          totalDrops: { increment: 1 },
          totalSpent: { increment: drop.price },
          xp: newXp,
          level: newLevel,
        },
      });
      if (count === 0) {
        throw new AppError(`Insufficient ARC coins. Need ${drop.price}`, 402);
      }

      const created = await tx.inventory.create({ data: { userId, rewardId: reward.id } });

      await tx.dropHistory.create({
        data: { userId, dropId, rewardId: reward.id, coinsSpent: drop.price, jackpotContrib },
      });
      await tx.dropMachine.update({
        where: { id: dropId },
        data: { totalOpened: { increment: 1 } },
      });
      await tx.dropReward.update({
        where: { id: reward.id },
        data: { timesDropped: { increment: 1 } },
      });
      await tx.jackpot.upsert({
        where: { id: 'global' },
        create: { id: 'global', total: jackpotContrib },
        update: { total: { increment: jackpotContrib } },
      });
      await tx.transaction.create({
        data: {
          userId,
          type: 'DROP_OPEN',
          amount: -drop.price,
          balanceBefore: user.arcCoins,
          balanceAfter: user.arcCoins - drop.price,
          description: `Opened ${drop.name}`,
          metadata: { dropId, rewardId: reward.id },
        },
      });

      return created;
    });

    // ── Live drop event ─────────────────────────────────────────────────────
    const liveEntry = await prisma.liveDrop.create({
      data: {
        userId,
        username: user.username,
        avatar: user.avatar ?? null,
        rewardName: reward.name,
        rarity: reward.rarity,
        dropName: drop.name,
        imageUrl: reward.imageUrl ?? null,
      },
    });

    // Bust featured drops cache
    await redis.del('cache:drops:featured');

    // Realtime broadcast
    if (io) {
      const jackpot = await prisma.jackpot.findUnique({ where: { id: 'global' } });

      io.emit('reward_drop', {
        username: user.username,
        avatar: user.avatar,
        rewardName: reward.name,
        rarity: reward.rarity,
        dropName: drop.name,
        imageUrl: reward.imageUrl,
        timestamp: liveEntry.createdAt,
      });

      io.emit('jackpot_update', { total: jackpot?.total ?? 0 });
    }

    return {
      inventoryId: inventoryItem.id,
      reward: {
        id: reward.id,
        name: reward.name,
        type: reward.type,
        rarity: reward.rarity,
        imageUrl: reward.imageUrl,
        sellValue: reward.sellValue,
        metadata: reward.metadata,
      },
      user: {
        arcCoins: user.arcCoins - drop.price,
        xp: newXp,
        level: newLevel,
        leveledUp: newLevel > user.level,
      },
    };
  }

  async create(data: {
    name: string; slug: string; theme: string; price: number;
    description?: string; imageUrl?: string; animConfig?: object;
  }) {
    return prisma.dropMachine.create({ data });
  }

  async update(id: string, data: Partial<{
    name: string; price: number; isActive: boolean; featuredOrder: number; animConfig: object;
  }>) {
    await redis.del('cache:drops:featured');
    return prisma.dropMachine.update({ where: { id }, data });
  }
}

export const dropsService = new DropsService();
