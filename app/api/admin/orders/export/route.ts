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
  const status   = searchParams.get('status') ?? '';
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo   = searchParams.get('dateTo')   ?? '';

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo   ? { lte: new Date(dateTo + 'T23:59:59Z') } : {}),
    };
  }

  const orders = await prisma.orders.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 10_000,
    include: {
      user:  { select: { email: true, username: true } },
      items: { include: { game: { select: { title: true } } } },
    },
  });

  const header = ['ID', 'Дата', 'Статус', 'Покупатель', 'Email', 'Игры', 'Сумма (сум)'];
  const rows = orders.map(o => [
    o.id,
    o.createdAt.toISOString().slice(0, 19).replace('T', ' '),
    o.status,
    o.user?.username,
    o.user?.email,
    o.items.map(i => i.game?.title ?? i.gameId).join('; '),
    o.totalPrice,
  ]);

  const csv = buildCsv(header, rows);
  return csvResponse(csv, `orders_${new Date().toISOString().slice(0, 10)}.csv`);
}
