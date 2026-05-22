import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/error.middleware';

class UsersService {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, avatar: true, level: true,
        xp: true, arcCoins: true, streak: true, totalDrops: true,
        totalSpent: true, totalWon: true, isAdmin: true, createdAt: true,
      },
    });
  }

  async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      select: {
        id: true, username: true, avatar: true, level: true,
        xp: true, totalDrops: true, totalWon: true, createdAt: true,
      },
    });
  }

  async updateProfile(id: string, data: Partial<{ username: string; avatar: string }>) {
    if (data.username) {
      const taken = await prisma.user.findFirst({
        where: { username: data.username, NOT: { id } },
      });
      if (taken) throw new AppError('Username already taken', 409);
    }
    return prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, avatar: true },
    });
  }

  async getTransactionHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where: { userId } }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { data: transactions, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async getLeaderboard(limit = 50) {
    return prisma.user.findMany({
      where: { isBanned: false },
      orderBy: { totalWon: 'desc' },
      take: limit,
      select: {
        id: true, username: true, avatar: true,
        level: true, totalWon: true, totalDrops: true,
      },
    });
  }

  // Admin
  async listUsers(page = 1, limit = 20, search?: string) {
    const where = search
      ? { OR: [{ username: { contains: search } }, { email: { contains: search } }] }
      : {};
    const skip = (page - 1) * limit;
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true, username: true, email: true, level: true,
          arcCoins: true, isBanned: true, isAdmin: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { data: users, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async banUser(id: string, reason: string) {
    return prisma.user.update({ where: { id }, data: { isBanned: true, banReason: reason } });
  }

  async unbanUser(id: string) {
    return prisma.user.update({ where: { id }, data: { isBanned: false, banReason: null } });
  }

  async grantCoins(id: string, amount: number) {
    const user = await prisma.user.findUnique({ where: { id }, select: { arcCoins: true } });
    if (!user) throw new AppError('User not found', 404);

    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { arcCoins: { increment: amount } } }),
      prisma.transaction.create({
        data: {
          userId: id,
          type: 'ADMIN_GRANT',
          amount,
          balanceBefore: user.arcCoins,
          balanceAfter: user.arcCoins + amount,
          description: `Admin granted ${amount} ARC coins`,
        },
      }),
    ]);

    return { userId: id, granted: amount, newBalance: user.arcCoins + amount };
  }
}

export const usersService = new UsersService();
