import { notFound } from 'next/navigation';
import { getGameBySlug, getSimilarGames } from '@/lib/db/games';
import GameDetailClient from '@/components/game/GameDetailClient';
import type { Metadata } from 'next';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const game = await getGameBySlug(params.slug);
  if (!game) return { title: 'Игра не найдена | Arcane' };
  return {
    title: `${game.title} — купить ключ | Arcane`,
    description: game.description?.slice(0, 155) ?? `Купить ${game.title} по лучшей цене в Arcane`,
    openGraph: {
      title: game.title,
      description: game.description?.slice(0, 155) ?? '',
      images: game.cover ? [{ url: game.cover }] : [],
    },
  };
}

export default async function GamePage({ params }: Props) {
  const game = await getGameBySlug(params.slug);
  if (!game || !game.isActive) notFound();

  const similar = await getSimilarGames(game.slug, game.genres, 4);

  return <GameDetailClient game={game} similar={similar} />;
}
