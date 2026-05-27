import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

const BASE = 'https://arcane.com.uz';

export async function generateMetadata(
  { params }: { params: { id: string } },
): Promise<Metadata> {
  const game = await prisma.games.findFirst({
    where: {
      OR: [{ slug: params.id }, { id: params.id }],
      isActive: true,
    },
    select: {
      title: true, description: true, cover: true,
      priceUzs: true, slug: true,
    },
  }).catch(() => null);

  if (!game) {
    return {
      title: 'Игра не найдена — ARCANE.UZ',
    };
  }

  const desc = game.description
    ? game.description.slice(0, 160)
    : `Купить ${game.title} в Узбекистане по лучшей цене. Мгновенная доставка ключа активации.`;

  return {
    title:       `${game.title} — купить со скидкой | ARCANE.UZ`,
    description: desc,
    openGraph: {
      title:       `${game.title} | ARCANE.UZ`,
      description: desc,
      url:         `${BASE}/product/${game.slug ?? params.id}`,
      siteName:    'ARCANE.UZ',
      images:      game.cover ? [{ url: game.cover, width: 460, height: 215, alt: game.title }] : [],
      type:        'website',
    },
    twitter: {
      card:        'summary_large_image',
      title:       `${game.title} | ARCANE.UZ`,
      description: desc,
      images:      game.cover ? [game.cover] : [],
    },
    alternates: {
      canonical: `${BASE}/product/${game.slug ?? params.id}`,
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
