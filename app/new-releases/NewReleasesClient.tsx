'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Star, Zap, Package, Calendar, ArrowLeft, Monitor, Apple, Terminal } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import WishlistButton from '@/components/ui/WishlistButton';
import type { NewGame } from './page';

type Filter = '7d' | '30d';

function PlatformDot({ p }: { p: string }) {
  if (p === 'Mac')   return <Apple    className="w-2.5 h-2.5" />;
  if (p === 'Linux') return <Terminal className="w-2.5 h-2.5" />;
  return <Monitor className="w-2.5 h-2.5" />;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Вчера';
  return `${days} дн. назад`;
}

function NewBadge({ isNew7 }: { isNew7: boolean }) {
  return (
    <span
      className="font-pixel rounded text-white"
      style={{
        fontSize: '7px',
        letterSpacing: '0.06em',
        padding: '2px 6px',
        background: isNew7
          ? 'linear-gradient(135deg, #7C3AED, #06B6D4)'
          : 'rgba(6,182,212,0.2)',
        border: isNew7 ? 'none' : '1px solid rgba(6,182,212,0.35)',
        color: isNew7 ? '#fff' : '#22D3EE',
        boxShadow: isNew7 ? '0 0 10px rgba(124,58,237,0.5)' : 'none',
      }}
    >
      {isNew7 ? '✦ NEW' : 'NEW'}
    </span>
  );
}

