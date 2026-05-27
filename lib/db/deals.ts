import { prisma } from '@/lib/prisma';

export interface DealItem {
  id:             string;
  type:           string;
  discountPct:    number;
  startsAt:       string | null;
  endsAt:         string | null;
  isFeatured:     boolean;
  game: {
    id:           string;
    title:        string;
    slug:         string;
    cover:        string | null;
    genres:       string[];
    platforms:    string[];
    rating:       number | null;
    priceUzs:     number | null;
    stockStore:   number;
    deliveryType: string;
  };
  originalPrice:   number | null;
  discountedPrice: number | null;
  savings:         number | null;
}

export async function getActiveDeals(): Promise<DealItem[]> {
  const now = new Date();

  const rows = await prisma.discounts.findMany({
    where: {
      isActive: true,
      games:    { isActive: true },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt:   null }, { endsAt:   { gte: now } }] },
      ],
    },
    orderBy: [
      { isFeatured: 'desc' },
      { discountPct: 'desc' },
    ],
    select: {
      id: true, type: true, discountPct: true,
      startsAt: true, endsAt: true, isFeatured: true,
      games: {
        select: {
          id: true, title: true, slug: true, cover: true,
          genres: true, platforms: true, rating: true,
          priceUzs: true, stockStore: true, deliveryType: true,
        },
      },
    },
  });

  return rows.map(r => {
    const orig      = r.games.priceUzs;
    const discounted = orig != null ? Math.round(orig * (1 - r.discountPct / 100)) : null;
    return {
      id:          r.id,
      type:        r.type,
      discountPct: r.discountPct,
      startsAt:    r.startsAt?.toISOString() ?? null,
      endsAt:      r.endsAt?.toISOString() ?? null,
      isFeatured:  r.isFeatured,
      game: {
        id:           r.games.id,
        title:        r.games.title,
        slug:         r.games.slug,
        cover:        r.games.cover,
        genres:       r.games.genres,
        platforms:    r.games.platforms,
        rating:       r.games.rating,
        priceUzs:     r.games.priceUzs,
        stockStore:   r.games.stockStore,
        deliveryType: r.games.deliveryType,
      },
      originalPrice:   orig,
      discountedPrice: discounted,
      savings:         orig != null && discounted != null ? orig - discounted : null,
    };
  });
}
