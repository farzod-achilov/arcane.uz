import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildCsv } from '@/lib/csv';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to   = searchParams.get('to');

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to   ? { lte: new Date(to + 'T23:59:59Z') } : {}),
    };
  }

  const orders = await prisma.orders.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take:    5000,
    select: {
      id:         true,
      status:     true,
      totalPrice: true,
      createdAt:  true,
      user:       { select: { username: true, email: true } },
      items:      { select: { price: true, game: { select: { title: true } } } },
    },
  });

  const header = ['ID','Дата','Пользователь','Email','Игры','Кол-во','Сумма (UZS)','Статус'];
  const rows = orders.map(o => [
    o.id,
    o.createdAt.toISOString().slice(0, 19).replace('T', ' '),
    o.user.username,
    o.user.email,
    o.items.map(i => i.game.title).join(' | '),
    o.items.length,
    o.totalPrice,
    o.status,
  ]);

  const csv = buildCsv(header, rows);

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orders_${new Date().toISOString().slice(0,10)}.csv"`,
    },
  });
}
