import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyWishlistPriceDrop } from '@/lib/delivery/notify';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

// PATCH /api/admin/games/[id] — update game fields
export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as {
    isActive?:    boolean;
    deliveryType?: 'AUTO' | 'MANUAL' | 'DROPSHIP';
    priceUzs?:    number;
    priceUsd?:    number;
    title?:       string;
    description?: string;
    developer?:   string;
    publisher?:   string;
  };

  const existing = body.priceUzs != null
    ? await prisma.games.findUnique({
        where:  { id: params.id },
        select: { priceUzs: true, title: true, slug: true },
      })
    : null;

  const game = await prisma.games.update({
    where: { id: params.id },
    data:  {
      ...(body.isActive    != null && { isActive:    body.isActive    }),
      ...(body.deliveryType        && { deliveryType: body.deliveryType }),
      ...(body.priceUzs    != null && { priceUzs:    body.priceUzs    }),
      ...(body.priceUsd    != null && { priceUsd:    body.priceUsd    }),
      ...(body.title               && { title:       body.title       }),
      ...(body.description != null && { description: body.description }),
      ...(body.developer   != null && { developer:   body.developer   }),
      ...(body.publisher   != null && { publisher:   body.publisher   }),
    },
    select: {
      id: true, title: true, slug: true, isActive: true, deliveryType: true,
      priceUzs: true, priceUsd: true,
    },
  });

  if (existing?.priceUzs && body.priceUzs != null && body.priceUzs < existing.priceUzs) {
    notifyWishlistPriceDrop({
      gameId:    params.id,
      gameTitle: game.title,
      gameSlug:  game.slug,
      oldPrice:  existing.priceUzs,
      newPrice:  body.priceUzs,
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, game });
}

// DELETE /api/admin/games/[id] — hard delete
export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    // Remove related keys first, then the game
    await prisma.$transaction([
      prisma.game_keys.deleteMany({ where: { gameId: params.id } }),
      prisma.games.delete({ where: { id: params.id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: 'Нельзя удалить — есть связанные заказы' },
      { status: 409 },
    );
  }
}
