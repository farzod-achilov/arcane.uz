import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q            = searchParams.get('q')            ?? '';
  const status       = searchParams.get('status')       ?? 'ALL';   // ALL | ACTIVE | HIDDEN
  const delivery     = searchParams.get('delivery')     ?? 'ALL';   // ALL | AUTO | MANUAL | DROPSHIP
  const stock        = searchParams.get('stock')        ?? 'ALL';   // ALL | IN | OUT
  const steam        = searchParams.get('steam')        ?? 'ALL';   // ALL | SET | MISSING — game_pricing.steamPriceUsd
  const sortBy       = searchParams.get('sortBy')       ?? 'createdAt';
  const sortDir      = searchParams.get('sortDir')      === 'asc' ? 'asc' : 'desc';
  const page         = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  // Default 20 matches /admin/products' own paged UI (page controls, "N игр");
  // /admin/keys instead wants the whole catalog in one shot for client-side
  // filtering (no pagination there) and passes ?limit=200 — which this route
  // silently ignored entirely, always returning page 1 of 20 regardless.
  const limit        = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AND: any[] = [];
  if (q) {
    AND.push({
      OR: [
        { title:     { contains: q, mode: 'insensitive' } },
        { developer: { contains: q, mode: 'insensitive' } },
      ],
    });
  }
  // "MISSING" covers both no game_pricing row at all and a row with a null
  // steamPriceUsd — both mean the storefront has nothing to compare against.
  if (steam === 'SET')     AND.push({ game_pricing: { steamPriceUsd: { not: null } } });
  if (steam === 'MISSING') AND.push({ OR: [{ game_pricing: null }, { game_pricing: { steamPriceUsd: null } }] });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = AND.length ? { AND } : {};
  if (status   === 'ACTIVE') where.isActive     = true;
  if (status   === 'HIDDEN') where.isActive     = false;
  if (delivery === 'AUTO')     where.deliveryType = 'AUTO';
  if (delivery === 'MANUAL')   where.deliveryType = 'MANUAL';
  if (delivery === 'DROPSHIP') where.deliveryType = 'DROPSHIP';
  if (stock    === 'IN')     where.stockStore   = { gt: 0 };
  if (stock    === 'OUT')    where.stockStore   = 0;

  const orderBy = sortBy === 'priceUzs'    ? { priceUzs:   sortDir as 'asc'|'desc' }
                : sortBy === 'stockStore'  ? { stockStore:  sortDir as 'asc'|'desc' }
                :                           { createdAt:    sortDir as 'asc'|'desc' };

  const [games, total] = await Promise.all([
    prisma.games.findMany({
      where,
      select: {
        id: true, title: true, slug: true, cover: true,
        genres: true, platforms: true, developer: true,
        priceUzs: true, priceUsd: true,
        isActive: true, stockStore: true, stockDrop: true, deliveryType: true,
        createdAt: true,
        game_pricing: { select: { steamPriceUsd: true } },
        _count: { select: { order_items: true, game_keys: true } },
      },
      orderBy,
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.games.count({ where }),
  ]);

  return NextResponse.json({ games, total, pages: Math.ceil(total / limit) });
}
