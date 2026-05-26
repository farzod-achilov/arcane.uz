'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Trash2, ArrowRight, Star, Zap, Package,
  Monitor, Apple, Terminal, LayoutGrid, List as ListIcon,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useWishlist } from '@/hooks/useWishlist';

interface WishlistGame {
  id:         string;
  title:      string;
  slug:       string;
  cover:      string | null;
  genres:     string[];
  platforms:  string[];
  priceUzs:   number | null;
  priceUsd:   number | null;
  rating:     number | null;
  stockStore: number;
  savedAt:    string;
}

function PlatformIcon({ p }: { p: string }) {
  if (p === 'Mac')   return <Apple   className="w-3 h-3" />;
  if (p === 'Linux') return <Terminal className="w-3 h-3" />;
  return <Monitor className="w-3 h-3" />;
}

export default function WishlistClient({ items: initial }: { items: WishlistGame[] }) {
  const { toggle } = useWishlist();
  const [items, setItems]   = useState(initial);
  const [view, setView]     = useState<'grid' | 'list'>('grid');
  const [removing, setRemoving] = useState<string | null>(null);

  async function remove(gameId: string) {
    setRemoving(gameId);
    await toggle(gameId);
    setTimeout(() => {
      setItems(prev => prev.filter(g => g.id !== gameId));
      setRemoving(null);
    }, 300);
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '100px' }}>
      {/* top glow */}
      <div className="fixed top-0 left-0 right-0 h-px pointer-events-none"
           style={{ background: 'linear-gradient(90deg,transparent,rgba(239,68,68,0.5) 40%,rgba(124,58,237,0.3) 70%,transparent)' }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="font-pixel mb-2" style={{ fontSize: '9px', color: '#EF4444', letterSpacing: '0.15em' }}>МОЙ ВИШЛИСТ</p>
            <h1 className="font-heading font-bold text-white" style={{ fontSize: 'clamp(22px,3vw,32px)' }}>
              Список желаний{' '}
              {items.length > 0 && (
                <span className="font-pixel text-[#4B5563]" style={{ fontSize: '12px' }}>({items.length})</span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <div className="flex items-center rounded-xl p-1"
                   style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
                {(['grid', 'list'] as const).map(v => (
                  <button key={v} onClick={() => setView(v)}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ background: view === v ? '#7C3AED' : 'transparent', color: view === v ? '#fff' : '#6B7280' }}>
                    {v === 'grid' ? <LayoutGrid className="w-3.5 h-3.5" /> : <ListIcon className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
            <Link href="/catalog" className="font-body text-sm text-[#4B5563] hover:text-white transition-colors flex items-center gap-1">
              Каталог <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Empty */}
        {items.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
                 style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Heart className="text-[#374151] w-8 h-8" />
            </div>
            <h2 className="font-heading font-bold text-white mb-2 text-xl">Вишлист пуст</h2>
            <p className="font-body text-[#6B7280] text-sm mb-6">
              Нажимайте ♡ на карточках игр, чтобы сохранять их здесь
            </p>
            <Link href="/catalog"
                  className="inline-flex items-center gap-2 rounded-xl font-heading font-semibold text-white px-6 py-3 text-sm"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}>
              Перейти в каталог <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        {/* Grid */}
        {items.length > 0 && view === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {items.map((game, i) => (
                <motion.div key={game.id} layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: removing === game.id ? 0 : 1, scale: removing === game.id ? 0.92 : 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="group relative rounded-xl overflow-hidden flex flex-col"
                  style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  {/* Cover */}
                  <Link href={`/games/${game.slug}`} className="block relative" style={{ aspectRatio: '3/4' }}>
                    {game.cover ? (
                      <Image src={game.cover} alt={game.title} fill unoptimized
                             className="object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"
                           style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(6,182,212,0.1))' }}>
                        <Package className="w-8 h-8 text-white/15" />
                      </div>
                    )}
                    <div className="absolute inset-0 pointer-events-none"
                         style={{ background: 'linear-gradient(to bottom,transparent 50%,rgba(13,13,22,0.95) 100%)' }} />
                    {game.stockStore === 0 && (
                      <div className="absolute top-2 left-2 font-pixel rounded px-2 py-0.5 text-white"
                           style={{ fontSize: '7px', background: 'rgba(107,114,128,0.9)', letterSpacing: '0.06em' }}>
                        НЕТ В НАЛИЧИИ
                      </div>
                    )}
                  </Link>

                  {/* Remove button */}
                  <button onClick={() => remove(game.id)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                          style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}>
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>

                  {/* Info */}
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <h3 className="font-heading font-bold text-white line-clamp-2 leading-snug" style={{ fontSize: '13px' }}>
                      {game.title}
                    </h3>
                    {game.rating != null && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                        <span className="font-body text-[#9CA3AF]" style={{ fontSize: '11px' }}>{game.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-2"
                         style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      {game.priceUzs != null ? (
                        <span className="font-heading font-bold text-white" style={{ fontSize: '13px' }}>
                          {formatPrice(game.priceUzs)}
                        </span>
                      ) : (
                        <span className="font-body text-[#4B5563] text-xs">Нет цены</span>
                      )}
                      <Link href={`/games/${game.slug}`}
                            className="font-heading font-semibold text-white rounded-lg px-2.5 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)' }}>
                        Купить
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* List */}
        {items.length > 0 && view === 'list' && (
          <div className="space-y-3">
            <AnimatePresence>
              {items.map((game, i) => (
                <motion.div key={game.id} layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: removing === game.id ? 0 : 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ delay: i * 0.04 }}
                  className="group flex gap-4 rounded-2xl p-4 transition-all"
                  style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.3)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
                >
                  <Link href={`/games/${game.slug}`}
                        className="relative w-16 rounded-xl overflow-hidden flex-shrink-0" style={{ aspectRatio: '3/4' }}>
                    {game.cover ? (
                      <Image src={game.cover} alt={game.title} fill unoptimized className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"
                           style={{ background: 'rgba(124,58,237,0.1)' }}>
                        <Package className="w-5 h-5 text-white/20" />
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <Link href={`/games/${game.slug}`}>
                        <h3 className="font-heading font-semibold text-white hover:text-[#C4B5FD] transition-colors line-clamp-1" style={{ fontSize: '14px' }}>
                          {game.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {game.platforms.slice(0, 3).map(p => (
                          <span key={p} className="flex items-center gap-1 text-[#4B5563]" style={{ fontSize: '11px' }}>
                            <PlatformIcon p={p} /> {p}
                          </span>
                        ))}
                        {game.stockStore > 0 ? (
                          <span className="flex items-center gap-1 text-[#22C55E]" style={{ fontSize: '11px' }}>
                            <Zap className="w-2.5 h-2.5" /> В наличии
                          </span>
                        ) : (
                          <span className="text-[#4B5563]" style={{ fontSize: '11px' }}>Нет в наличии</span>
                        )}
                      </div>
                    </div>
                    <p className="font-body text-xs text-[#374151] mt-1">
                      Добавлено {new Date(game.savedAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between flex-shrink-0">
                    <button onClick={() => remove(game.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#374151] hover:text-red-400 hover:bg-red-400/10 transition-all"
                            style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-right">
                      {game.priceUzs != null && (
                        <p className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>
                          {formatPrice(game.priceUzs)}
                        </p>
                      )}
                      <Link href={`/games/${game.slug}`}
                            className="font-heading font-semibold text-white rounded-lg px-3 py-1 text-xs mt-1 inline-block"
                            style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)' }}>
                        Купить
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
