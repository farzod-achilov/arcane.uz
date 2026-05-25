import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import LibraryClient from './LibraryClient';

export const metadata = { title: 'Моя библиотека — ARCANE.UZ' };

async function getLibraryData(userId: string) {
  const orders = await prisma.orders.findMany({
    where: {
      userId,
      status: { in: ['PAID', 'COMPLETED', 'WAITING_STOCK'] },
    },
    include: {
      items: {
        include: {
          game: {
            select: {
              id: true, title: true, cover: true, slug: true,
              genres: true, platforms: true, developer: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders;
}

export default async function LibraryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login?next=/library');

  const orders = await getLibraryData(session.user.id);

  const items = orders.flatMap((order) =>
    order.items.map((item) => ({
      orderId:     order.id,
      orderStatus: order.status,
      orderDate:   order.createdAt.toISOString(),
      itemId:      item.id,
      price:       item.price,
      keyValue:    item.keyValue ?? null,
      deliveredAt: item.deliveredAt?.toISOString() ?? null,
      game: {
        id:        item.game.id,
        title:     item.game.title,
        cover:     item.game.cover ?? null,
        slug:      item.game.slug,
        genres:    item.game.genres,
        platforms: item.game.platforms,
        developer: item.game.developer ?? null,
      },
    })),
  );

  return (
    <LibraryClient
      items={items}
      username={session.user.name ?? 'Игрок'}
      avatar={session.user.image ?? null}
    />
  );
}
