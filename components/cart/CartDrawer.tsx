'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingCart, Trash2, Loader2, Package, ArrowRight, Zap } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/lib/cartContext';

interface CartItemData {
  id:           string;
  title:        string;
  slug:         string;
  cover:        string | null;
  priceUzs:     number | null;
  platforms:    string[];
  deliveryType: string;
  stockStore:   number;
  variants:     Array<{ id: string; label: string; priceUzs: number }>;
}

// One rendered row per cart LINE (not per unique game) — a customer who
// added two variants of the same game (e.g. "Ключ" + "Аккаунт") must see
// two rows, otherwise the drawer looks like it silently dropped one.
interface CartRow {
  line:  { gameId: string; variantId?: string };
  game:  CartItemData;
  label: string | null;
  price: number | null;
}

export default function CartDrawer() {
  const { items: cartLines, gameIds, removeGame, count, isOpen, closeCart } = useCart();
  const [games,   setGames]   = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (ids: string[]) => {
    if (!ids.length) { setGames([]); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/games/batch?ids=${ids.join(',')}`);
      const data = await res.json() as { items?: CartItemData[] };
      setGames(data.items ?? []);
    } catch { setGames([]); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isOpen) load(gameIds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Re-sync games list when a game is removed while drawer is open
  useEffect(() => {
    if (!isOpen) return;
    setGames(prev => prev.filter(g => gameIds.includes(g.id)));
  }, [gameIds, isOpen]);

  const rows: CartRow[] = cartLines
    .map(line => {
      const game = games.find(g => g.id === line.gameId);
      if (!game) return null;
      const variant = line.variantId ? game.variants.find(v => v.id === line.variantId) : undefined;
      return {
        line,
        game,
        label: variant?.label ?? null,
        price: variant?.priceUzs ?? game.priceUzs,
      };
    })
    .filter((r): r is CartRow => r !== null);

  const total = rows.reduce((s, r) => s + (r.price ?? 0), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[300]"
            style={{ background: 'rgba(4,3,10,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-[301] w-full max-w-sm flex flex-col"
            style={{
              background: '#09090E',
              borderLeft: '1px solid rgba(124,58,237,0.2)',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Top glow line */}
            <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                 style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.5) 40%, rgba(6,182,212,0.3) 70%, transparent)' }} />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4"
                 style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-4 h-4 text-[#7C3AED]" />
                <h2 className="font-heading font-bold text-white" style={{ fontSize: '16px' }}>
                  Корзина
                </h2>
                {count > 0 && (
                  <span className="font-pixel rounded-full px-2 py-0.5"
                        style={{ fontSize: '9px', background: 'rgba(124,58,237,0.2)', color: '#C4B5FD', border: '1px solid rgba(124,58,237,0.3)' }}>
                    {count}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-2 rounded-xl text-[#4B5563] hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {loading ? (
                <div className="flex items-center justify-center py-24 gap-3">
                  <Loader2 className="animate-spin w-5 h-5 text-[#7C3AED]" />
                  <span className="font-body text-[#4B5563] text-sm">Загрузка...</span>
                </div>
              ) : count === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center px-8">
                  <div className="p-5 rounded-2xl mb-5"
                       style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <ShoppingCart className="w-8 h-8" style={{ color: '#1F2937' }} />
                  </div>
                  <p className="font-heading font-bold text-white text-base mb-1">Корзина пуста</p>
                  <p className="font-body text-sm mb-6" style={{ color: '#4B5563' }}>
                    Добавьте игры из каталога
                  </p>
                  <Link
                    href="/catalog"
                    onClick={closeCart}
                    className="font-heading font-semibold text-sm px-5 py-2.5 rounded-xl text-white inline-flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
                  >
                    В каталог
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="p-4 space-y-2.5">
                  {rows.map(({ line, game: g, label, price }) => {
                    const instant = (g.deliveryType === 'AUTO' && g.stockStore > 0) || g.deliveryType === 'DROPSHIP';
                    return (
                      <motion.div
                        key={`${line.gameId}:${line.variantId ?? ''}`}
                        layout
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        className="flex gap-3 p-3 rounded-xl"
                        style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        {/* Cover */}
                        <Link
                          href={`/games/${g.slug}`}
                          onClick={closeCart}
                          className="relative flex-shrink-0 rounded-lg overflow-hidden"
                          style={{ width: '52px', aspectRatio: '3/4' }}
                        >
                          {g.cover ? (
                            <Image src={g.cover} alt={g.title} fill unoptimized className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"
                                 style={{ background: 'rgba(124,58,237,0.08)' }}>
                              <Package className="w-4 h-4 text-[#4B5563]" />
                            </div>
                          )}
                        </Link>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <Link
                            href={`/games/${g.slug}`}
                            onClick={closeCart}
                            className="font-heading font-semibold text-white text-sm leading-snug line-clamp-2 hover:text-[#C4B5FD] transition-colors"
                            style={{ fontSize: '13px' }}
                          >
                            {g.title}{label && <span className="text-[#6B7280]"> · {label}</span>}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="font-heading font-bold"
                               style={{ fontSize: '13px', color: '#A78BFA' }}>
                              {price != null ? formatPrice(price) : '—'}
                            </p>
                            {instant && (
                              <div className="flex items-center gap-0.5">
                                <Zap className="w-2.5 h-2.5 text-[#22C55E]" />
                                <span className="font-body text-[#22C55E]" style={{ fontSize: '9px' }}>Авто</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeGame(line.gameId, line.variantId)}
                          className="p-1.5 rounded-lg flex-shrink-0 self-start transition-colors"
                          style={{ color: '#374151' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#374151')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {count > 0 && !loading && (
              <div className="p-4 space-y-3"
                   style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Total */}
                <div className="flex items-center justify-between px-1">
                  <span className="font-body text-sm" style={{ color: '#6B7280' }}>
                    {count} {count === 1 ? 'игра' : count < 5 ? 'игры' : 'игр'}
                  </span>
                  <span className="font-heading font-bold text-white" style={{ fontSize: '16px' }}>
                    {formatPrice(total)}
                  </span>
                </div>

                {/* Checkout button */}
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-heading font-bold text-white text-sm transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                    boxShadow: '0 0 24px rgba(124,58,237,0.3)',
                  }}
                >
                  Оформить заказ
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {/* Continue shopping */}
                <button
                  onClick={closeCart}
                  className="w-full font-body text-sm transition-colors py-1"
                  style={{ color: '#4B5563' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
                >
                  Продолжить покупки
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
