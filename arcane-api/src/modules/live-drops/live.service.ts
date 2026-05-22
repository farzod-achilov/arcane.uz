import { prisma } from '../../lib/prisma';
import { redis, cacheGet, cacheSet } from '../../lib/redis';
import { config } from '../../config';

const ONLINE_KEY = 'live:online_count';
const ONLINE_TTL = config.redis_ttl.onlineUsers;

class LiveService {
  async getRecentDrops(limit = 20) {
    const cached = await cacheGet<unknown[]>('cache:live:drops');
    if (cached) return cached;

    const drops = await prisma.liveDrop.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    await cacheSet('cache:live:drops', drops, 10);
    return drops;
  }

  async getOnlineCount(): Promise<number> {
    const val = await redis.get(ONLINE_KEY);
    return val ? parseInt(val, 10) : 0;
  }

  async trackUserOnline(userId: string): Promise<number> {
    await redis.sadd('live:online_users', userId);
    await redis.expire('live:online_users', ONLINE_TTL);
    const count = await redis.scard('live:online_users');
    await redis.set(ONLINE_KEY, count, 'EX', ONLINE_TTL);
    return count;
  }

  async trackUserOffline(userId: string): Promise<number> {
    await redis.srem('live:online_users', userId);
    const count = await redis.scard('live:online_users');
    await redis.set(ONLINE_KEY, count, 'EX', ONLINE_TTL);
    return count;
  }

  async getRareFeed(limit = 10) {
    return prisma.liveDrop.findMany({
      where: { rarity: { in: ['EPIC', 'LEGENDARY'] } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const liveService = new LiveService();
