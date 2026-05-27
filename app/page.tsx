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

/* ── Data helpers ── */

async function getGenreCounts() {
  const rows = await prisma.games.findMany({
    where:  { isActive: true },
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

export default async function HomePage() {
  const [{ games: trending }, genres, deals, reviewsRaw] = await Promise.all([
    getGames({ sort: 'popular', limit: 6 }),
    getGenreCounts(),
    getDeals(),
    getHomeReviews(),
  ]);

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
      <Categories genres={genres} />
      {trending.length > 0 && <TrendingProducts games={trending} />}
      <MysteryCases />
      {dealItems.length > 0 && <DailyDeals deals={dealItems} endTime={dealsEndTime} />}
      <ArcaneCoins />
      <TelegramSupport />
      {reviews.length > 0 && <Reviews reviews={reviews} />}
    </>
  );
}