function GameCard({ game, index }: { game: NewGame; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 12) * 0.04, ease: 'easeOut' }}
      className="group relative"
    >
      <Link href={`/games/${game.slug}`}>
        <div
          className="relative overflow-hidden rounded-xl flex flex-col transition-all duration-300"
          style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'rgba(124,58,237,0.45)';
            el.style.boxShadow   = '0 0 30px rgba(124,58,237,0.15), 0 12px 40px rgba(0,0,0,0.5)';
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
            {game.cover ? (
              <Image
                src={game.cover}
                alt={game.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))' }}>
                <Package style={{ width: '36px', height: '36px', color: 'rgba(255,255,255,0.15)' }} />
              </div>
            )}

            <div className="absolute inset-0 pointer-events-none"
                 style={{ background: 'linear-gradient(to bottom, transparent 45%, rgba(13,13,22,0.75) 85%, rgba(13,13,22,0.98) 100%)' }} />

            {/* NEW badge */}
            <div className="absolute top-2.5 left-2.5">
              <NewBadge isNew7={game.isNew7} />
            </div>

            {/* Wishlist */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <WishlistButton gameId={game.id} size="sm" />
            </div>

            {/* Platforms */}
            <div className="absolute bottom-2 left-2 flex gap-1">
              {game.platforms.slice(0, 3).map(p => (
                <span key={p} className="flex items-center gap-0.5 text-gray-400 rounded px-1.5 py-0.5"
                      style={{ fontSize: '8px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <PlatformDot p={p} />
                </span>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="p-3 flex flex-col gap-2">
            <h3 className="font-heading font-bold text-white line-clamp-2 leading-snug" style={{ fontSize: '13.5px' }}>
              {game.title}
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {game.rating != null && (
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                    <span className="font-body text-[#9CA3AF]" style={{ fontSize: '11px' }}>
                      {game.rating.toFixed(1)}
                    </span>
                  </div>
                )}
                {game.deliveryType === 'AUTO' && (
                  <div className="flex items-center gap-0.5">
                    <Zap style={{ width: '10px', height: '10px', color: '#22C55E' }} />
                    <span className="font-body text-[#22C55E]" style={{ fontSize: '10px' }}>Авто</span>
                  </div>
                )}
              </div>
              <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
                {timeAgo(game.createdAt)}
              </span>
            </div>

            {/* Genres */}
            {game.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {game.genres.slice(0, 2).map(g => (
                  <span key={g} className="font-pixel rounded px-1.5 py-0.5"
                        style={{ fontSize: '7px', background: 'rgba(124,58,237,0.1)',
                                 border: '1px solid rgba(124,58,237,0.2)', color: '#9D60FA' }}>
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
                  <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>Цена не указана</p>
                )}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="font-heading font-semibold text-white rounded-lg px-3 py-1.5 text-xs"
                     style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 0 12px rgba(124,58,237,0.4)' }}>
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

export default function NewReleasesClient({ games }: { games: NewGame[] }) {
  const [filter, setFilter] = useState<Filter>('30d');

  const visible = filter === '7d' ? games.filter(g => g.isNew7) : games;
  const new7Count  = games.filter(g => g.isNew7).length;

  return (
    <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(6,182,212,1) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,1) 1px,transparent 1px)',
             backgroundSize: '52px 52px', opacity: 0.012,
           }} />
      <div className="fixed top-0 left-0 right-0 h-px pointer-events-none"
           style={{ background: 'linear-gradient(90deg,transparent 5%,rgba(124,58,237,0.4) 40%,rgba(6,182,212,0.5) 65%,transparent 95%)' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Breadcrumb */}
        <Link href="/"
              className="inline-flex items-center gap-2 font-body text-[#4B5563] hover:text-[#9CA3AF] mb-6 transition-colors"
              style={{ fontSize: '13px' }}>
          <ArrowLeft style={{ width: '14px', height: '14px' }} />
          На главную
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4"
               style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)' }}>
            <Sparkles style={{ width: '13px', height: '13px', color: '#06B6D4' }} />
            <span className="font-heading font-semibold text-[#22D3EE]"
                  style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}>
              Свежие добавления
            </span>
          </div>

          <h1 className="font-heading font-bold text-white mb-2" style={{ fontSize: 'clamp(26px, 4vw, 40px)' }}>
            Новинки{' '}
            <span style={{ background: 'linear-gradient(90deg, #9D60FA, #06B6D4)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              недели
            </span>
          </h1>
          <p className="font-body text-[#6B7280]" style={{ fontSize: '15px' }}>
            Игры, добавленные в каталог за последний месяц
          </p>
        </motion.div>

        {/* Stats + filter row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                 style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.18)' }}>
              <Calendar style={{ width: '13px', height: '13px', color: '#22D3EE' }} />
              <span className="font-body text-[#22D3EE]" style={{ fontSize: '12px' }}>
                {new7Count} игр за 7 дней
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                 style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)' }}>
              <Sparkles style={{ width: '13px', height: '13px', color: '#9D60FA' }} />
              <span className="font-body text-[#9D60FA]" style={{ fontSize: '12px' }}>
                {games.length} за месяц
              </span>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 rounded-2xl p-1"
               style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
            {([
              { key: '7d'  as Filter, label: 'Эта неделя', count: new7Count },
              { key: '30d' as Filter, label: 'Этот месяц', count: games.length },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="relative flex items-center gap-2 rounded-xl px-4 py-2 font-heading font-semibold transition-all duration-200"
                style={{
                  fontSize: '12.5px',
                  color:      filter === tab.key ? '#fff' : '#4B5563',
                  background: filter === tab.key ? 'rgba(124,58,237,0.25)' : 'transparent',
                  border:     filter === tab.key ? '1px solid rgba(124,58,237,0.35)' : '1px solid transparent',
                }}
              >
                {tab.label}
                <span className="font-pixel rounded-full px-1.5 py-0.5"
                      style={{
                        fontSize: '7px',
                        background: filter === tab.key ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
                        color:      filter === tab.key ? '#C4B5FD' : '#374151',
                      }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {visible.length > 0 ? (
            <motion.div
              key={filter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4"
            >
              {visible.map((g, i) => (
                <GameCard key={g.id} game={g} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                   style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
                <Calendar style={{ width: '28px', height: '28px', color: '#22D3EE' }} />
              </div>
              <p className="font-heading font-semibold text-white mb-2" style={{ fontSize: '18px' }}>
                Пока нет новинок за эту неделю
              </p>
              <p className="font-body text-[#4B5563] mb-6" style={{ fontSize: '14px' }}>
                Попробуйте выбрать «Этот месяц»
              </p>
              <button
                onClick={() => setFilter('30d')}
                className="font-heading font-semibold text-white rounded-xl px-5 py-2.5"
                style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)', fontSize: '13px' }}
              >
                Показать за месяц
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
