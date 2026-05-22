import { prisma } from '../../lib/prisma';
import { cacheGet, cacheSet } from '../../lib/redis';
import { config } from '../../config';
import type { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export function attachSocket(socketServer: SocketServer): void {
  io = socketServer;
}

class JackpotService {
  async getJackpot() {
    const cached = await cacheGet<{ id: string; total: number }>('cache:jackpot');
    if (cached) return cached;

    const jackpot = await prisma.jackpot.findFirst();
    const result = jackpot ?? { id: 'global', total: 0 };
    await cacheSet('cache:jackpot', result, config.redis_ttl.jackpot);
    return result;
  }

  async getRecentWinners(limit = 10) {
    return prisma.jackpotHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });
  }

  async awardJackpot(userId: string) {
    const jackpot = await prisma.jackpot.findUnique({ where: { id: 'global' } });
    if (!jackpot || jackpot.total === 0) throw new Error('Jackpot is empty');

    const amount = jackpot.total;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { arcCoins: true, username: true },
    });
    if (!user) throw new Error('User not found');

    await prisma.$transaction([
      prisma.jackpot.update({ where: { id: 'global' }, data: { total: 0 } }),
      prisma.user.update({
        where: { id: userId },
        data: {
          arcCoins: { increment: amount },
          totalWon: { increment: amount },
        },
      }),
      prisma.jackpotHistory.create({ data: { userId, amount } }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'JACKPOT_WIN',
          amount,
          balanceBefore: user.arcCoins,
          balanceAfter: user.arcCoins + amount,
          description: 'Jackpot win!',
        },
      }),
    ]);

    // Invalidate cache
    await cacheSet('cache:jackpot', { id: 'global', total: 0 }, config.redis_ttl.jackpot);

    // Broadcast jackpot win
    if (io) {
      io.emit('jackpot_update', { total: 0, winner: user.username, amount });
      io.emit('rare_win', { username: user.username, type: 'jackpot', amount });
    }

    return { winner: user.username, amount };
  }
}

export const jackpotService = new JackpotService();
