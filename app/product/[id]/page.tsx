import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { products as mockProducts } from '@/lib/mockData';
import ProductPageClient from './ProductPageClient';

const BASE = 'https://arcane.com.uz';

async function getProduct(id: string) {
  try {
    const game = await prisma.games.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { externalId: id }],
        isActive: true,
      },
      select: {
        title: true, description: true, cover: true,
        genres: true, platforms: true, priceUzs: true,
        developer: true, rating: true,
      },
    });
    if (game) return game;
  } catch { /* fallback to mock */ }

  const mock = mockProducts.find(p => p.id === id);
  if (!mock) return null;
  return {
    title:       mock.title,
    description: mock.description ?? null,
    cover:       mock.image ?? null,
    genres:      mock.genres ?? [],
    platforms:   mock.platform ?? [],
    priceUzs:    mock.price ?? null,
    developer:   mock.developer ?? null,
    rating:      mock.rating ?? null,
  };
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const product = await getProduct(params.id);

  if (!product) {
    return {
      title:       'Игра не найдена — ARCANE.UZ',
      description: 'Страница игры не найдена',
    };
  }

  const title       = `${product.title} — купить ключ | ARCANE.UZ`;
  const description = product.description
    ? product.description.slice(0, 155).replace(/\n/g, ' ')
    : `Купить ${product.title} по лучшей цене в Узбекистане. Мгновенная доставка ключа.`;

  const price = product.priceUzs
    ? `${product.priceUzs.toLocaleString('ru')} сум`
    : undefined;

  const platformStr = (product.platforms as string[]).join(', ');
  const url = `${BASE}/product/${params.id}`;

  return {
    title,
    description,
    keywords: [
      product.title,
      ...(product.genres as string[]),
      ...(product.platforms as string[]),
      'купить', 'ключ', 'Узбекистан', 'arcane uz',
    ],
    openGraph: {
      title,
      description,
      url,
      type:     'website',
      siteName: 'ARCANE.UZ',
      ...(product.cover ? {
        images: [{
          url:    product.cover,
          width:  460,
          height: 215,
          alt:    product.title,
        }],
      } : {}),
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      ...(product.cover ? { images: [product.cover] } : {}),
    },
    other: {
      ...(price          ? { 'product:price:amount':   price          } : {}),
      ...(price          ? { 'product:price:currency': 'UZS'          } : {}),
      ...(platformStr    ? { 'product:availability':   'in stock'     } : {}),
    },
  };
}

export default function ProductPage({ params }: { params: { id: string } }) {
  return <ProductPageClient params={params} />;
}
