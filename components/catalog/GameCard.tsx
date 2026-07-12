'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Zap, Package, Monitor, Apple, Terminal } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { GameListItem } from '@/lib/db/games';
import WishlistButton from '@/components/ui/WishlistButton';
import { useDict } from '@/lib/locale/client';

function PlatformDot({ p }: { p: string }) {
  if (p === 'Mac')   return <Apple   className="w-2.5 h-2.5" />;
  if (p === 'Linux') return <Terminal className="w-2.5 h-2.5" />;
  return <Monitor className="w-2.5 h-2.5" />;
}

interface Props { game: GameListItem; index?: number }

export default function GameCard({ game, index = 0 }: Props) {
  const cc = useDict().catalog.card;
  const inStock = game.stockStore > 0 || game.deliveryType === 'MANUAL' || game.deliveryType === 'DROPSHIP';
  // games.productType isn't kept in sync once a game has variants (only
  // priceUzs/dropshipExternalId are — see lib/db/gameVariants.ts) — the
  // badge has to look at the same cheapest variant the price already
  // reflects, or they'd show mismatched type/price like Terraria did.
  const cheapestVariant = game.variants.length
    ? [...game.variants].sort((a, b) => a.priceUzs - b.priceUzs)[0]
    : undefined;
  const cardProductType = cheapestVariant?.productType ?? game.productType;
  const formatLabel = cardProductType === 'ACCOUNT' ? cc.account : cardProductType === 'GIFT' ? cc.gift : cc.key;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.055, ease: 'easeOut' }}
      className="group relative"
    >
      <Link href={`/games/${game.slug}`}>
        <div
          className="relative overflow-hidden rounded-xl flex flex-col transition-all duration-300"
          style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'rgba(124,58,237,0.45)';
            el.style.boxShadow   = '0 0 30px rgba(124,58,237,0.18), 0 12px 40px rgba(0,0,0,0.55)';
            el.style.transform   = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'rgba(255,255,255,0.07)';
            el.style.boxShadow   = 'none';
            el.style.transform   = 'translateY(0)';
          }}
        >
          {/* Cover */}
          <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
            {game.cover ? (
              <Image
                src={game.cover}
                alt={game.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))' }}>
                <Package style={{ width: '40px', height: '40px', color: 'rgba(255,255,255,0.15)' }} />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 pointer-events-none"
                 style={{ background: 'linear-gradient(to bottom, transparent 45%, rgba(13,13,22,0.75) 85%, rgba(13,13,22,0.98) 100%)' }} />

            {/* Scanline */}
            <div className="absolute inset-0 pointer-events-none"
                 style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)' }} />

            {/* Stock badge */}
            {!inStock && (
              <div className="absolute top-2 left-2 font-pixel rounded px-2 py-0.5 text-white"
                   style={{ fontSize: '7px', background: 'rgba(107,114,128,0.9)', letterSpacing: '0.06em' }}>
                НЕТ В НАЛИЧИИ
              </div>
            )}

            {/* Wishlist button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <WishlistButton gameId={game.id} size="sm" />
            </div>

            {/* Platforms overlay */}
            <div className="absolute bottom-2 left-2 flex gap-1">
              {(game.platforms ?? []).slice(0, 3).map((p) => (
                <span key={p} className="flex items-center gap-0.5 text-gray-400 rounded px-1.5 py-0.5"
                      style={{ fontSize: '8px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <PlatformDot p={p} />
                </span>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="p-3 flex flex-col gap-2">
            <h3 className="font-heading font-bold text-white line-clamp-2 leading-snug"
                style={{ fontSize: '13.5px' }}>
              {game.title}
            </h3>

            {/* Meta row */}
            <div className="flex items-center gap-2">
              {game.rating != null && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                  <span className="font-body text-[#9CA3AF]" style={{ fontSize: '11px' }}>
                    {game.rating.toFixed(1)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Zap style={{ width: '10px', height: '10px', color: '#22C55E' }} />
                <span className="font-body text-[#22C55E]" style={{ fontSize: '10px' }}>{formatLabel}</span>
              </div>
            </div>

            {/* Genres */}
            {(game.genres?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1">
                {(game.genres ?? []).slice(0, 2).map((g) => (
                  <span key={g} className="font-pixel rounded px-1.5 py-0.5"
                        style={{ fontSize: '7px', letterSpacing: '0.04em',
                                 background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                                 color: '#9D60FA' }}>
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Price */}
            <div className="flex items-center justify-between mt-auto pt-1"
                 style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                {game.priceUzs != null ? (
                  <p className="font-heading font-bold text-white" style={{ fontSize: '14px' }}>
                    {formatPrice(game.priceUzs)}
                  </p>
                ) : (
                  <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>{cc.noPrice}</p>
                )}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="font-heading font-semibold text-white rounded-lg px-3 py-1.5 text-xs"
                     style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                              boxShadow: '0 0 12px rgba(124,58,237,0.4)' }}>
                  Купить
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
