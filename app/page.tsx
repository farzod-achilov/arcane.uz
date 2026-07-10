import { prisma } from '@/lib/prisma';
import { getGames } from '@/lib/db/games';

export const dynamic = 'force-dynamic';
import Hero from '@/components/home/Hero';
import Categories from '@/components/home/Categories';
import TrendingProducts from '@/components/home/TrendingProducts';
import MysteryCases from '@/components/home/MysteryCases';
import DailyDeals from '@/components/home/DailyDeals';
import ArcaneCoins from '@/components/home/ArcaneCoins';
import TelegramSupport from '@/components/home/TelegramSupport';
import Reviews from '@/components/home/Reviews';
import RecentlyViewed from '@/components/home/RecentlyViewed';
import FlashSale, { type FlashDeal } from '@/components/home/FlashSale';
import PromoBanner, { type Banner } from '@/components/home/PromoBanner';
import NewArrivals from '@/components/home/NewArrivals';
import TopRated from '@/components/home/TopRated';

/* ── Data helpers ── */

async function getGenreCounts() {
  const rows = await prisma.games.findMany({
    where:  { isActive: true, priceUzs: { gt: 0 } },
    select: { genres: true },
  });
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const g of row.genres) {
      counts.set(g, (counts.get(g) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

async function getDeals() {
  const now = new Date();
  return prisma.discounts.findMany({
    where: {
      isActive: true,
      games:    { priceUzs: { gt: 0 } },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    include: {
      games: {
        select: {
          id: true, title: true, slug: true, cover: true,
          priceUzs: true, rating: true, platforms: true,
        },
      },
    },
    orderBy: { discountPct: 'desc' },
    take: 4,
  });
}

async function getFlashDeals(): Promise<{ deals: FlashDeal[]; endTime: number }> {
  const now = new Date();
  const rows = await prisma.discounts.findMany({
    where: {
      isActive:   true,
      isFeatured: true,
      type:       'flash',
      games:      { priceUzs: { gt: 0 } },
      endsAt:     { gt: now },
    },
    include: {
      games: {
        select: {
          id: true, title: true, slug: true, cover: true,
          priceUzs: true, rating: true, genres: true,
        },
      },
    },
    orderBy: { discountPct: 'desc' },
    take: 4,
  });

  const deals: FlashDeal[] = rows.map(d => ({
    gameId:          d.games.id,
    title:           d.games.title,
    slug:            d.games.slug,
    cover:           d.games.cover,
    priceUzs:        d.games.priceUzs ?? 0,
    discountedPrice: Math.round((d.games.priceUzs ?? 0) * (1 - d.discountPct / 100) / 1000) * 1000,
    discountPct:     d.discountPct,
    rating:          d.games.rating,
    genres:          d.games.genres,
    endsAt:          d.endsAt!.getTime(),
  }));

  const endTime = deals.reduce((min, d) => Math.min(min, d.endsAt), Infinity);

  return { deals, endTime: isFinite(endTime) ? endTime : Date.now() + 3_600_000 };
}

async function getHomeReviews() {
  return prisma.reviews.findMany({
    where: { isApproved: true, rating: { gte: 4 }, body: { not: null } },
    include: {
      user: { select: { username: true, avatar: true } },
      game: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });
}

async function getBanners(): Promise<Banner[]> {
  try {
    return await prisma.banners.findMany({
      where:   { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: { id: true, title: true, subtitle: true, buttonText: true,
                buttonLink: true, imageUrl: true, badgeText: true, colorFrom: true, colorTo: true },
    });
  } catch { return []; }
}

export default async function HomePage() {
  const [gamesResult, newGamesResult, topRatedResult, genres, deals, flashData, reviewsRaw, banners] = await Promise.all([
    getGames({ sort: 'popular', limit: 6 }).catch(() => ({ games: [] as NonNullable<Awaited<ReturnType<typeof getGames>>['games']> })),
    getGames({ sort: 'newest',  limit: 6 }).catch(() => ({ games: [] as NonNullable<Awaited<ReturnType<typeof getGames>>['games']> })),
    getGames({ sort: 'rating',  limit: 6 }).catch(() => ({ games: [] as NonNullable<Awaited<ReturnType<typeof getGames>>['games']> })),
    getGenreCounts().catch(() => []),
    getDeals().catch(() => []),
    getFlashDeals().catch(() => ({ deals: [], endTime: Date.now() + 3_600_000 })),
    getHomeReviews().catch(() => []),
    getBanners(),
  ]);
  const trending    = gamesResult.games;
  const newArrivals = newGamesResult.games;
  const topRated    = topRatedResult.games;

  const dealItems = deals.map(d => ({
    gameId:          d.games.id,
    title:           d.games.title,
    slug:            d.games.slug,
    cover:           d.games.cover,
    priceUzs:        d.games.priceUzs ?? 0,
    discountedPrice: Math.round((d.games.priceUzs ?? 0) * (1 - d.discountPct / 100) / 1000) * 1000,
    discountPct:     d.discountPct,
    rating:          d.games.rating,
    platforms:       d.games.platforms,
    endsAt:          d.endsAt?.getTime() ?? null,
  }));

  /* Pick the nearest endsAt among deals, fall back to 7 h from now */
  const dealsEndTime = dealItems.reduce<number | null>((min, d) => {
    if (!d.endsAt) return min;
    return min === null ? d.endsAt : Math.min(min, d.endsAt);
  }, null) ?? (Date.now() + 7 * 3_600_000);

  const reviews = reviewsRaw.map(r => ({
    id:        r.id,
    rating:    r.rating,
    body:      r.body ?? '',
    author:    r.user?.username ?? r.authorName ?? 'Покупатель',
    avatar:    r.user?.avatar   ?? null,
    gameTitle: r.game?.title    ?? '',
    verified:  !!r.userId,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <>
      <Hero />
      {banners.length > 0 && <PromoBanner banners={banners} />}
      <Categories genres={genres} />
      {trending.length > 0 && <TrendingProducts games={trending} />}
      {newArrivals.length > 0 && <NewArrivals games={newArrivals} />}
      {topRated.length > 0 && <TopRated games={topRated} />}
      <MysteryCases />
      {dealItems.length > 0 && <DailyDeals deals={dealItems} endTime={dealsEndTime} />}
      {flashData.deals.length > 0 && <FlashSale deals={flashData.deals} endTime={flashData.endTime} />}
      <RecentlyViewed />
      <ArcaneCoins />
      <TelegramSupport />
      {reviews.length > 0 && <Reviews reviews={reviews} />}
    </>
  );
}
