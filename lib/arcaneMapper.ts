// Converts an ArcaneGame (from arcane-api backend) into the storefront Product
// shape used by ProductCard, CatalogPage, and product detail pages.

import type { ArcaneGame } from './arcaneApi';
import type { Product }    from './types';

const USD_TO_UZS = parseInt(process.env.NEXT_PUBLIC_USD_TO_UZS ?? '12700', 10);

export function arcaneGameToProduct(g: ArcaneGame): Product {
  const priceUzs =
    g.priceUzs ??
    (g.priceUsd != null ? Math.round((g.priceUsd * USD_TO_UZS) / 1000) * 1000 : 299_000);

  const trailerRaw  = g.screenshots.find(s => s.startsWith('video:') || s.startsWith('youtube:'));
  const screenshots = g.screenshots.filter(s => !s.startsWith('video:') && !s.startsWith('youtube:'));
  const trailerUrl  = trailerRaw?.startsWith('video:')
    ? trailerRaw.slice(6)
    : trailerRaw?.startsWith('youtube:')
      ? `https://www.youtube.com/embed/${trailerRaw.slice(8)}?autoplay=1&mute=1`
      : undefined;

  return {
    id:          g.id,
    title:       g.title,
    subtitle:    g.genres.slice(0, 2).join(' · ') || 'Game',
    description: g.description ?? '',
    price:       priceUzs,
    originalPrice: undefined,
    discount:    0,
    rating:      g.rating ? Math.round(g.rating) / 10 : 7.5,   // normalize 0-100 → 0-10
    reviewCount: 0,
    image:       g.cover  ?? 'https://picsum.photos/seed/arcane/400/600',
    screenshots,
    trailer:     trailerUrl,
    platform:    g.platforms.length > 0 ? g.platforms : ['PC'],
    category:    g.genres[0] ?? 'Action',
    tags:        g.genres,
    badge:       g.stockStore + g.stockDrop > 0 ? 'IN STOCK' : undefined,
    isNew:       !g.syncedAt || (Date.now() - new Date(g.createdAt).getTime()) < 7 * 86400_000,
    isTrending:  (g.rating ?? 0) >= 85,
    inStock:     g.stockStore + g.stockDrop > 0,
    preorder:    false,
    deliveryType: 'instant' as const,
    releaseDate:  g.releaseDate ?? undefined,
    developer:    g.developer   ?? undefined,
    publisher:    g.publisher   ?? undefined,
    reviews:      0,
    features:     [],
    digiGoodId:   undefined,
    // arcane-specific fields preserved via metadata
    _arcane: {
      stockStore: g.stockStore,
      stockDrop:  g.stockDrop,
      source:     g.source,
      slug:       g.slug,
    },
  } as unknown as Product & { _arcane: unknown };
}

export function arcaneGamesToProducts(games: ArcaneGame[]): Product[] {
  return games.filter(g => g.isActive).map(arcaneGameToProduct);
}
