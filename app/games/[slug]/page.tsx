import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star, Calendar, Monitor, Package, Users,
  Zap, ArrowLeft, Tag, Apple, Terminal,
} from 'lucide-react';
import { getGameBySlug, getSimilarGames } from '@/lib/db/games';
import { formatPrice } from '@/lib/utils';
import GameCard from '@/components/catalog/GameCard';
import WishlistButton from '@/components/ui/WishlistButton';
import ReviewSection from '@/components/game/ReviewSection';
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

function PlatformIcon({ p }: { p: string }) {
  if (p === 'Mac')   return <Apple   className="w-3.5 h-3.5" />;
  if (p === 'Linux') return <Terminal className="w-3.5 h-3.5" />;
  return <Monitor className="w-3.5 h-3.5" />;
}

export default async function GamePage({ params }: Props) {
  const game = await getGameBySlug(params.slug);
  if (!game || !game.isActive) notFound();

  const similar = await getSimilarGames(game.slug, game.genres, 4);
  const isManual = game.deliveryType === 'MANUAL';
  const inStock  = game.stockStore > 0 || isManual;

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '96px' }}>
      {/* Blurred background */}
      {game.cover && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <Image
            src={game.cover} alt=""
            fill unoptimized
            className="object-cover blur-3xl scale-110"
            style={{ opacity: 0.05 }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(10,10,15,0.65) 0%, rgba(10,10,15,0.99) 55%)' }}
          />
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Back link */}
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 font-body text-sm mb-8 transition-colors hover:text-white"
          style={{ color: '#4B5563' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к каталогу
        </Link>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* ── Left: cover + price box ── */}
          <div className="flex-shrink-0 lg:w-72">
            {/* Cover */}
            <div
              className="relative rounded-2xl overflow-hidden mb-5 mx-auto lg:mx-0"
              style={{
                width: '100%', maxWidth: '288px',
                aspectRatio: '3/4',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 32px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.08)',
              }}
            >
              {game.cover ? (
                <Image src={game.cover} alt={game.title} fill unoptimized className="object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))' }}
                >
                  <Package style={{ width: '48px', height: '48px', color: 'rgba(255,255,255,0.15)' }} />
                </div>
              )}
            </div>

            {/* Price / buy box */}
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Stock */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{
                  background: isManual ? '#A78BFA' : inStock ? '#22C55E' : '#6B7280'
                }} />
                <span className="font-body text-sm" style={{
                  color: isManual ? '#A78BFA' : inStock ? '#22C55E' : '#6B7280'
                }}>
                  {isManual ? 'Ручная доставка' : inStock ? `В наличии · ${game.stockStore} шт.` : 'Нет в наличии'}
                </span>
              </div>

              {/* Price */}
              {game.priceUzs != null && (
                <div>
                  <p className="font-heading font-bold text-white" style={{ fontSize: '28px', lineHeight: 1 }}>
                    {formatPrice(game.priceUzs)}
                  </p>
                  {game.priceUsd != null && (
                    <p className="font-body mt-1" style={{ fontSize: '13px', color: '#4B5563' }}>
                      ≈ ${game.priceUsd.toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {/* Buy button */}
              {inStock ? (
                <Link
                  href={`/checkout?gameId=${game.id}`}
                  className="w-full py-3 rounded-xl font-heading font-bold text-white text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                    boxShadow: '0 0 24px rgba(124,58,237,0.35)',
                  }}
                >
                  Купить сейчас
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full py-3 rounded-xl font-heading font-bold text-sm cursor-not-allowed"
                  style={{
                    background: 'rgba(107,114,128,0.1)',
                    color: '#6B7280',
                    border: '1px solid rgba(107,114,128,0.2)',
                  }}
                >
                  Нет в наличии
                </button>
              )}

              {/* Delivery note */}
              <div className="flex items-center gap-2 pt-1">
                <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isManual ? '#A78BFA' : '#22C55E' }} />
                <span className="font-body" style={{ fontSize: '12px', color: '#4B5563' }}>
                  {isManual ? 'Доставка через поддержку после оплаты' : 'Мгновенная доставка ключа на email'}
                </span>
              </div>

              {/* Wishlist */}
              <div className="pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <WishlistButton gameId={game.id} size="md" className="w-full justify-center gap-2 rounded-xl py-2" />
              </div>
            </div>
          </div>

          {/* ── Right: details ── */}
          <div className="flex-1 min-w-0">
            {/* Genre pills */}
            {game.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {game.genres.map((g) => (
                  <Link
                    key={g}
                    href={`/catalog?genre=${encodeURIComponent(g)}`}
                    className="inline-flex items-center gap-1 font-pixel rounded transition-all hover:opacity-80"
                    style={{
                      fontSize: '7px', letterSpacing: '0.06em',
                      background: 'rgba(124,58,237,0.12)',
                      border: '1px solid rgba(124,58,237,0.25)',
                      color: '#9D60FA', padding: '4px 8px',
                    }}
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {g}
                  </Link>
                ))}
              </div>
            )}

            {/* Title */}
            <h1
              className="font-heading font-bold text-white mb-4"
              style={{ fontSize: 'clamp(24px, 4vw, 40px)', lineHeight: 1.15 }}
            >
              {game.title}
            </h1>

            {/* Meta strip */}
            <div
              className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6 pb-6"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              {game.rating != null && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                  <span className="font-heading font-semibold text-white">{game.rating.toFixed(1)}</span>
                  <span className="font-body text-sm" style={{ color: '#4B5563' }}>рейтинг</span>
                </div>
              )}
              {game.releaseDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" style={{ color: '#4B5563' }} />
                  <span className="font-body text-sm" style={{ color: '#6B7280' }}>
                    {new Date(game.releaseDate).getFullYear()}
                  </span>
                </div>
              )}
              {game.developer && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" style={{ color: '#4B5563' }} />
                  <span className="font-body text-sm" style={{ color: '#6B7280' }}>{game.developer}</span>
                </div>
              )}
            </div>

            {/* Platforms */}
            {game.platforms.length > 0 && (
              <div className="flex items-center gap-4 mb-6">
                {game.platforms.map((p) => (
                  <div key={p} className="flex items-center gap-1.5 font-body text-sm" style={{ color: '#6B7280' }}>
                    <PlatformIcon p={p} />
                    {p}
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            {game.description && (
              <div className="mb-8">
                <h2
                  className="font-heading font-bold text-white mb-3"
                  style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)' }}
                >
                  ОБ ИГРЕ
                </h2>
                <p
                  className="font-body text-sm leading-relaxed"
                  style={{ color: '#9CA3AF', whiteSpace: 'pre-line' }}
                >
                  {game.description}
                </p>
              </div>
            )}

            {/* Screenshots */}
            {game.screenshots.length > 0 && (
              <div className="mb-8">
                <h2
                  className="font-heading font-bold mb-3"
                  style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)' }}
                >
                  СКРИНШОТЫ
                </h2>
                <div
                  className="flex gap-3 overflow-x-auto pb-2"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {game.screenshots.slice(0, 8).map((src, i) => (
                    <div
                      key={i}
                      className="relative flex-shrink-0 rounded-xl overflow-hidden transition-transform duration-200 hover:scale-[1.02]"
                      style={{
                        width: '240px', aspectRatio: '16/9',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <Image
                        src={src}
                        alt={`${game.title} screenshot ${i + 1}`}
                        fill unoptimized
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional info */}
            {(game.publisher || game.source) && (
              <div
                className="rounded-xl p-4 grid grid-cols-2 gap-3"
                style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {game.developer && (
                  <div>
                    <p className="font-pixel mb-1" style={{ fontSize: '7px', color: '#4B5563', letterSpacing: '0.1em' }}>РАЗРАБОТЧИК</p>
                    <p className="font-body text-sm text-white">{game.developer}</p>
                  </div>
                )}
                {game.publisher && (
                  <div>
                    <p className="font-pixel mb-1" style={{ fontSize: '7px', color: '#4B5563', letterSpacing: '0.1em' }}>ИЗДАТЕЛЬ</p>
                    <p className="font-body text-sm text-white">{game.publisher}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <ReviewSection slug={game.slug} />

        {/* Similar games */}
        {similar.length > 0 && (
          <div className="mt-16 pt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-xl text-white">Похожие игры</h2>
              <Link
                href="/catalog"
                className="font-body text-sm transition-colors hover:text-white"
                style={{ color: '#6B7280' }}
              >
                Весь каталог →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {similar.map((g, i) => <GameCard key={g.id} game={g} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
