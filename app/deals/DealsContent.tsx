'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Flame, Star, Monitor, Apple, Terminal, Package, Clock, Tag } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import WishlistButton from '@/components/ui/WishlistButton';
import type { DealItem } from '@/lib/db/deals';

type SortKey = 'discount' | 'price' | 'ending';

function useCountdown(endsAt: string | null) {
  const [ms, setMs] = useState<number | null>(() =>
    endsAt ? Math.max(0, new Date(endsAt).getTime() - Date.now()) : null
  );
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => setMs(Math.max(0, new Date(endsAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return ms;
}

function formatMs(ms: number): string {
  const s   = Math.floor(ms / 1000);
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

function PlatformDot({ p }: { p: string }) {
  if (p === 'Mac')   return <Apple    className="w-2.5 h-2.5" />;
  if (p === 'Linux') return <Terminal className="w-2.5 h-2.5" />;
  return <Monitor className="w-2.5 h-2.5" />;
}

function DealCard({ deal, index }: { deal: DealItem; index: number }) {
  const timeLeft = useCountdown(deal.endsAt);
  const inStock  = deal.game.stockStore > 0 || deal.game.deliveryType === 'MANUAL' || deal.game.deliveryType === 'DROPSHIP';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      className="group relative"
    >
      <Link href={`/games/${deal.game.slug}`}>
        <div
          className="relative overflow-hidden rounded-xl flex flex-col transition-all duration-300"
          style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'rgba(239,68,68,0.45)';
            el.style.boxShadow   = '0 0 30px rgba(239,68,68,0.15), 0 12px 40px rgba(0,0,0,0.55)';
            el.style.transform   = 'translateY(-4px)';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'rgba(255,255,255,0.07)';
            el.style.boxShadow   = 'none';
            el.style.transform   = 'translateY(0)';
          }}
        >
          {/* Cover */}
          <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
            {deal.game.cover ? (
              <Image
                src={deal.game.cover}
                alt={deal.game.title}
                fill unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(124,58,237,0.1))' }}>
                <Package style={{ width: '40px', height: '40px', color: 'rgba(255,255,255,0.15)' }} />
              </div>
            )}

            <div className="absolute inset-0 pointer-events-none"
                 style={{ background: 'linear-gradient(to bottom, transparent 45%, rgba(13,13,22,0.75) 85%, rgba(13,13,22,0.98) 100%)' }} />
            <div className="absolute inset-0 pointer-events-none"
                 style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)' }} />

            {/* Discount badge */}
            <div
              className="absolute top-2 left-2 font-pixel font-bold flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{
                fontSize: '10px', letterSpacing: '0.04em',
                background: 'linear-gradient(135deg, #DC2626, #EF4444)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(220,38,38,0.5)',
              }}
            >
              <Flame className="w-3 h-3" />
              -{deal.discountPct}%
            </div>

            {/* Featured badge */}
            {deal.isFeatured && (
              <div
                className="absolute top-2 right-10 font-pixel px-2 py-0.5 rounded"
                style={{ fontSize: '7px', letterSpacing: '0.08em', background: 'rgba(250,204,21,0.15)', color: '#FDE047', border: '1px solid rgba(250,204,21,0.3)' }}
              >
                ★ ХИТ
              </div>
            )}

            {/* Wishlist button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <WishlistButton gameId={deal.game.id} size="sm" />
            </div>

            {/* Out of stock */}
            {!inStock && (
              <div className="absolute bottom-8 left-2 font-pixel rounded px-2 py-0.5 text-white"
                   style={{ fontSize: '7px', background: 'rgba(107,114,128,0.9)', letterSpacing: '0.06em' }}>
                НЕТ В НАЛИЧИИ
              </div>
            )}

            {/* Platforms */}
            <div className="absolute bottom-2 left-2 flex gap-1">
              {deal.game.platforms.slice(0, 3).map(p => (
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
              {deal.game.title}
            </h3>

            {/* Meta row */}
            <div className="flex items-center gap-2">
              {deal.game.rating != null && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                  <span className="font-body text-[#9CA3AF]" style={{ fontSize: '11px' }}>
                    {deal.game.rating.toFixed(1)}
                  </span>
                </div>
              )}
              {deal.game.genres.slice(0, 1).map(g => (
                <span key={g} className="font-pixel rounded px-1.5 py-0.5"
                      style={{ fontSize: '7px', letterSpacing: '0.04em',
                               background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                               color: '#9D60FA' }}>
                  {g}
                </span>
              ))}
            </div>

            {/* Countdown timer */}
            {timeLeft != null && timeLeft > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                   style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <Clock className="w-3 h-3 text-red-400 flex-shrink-0" />
                <span className="font-pixel text-red-400" style={{ fontSize: '9px', letterSpacing: '0.05em' }}>
                  {formatMs(timeLeft)}
                </span>
                <span className="font-body text-[#6B7280]" style={{ fontSize: '9px' }}>осталось</span>
              </div>
            )}
            {timeLeft === 0 && (
              <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                   style={{ background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.2)' }}>
                <span className="font-pixel text-[#6B7280]" style={{ fontSize: '9px' }}>АКЦИЯ ЗАВЕРШЕНА</span>
              </div>
            )}

            {/* Prices */}
            <div className="mt-auto pt-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {deal.originalPrice != null && deal.discountedPrice != null ? (
                <>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-body line-through text-[#4B5563]" style={{ fontSize: '11px' }}>
                      {formatPrice(deal.originalPrice)}
                    </span>
                    {deal.savings != null && (
                      <span className="font-pixel rounded px-1.5 py-0.5"
                            style={{ fontSize: '8px', background: 'rgba(239,68,68,0.12)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
                        -{formatPrice(deal.savings)}
                      </span>
                    )}
                  </div>
                  <p className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>
                    {formatPrice(deal.discountedPrice)}
                  </p>
                </>
              ) : (
                <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>Цена не указана</p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function DealsContent({ deals }: { deals: DealItem[] }) {
  const [sort, setSort] = useState<SortKey>('discount');

  const sorted = useMemo(() => {
    return [...deals].sort((a, b) => {
      if (sort === 'discount') return b.discountPct - a.discountPct;
      if (sort === 'price') {
        return (a.discountedPrice ?? Infinity) - (b.discountedPrice ?? Infinity);
      }
      // ending: deals with endsAt first, soonest first
      if (!a.endsAt && !b.endsAt) return 0;
      if (!a.endsAt) return 1;
      if (!b.endsAt) return -1;
      return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
    });
  }, [deals, sort]);

  const SORTS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
    { key: 'discount', label: 'Скидка',           icon: <Flame   className="w-3 h-3" /> },
    { key: 'price',    label: 'Цена',              icon: <Tag     className="w-3 h-3" /> },
    { key: 'ending',   label: 'Заканчивается',     icon: <Clock   className="w-3 h-3" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Sort tabs */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        <span className="font-pixel text-[#4B5563] mr-2" style={{ fontSize: '8px', letterSpacing: '0.12em' }}>
          СОРТИРОВКА:
        </span>
        {SORTS.map(s => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className="flex items-center gap-1.5 font-heading font-semibold text-sm px-4 py-2 rounded-xl transition-all"
            style={{
              background: sort === s.key ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
              border:     sort === s.key ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.07)',
              color:      sort === s.key ? '#FCA5A5' : '#6B7280',
            }}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sorted.map((deal, i) => (
          <DealCard key={deal.id} deal={deal} index={i} />
        ))}
      </div>
    </div>
  );
}
