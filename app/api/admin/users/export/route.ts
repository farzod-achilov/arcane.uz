import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildCsv, csvResponse } from '@/lib/csv';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return new Response('Forbidden', { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';

  const users = await prisma.users.findMany({
    where: q ? {
      OR: [
        { username: { contains: q, mode: 'insensitive' } },
        { email:    { contains: q, mode: 'insensitive' } },
      ],
    } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 10_000,
    select: {
      id: true, email: true, username: true, isAdmin: true,
      arcCoins: true, balanceUzs: true, createdAt: true,
      _count: { select: { orders: true } },
    },
  });

  const header = ['ID', 'Email', 'Имя пользователя', 'Дата регистрации', 'ARC Coins', 'Баланс (сум)', 'Заказов', 'Админ'];
  const rows = users.map(u => [
    u.id,
    u.email,
    u.username,
    u.createdAt.toISOString().slice(0, 10),
    u.arcCoins,
    u.balanceUzs,
    u._count.orders,
    u.isAdmin ? 'да' : 'нет',
  ]);

  const csv = buildCsv(header, rows);
  return csvResponse(csv, `users_${new Date().toISOString().slice(0, 10)}.csv`);
}
