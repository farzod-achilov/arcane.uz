import Hero from '@/components/home/Hero';
import Categories from '@/components/home/Categories';
import TrendingProducts from '@/components/home/TrendingProducts';
import MysteryCases from '@/components/home/MysteryCases';
import DailyDeals from '@/components/home/DailyDeals';
import ArcaneCoins from '@/components/home/ArcaneCoins';
import TelegramSupport from '@/components/home/TelegramSupport';
import Reviews from '@/components/home/Reviews';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Categories />
      <TrendingProducts />
      <MysteryCases />
      <DailyDeals />
      <ArcaneCoins />
      <TelegramSupport />
      <Reviews />
    </>
  );
}
