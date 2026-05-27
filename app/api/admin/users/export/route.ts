import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function esc(v: string | null | undefined) {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

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

  const header = ['ID', 'Email', 'Имя пользователя', 'Дата регистрации', 'ARC Coins', 'Баланс (сум)', 'Заказов', 'Админ'].join(',');
  const rows = users.map(u => [
    esc(u.id),
    esc(u.email),
    esc(u.username),
    esc(u.createdAt.toISOString().slice(0, 10)),
    u.arcCoins,
    u.balanceUzs,
    u._count.orders,
    u.isAdmin ? 'да' : 'нет',
  ].join(','));

  const csv = [header, ...rows].join('\r\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="users_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
