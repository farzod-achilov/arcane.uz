'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Zap, Package } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { GameListItem } from '@/lib/db/games';
import { useDict } from '@/lib/locale/client';

interface Props { game: GameListItem }

export default function GameListCard({ game }: Props) {
  const cc = useDict().catalog.card;
  const inStock = game.stockStore > 0 || game.deliveryType === 'MANUAL' || game.deliveryType === 'DROPSHIP';

  return (
    <Link
      href={`/games/${game.slug}`}
      className="group flex gap-4 rounded-xl p-3.5 transition-all duration-300 block"
      style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)' }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'rgba(124,58,237,0.35)';
        el.style.boxShadow   = '0 0 24px rgba(124,58,237,0.1), 0 8px 32px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'rgba(255,255,255,0.06)';
        el.style.boxShadow   = 'none';
      }}
    >
      {/* Cover */}
      <div className="relative w-20 h-[104px] rounded-xl overflow-hidden flex-shrink-0">
        {game.cover ? (
          <Image src={game.cover} alt={game.title} fill unoptimized
                 className="object-cover transition-transform duration-400 group-hover:scale-[1.06]"
                 style={{ objectPosition: 'top center' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))' }}>
            <Package style={{ width: '24px', height: '24px', color: 'rgba(255,255,255,0.2)' }} />
          </div>
        )}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(13,13,22,0.5) 100%)' }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {game.developer && (
              <p className="font-body mb-0.5 truncate" style={{ fontSize: '11px', color: '#374151' }}>
                {game.developer}
              </p>
            )}
            <h3 className="font-heading font-bold text-white mb-1.5 line-clamp-1" style={{ fontSize: '14.5px' }}>
              {game.title}
            </h3>

            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {game.rating != null && (
                <>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B] flex-shrink-0" />
                    <span className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>
                      {game.rating.toFixed(1)}
                    </span>
                  </div>
                  <span style={{ color: '#1F2937', fontSize: '10px' }}>·</span>
                </>
              )}
              <div className="flex items-center gap-1">
                <Zap style={{ width: '10px', height: '10px', color: '#22C55E', flexShrink: 0 }} />
                <span className="font-body text-[#22C55E]" style={{ fontSize: '10.5px' }}>{cc.instant}</span>
              </div>
              {!inStock && (
                <>
                  <span style={{ color: '#1F2937', fontSize: '10px' }}>·</span>
                  <span className="font-body text-[#6B7280]" style={{ fontSize: '10.5px' }}>{cc.outOfStock}</span>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              {game.genres.slice(0, 3).map((g) => (
                <span key={g} className="font-pixel rounded"
                      style={{ fontSize: '7px', letterSpacing: '0.04em',
                               background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.18)',
                               color: '#9D60FA', padding: '2px 6px', borderRadius: '4px' }}>
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Price + button */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="text-right">
              {game.priceUzs != null ? (
                <p className="font-heading font-bold text-white" style={{ fontSize: '16px', lineHeight: 1 }}>
                  {formatPrice(game.priceUzs)}
                </p>
              ) : (
                <p className="font-body text-[#4B5563]" style={{ fontSize: '13px' }}>—</p>
              )}
            </div>
            <div className="font-heading font-semibold text-white rounded-lg px-3 py-1.5"
                 style={{ fontSize: '11.5px',
                          background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                          boxShadow: '0 0 0 1px rgba(124,58,237,0.3)' }}>
              Купить
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
