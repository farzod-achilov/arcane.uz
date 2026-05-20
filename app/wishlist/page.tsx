'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart, Trash2, ShoppingCart, Zap, ArrowRight,
  Bell, BellOff, TrendingDown, Clock, LayoutGrid,
  List as ListIcon, SlidersHorizontal, ChevronDown, Check, Star,
} from 'lucide-react';
import { useUser } from '@/lib/userContext';
import { products } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';

const LS_ALERTS = 'arcane_wishlist_alerts';

function readAlerts(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LS_ALERTS);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function saveAlerts(set: Set<string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_ALERTS, JSON.stringify(Array.from(set)));
}

type SortKey = 'default' | 'price_asc' | 'price_desc' | 'discount' | 'name';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'default',    label: 'По умолчанию' },
  { value: 'price_asc',  label: 'Цена: от низкой' },
  { value: 'price_desc', label: 'Цена: от высокой' },
  { value: 'discount',   label: 'По скидке' },
  { value: 'name',       label: 'По названию' },
];

export default function WishlistPage() {
  const { isLoggedIn, wishlist, removeFromWishlist } = useUser();
  const router = useRouter();

  const [alerts, setAlerts]     = useState<Set<string>>(new Set());
  const [sort, setSort]         = useState<SortKey>('default');
  const [view, setView]         = useState<'grid' | 'list'>('grid');
  const [onlyDeals, setOnlyDeals] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) router.replace('/login');
  }, [isLoggedIn, router]);

  useEffect(() => {
    setAlerts(readAlerts());
  }, []);

  const toggleAlert = (id: string) => {
    setAlerts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveAlerts(next);
      return next;
    });
  };

  const handleRemove = (id: string) => {
    setRemoving(id);
    setTimeout(() => {
      removeFromWishlist(id);
      setRemoving(null);
    }, 350);
  };

  const wishlistProducts = useMemo(() => {
    let list = products.filter((p) => wishlist.includes(p.id));
    if (onlyDeals) list = list.filter((p) => p.discount && p.discount > 0);

    switch (sort) {
      case 'price_asc':  list.sort((a, b) => a.price - b.price); break;
      case 'price_desc': list.sort((a, b) => b.price - a.price); break;
      case 'discount':   list.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0)); break;
      case 'name':       list.sort((a, b) => a.title.localeCompare(b.title)); break;
    }
    return list;
  }, [wishlist, sort, onlyDeals]);

  const totalValue    = wishlistProducts.reduce((s, p) => s + (p.originalPrice ?? p.price), 0);
  const totalSavings  = wishlistProducts.reduce((s, p) => s + (p.originalPrice ? p.originalPrice - p.price : 0), 0);
  const discountCount = wishlistProducts.filter((p) => p.discount && p.discount > 0).length;
  const preorderCount = wishlistProducts.filter((p) => p.preorder).length;

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(239,68,68,1) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,1) 1px, transparent 1px)',
             backgroundSize: '52px 52px', opacity: 0.01,
           }} />
      {/* Top glow */}
      <div className="fixed top-0 left-0 right-0 h-px pointer-events-none"
           style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.4) 40%, rgba(124,58,237,0.3) 70%, transparent)' }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
            <div>
              <p className="font-pixel mb-2" style={{ fontSize: '9px', color: '#EF4444', letterSpacing: '0.15em' }}>
                МОЙ ВИШЛИСТ
              </p>
              <h1 className="font-heading font-bold text-white" style={{ fontSize: 'clamp(22px, 3vw, 32px)' }}>
                Список желаний{' '}
                {wishlist.length > 0 && (
                  <span className="font-pixel text-[#4B5563]" style={{ fontSize: '12px' }}>
                    ({wishlist.length})
                  </span>
                )}
              </h1>
            </div>
            {wishlistProducts.length > 0 && (
              <Link href="/catalog"
                    className="font-body text-[#4B5563] hover:text-[#9D60FA] transition-colors flex items-center gap-1"
                    style={{ fontSize: '13px' }}>
                Перейти в каталог <ArrowRight style={{ width: '13px', height: '13px' }} />
              </Link>
            )}
          </div>

          {/* Stats row */}
          {wishlistProducts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Игр в списке',   value: String(wishlistProducts.length), icon: Heart,       color: '#EF4444' },
                { label: 'Со скидкой',     value: String(discountCount),           icon: TrendingDown, color: '#22C55E' },
                { label: 'Предзаказов',    value: String(preorderCount),            icon: Clock,       color: '#F59E0B' },
                { label: 'Экономия',       value: totalSavings > 0 ? formatPrice(totalSavings) : '—', icon: Zap, color: '#06B6D4' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-2xl p-4"
                  style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon style={{ width: '14px', height: '14px', color: s.color }} />
                    <span className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{s.label}</span>
                  </div>
                  <p className="font-heading font-bold text-white" style={{ fontSize: '16px', color: s.color }}>{s.value}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Controls */}
          {wishlistProducts.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading text-sm transition-all duration-200"
                  style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)', color: '#9CA3AF' }}
                >
                  <SlidersHorizontal style={{ width: '13px', height: '13px' }} />
                  {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                  <ChevronDown
                    style={{ width: '13px', height: '13px', transition: 'transform 0.2s',
                             transform: sortOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                <AnimatePresence>
                  {sortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1 w-52 rounded-xl overflow-hidden z-20"
                      style={{ background: '#0D0D16', border: '1px solid rgba(124,58,237,0.22)',
                               boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setSort(opt.value); setSortOpen(false); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors font-body"
                          style={{ color: sort === opt.value ? '#C4B5FD' : '#6B7280' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.06)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          {opt.label}
                          {sort === opt.value && <Check style={{ width: '12px', height: '12px', color: '#7C3AED' }} />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Deals only toggle */}
              <button
                onClick={() => setOnlyDeals(!onlyDeals)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading text-sm transition-all duration-200"
                style={{
                  background: onlyDeals ? 'rgba(34,197,94,0.1)' : '#0D0D16',
                  border: `1px solid ${onlyDeals ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  color: onlyDeals ? '#22C55E' : '#9CA3AF',
                }}
              >
                <TrendingDown style={{ width: '13px', height: '13px' }} />
                Только со скидкой
              </button>

              {/* View toggle */}
              <div className="hidden sm:flex items-center rounded-xl p-1 ml-auto"
                   style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
                <button
                  onClick={() => setView('grid')}
                  className="p-1.5 rounded-lg transition-all duration-200"
                  style={{ background: view === 'grid' ? '#7C3AED' : 'transparent', color: view === 'grid' ? '#fff' : '#6B7280' }}
                >
                  <LayoutGrid style={{ width: '14px', height: '14px' }} />
                </button>
                <button
                  onClick={() => setView('list')}
                  className="p-1.5 rounded-lg transition-all duration-200"
                  style={{ background: view === 'list' ? '#7C3AED' : 'transparent', color: view === 'list' ? '#fff' : '#6B7280' }}
                >
                  <ListIcon style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Empty state ── */}
        {wishlist.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <Heart className="text-[#374151]" style={{ width: '32px', height: '32px' }} />
            </div>
            <h2 className="font-heading font-bold text-white mb-2" style={{ fontSize: '20px' }}>
              Вишлист пуст
            </h2>
            <p className="font-body text-[#6B7280] mb-6" style={{ fontSize: '14px' }}>
              Добавляйте игры в вишлист, чтобы следить за ценами и получать уведомления
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-xl font-heading font-semibold text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', padding: '12px 24px',
                       fontSize: '14px', boxShadow: '0 0 0 1px rgba(124,58,237,0.4), 0 4px 20px rgba(124,58,237,0.3)' }}
            >
              Перейти в каталог
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </Link>
          </motion.div>
        )}

        {/* ── No results after filter ── */}
        {wishlist.length > 0 && wishlistProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="font-body text-[#4B5563]" style={{ fontSize: '14px' }}>
              Нет игр со скидкой в вашем вишлисте
            </p>
            <button
              onClick={() => setOnlyDeals(false)}
              className="mt-3 font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors text-sm"
            >
              Показать все →
            </button>
          </motion.div>
        )}

        {/* ── Grid view ── */}
        {wishlistProducts.length > 0 && view === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {wishlistProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: removing === product.id ? 0 : 1, scale: removing === product.id ? 0.92 : 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  className="group rounded-2xl overflow-hidden flex flex-col"
                  style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.3)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(124,58,237,0.08)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                >
                  {/* Image */}
                  <Link href={`/product/${product.id}`} className="block relative aspect-video overflow-hidden">
                    <Image src={product.image} alt={product.title} fill unoptimized
                           className="object-cover transition-transform duration-400 group-hover:scale-[1.04]" />
                    <div className="absolute inset-0"
                         style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(13,13,22,0.85) 100%)' }} />

                    {/* Discount badge */}
                    {product.discount && product.discount > 0 && (
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-lg px-2 py-1"
                           style={{ background: 'rgba(239,68,68,0.9)', boxShadow: '0 0 10px rgba(239,68,68,0.5)' }}>
                        <TrendingDown style={{ width: '10px', height: '10px', color: '#fff' }} />
                        <span className="font-pixel text-white" style={{ fontSize: '7.5px' }}>-{product.discount}%</span>
                      </div>
                    )}

                    {/* Preorder badge */}
                    {product.preorder && (
                      <div className="absolute top-2.5 right-2.5 rounded-lg px-2 py-1"
                           style={{ background: 'rgba(245,158,11,0.9)', boxShadow: '0 0 10px rgba(245,158,11,0.5)' }}>
                        <span className="font-pixel text-white" style={{ fontSize: '7px' }}>PRE-ORDER</span>
                      </div>
                    )}

                    {/* Telegram alert indicator */}
                    {alerts.has(product.id) && !product.preorder && !product.discount && (
                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-lg px-2 py-1"
                           style={{ background: 'rgba(6,182,212,0.85)' }}>
                        <Bell style={{ width: '9px', height: '9px', color: '#fff' }} />
                        <span className="font-pixel text-white" style={{ fontSize: '7px' }}>АЛЕРТ</span>
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="font-heading font-semibold text-white line-clamp-1 mb-1 hover:text-[#C4B5FD] transition-colors"
                          style={{ fontSize: '14px' }}>
                        {product.title}
                      </h3>
                    </Link>

                    {/* Platforms */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {product.platform.slice(0, 2).map((p) => (
                        <span key={p} className="font-pixel"
                              style={{ fontSize: '7px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.07)',
                                       color: '#6B7280', padding: '2px 6px', borderRadius: '4px' }}>
                          {p}
                        </span>
                      ))}
                      <span className="font-pixel"
                            style={{ fontSize: '7px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                                     color: '#22C55E', padding: '2px 6px', borderRadius: '4px' }}>
                        RU/CIS
                      </span>
                    </div>

                    {/* Price + savings */}
                    <div className="mb-3">
                      <div className="flex items-baseline gap-2">
                        <span className="font-heading font-bold text-white" style={{ fontSize: '16px' }}>
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="font-body line-through text-[#374151]" style={{ fontSize: '11px' }}>
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                      {product.originalPrice && (
                        <p className="font-body text-[#22C55E]" style={{ fontSize: '10.5px' }}>
                          Экономия {formatPrice(product.originalPrice - product.price)}
                        </p>
                      )}
                      {product.preorder && product.releaseDate && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock style={{ width: '10px', height: '10px', color: '#F59E0B' }} />
                          <span className="font-body text-[#F59E0B]" style={{ fontSize: '10.5px' }}>
                            Релиз {new Date(product.releaseDate).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Instant delivery */}
                    {product.inStock && !product.preorder && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <Zap style={{ width: '10px', height: '10px', color: '#22C55E' }} />
                        <span className="font-body text-[#22C55E]" style={{ fontSize: '10.5px' }}>Мгновенная доставка</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-auto">
                      <Link href="/checkout"
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl font-heading font-semibold text-white py-2 transition-all duration-200 relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: '12px',
                                     boxShadow: '0 0 0 1px rgba(124,58,237,0.3)' }}>
                        <ShoppingCart style={{ width: '12px', height: '12px' }} />
                        {product.preorder ? 'Предзаказ' : 'В корзину'}
                      </Link>

                      {/* Telegram alert toggle */}
                      <button
                        onClick={() => toggleAlert(product.id)}
                        title={alerts.has(product.id) ? 'Отключить уведомления' : 'Уведомить об изменении цены'}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0"
                        style={{
                          background: alerts.has(product.id) ? 'rgba(6,182,212,0.12)' : '#09090E',
                          border: `1px solid ${alerts.has(product.id) ? 'rgba(6,182,212,0.35)' : 'rgba(255,255,255,0.07)'}`,
                          color: alerts.has(product.id) ? '#22D3EE' : '#4B5563',
                          boxShadow: alerts.has(product.id) ? '0 0 10px rgba(6,182,212,0.2)' : 'none',
                        }}
                      >
                        {alerts.has(product.id)
                          ? <Bell style={{ width: '13px', height: '13px' }} />
                          : <BellOff style={{ width: '13px', height: '13px' }} />}
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(product.id)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0"
                        style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.07)', color: '#4B5563' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#F87171'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#4B5563'; (e.currentTarget as HTMLElement).style.background = '#09090E'; }}
                      >
                        <Trash2 style={{ width: '13px', height: '13px' }} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── List view ── */}
        {wishlistProducts.length > 0 && view === 'list' && (
          <div className="space-y-3">
            <AnimatePresence>
              {wishlistProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: removing === product.id ? 0 : 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ delay: i * 0.04 }}
                  className="group flex gap-4 rounded-2xl p-4 transition-all duration-300"
                  style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.3)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
                >
                  {/* Image */}
                  <Link href={`/product/${product.id}`}
                        className="relative w-20 h-[90px] rounded-xl overflow-hidden flex-shrink-0">
                    <Image src={product.image} alt={product.title} fill unoptimized
                           className="object-cover transition-transform duration-400 group-hover:scale-[1.06]" />
                    {product.discount && (
                      <div className="absolute top-1.5 left-1.5 font-pixel rounded text-white"
                           style={{ fontSize: '7px', background: '#EF4444', padding: '2px 5px' }}>
                        -{product.discount}%
                      </div>
                    )}
                    {product.preorder && (
                      <div className="absolute top-1.5 left-1.5 font-pixel rounded text-white"
                           style={{ fontSize: '6.5px', background: '#F59E0B', padding: '2px 5px' }}>
                        PRE
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {product.subtitle && (
                          <p className="font-body text-[#374151] truncate" style={{ fontSize: '11px' }}>{product.subtitle}</p>
                        )}
                        <Link href={`/product/${product.id}`}>
                          <h3 className="font-heading font-semibold text-white line-clamp-1 hover:text-[#C4B5FD] transition-colors"
                              style={{ fontSize: '14px' }}>
                            {product.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {product.platform.slice(0, 2).map((p) => (
                            <span key={p} className="font-pixel"
                                  style={{ fontSize: '7px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.07)',
                                           color: '#6B7280', padding: '2px 6px', borderRadius: '4px' }}>
                              {p}
                            </span>
                          ))}
                          {product.inStock && !product.preorder && (
                            <div className="flex items-center gap-0.5">
                              <Zap style={{ width: '9px', height: '9px', color: '#22C55E' }} />
                              <span className="font-body text-[#22C55E]" style={{ fontSize: '10px' }}>Мгновенно</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: price + actions */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="font-heading font-bold text-white" style={{ fontSize: '15px', lineHeight: 1 }}>
                            {formatPrice(product.price)}
                          </p>
                          {product.originalPrice && (
                            <p className="font-body line-through text-[#374151] mt-0.5" style={{ fontSize: '11px' }}>
                              {formatPrice(product.originalPrice)}
                            </p>
                          )}
                          {product.preorder && product.releaseDate && (
                            <p className="font-body text-[#F59E0B] mt-0.5" style={{ fontSize: '10px' }}>
                              Релиз {new Date(product.releaseDate).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <Link href="/checkout"
                                className="flex items-center gap-1 rounded-lg font-heading font-semibold text-white py-1.5 px-2.5"
                                style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: '11px' }}>
                            <ShoppingCart style={{ width: '11px', height: '11px' }} />
                            {product.preorder ? 'Предзаказ' : 'В корзину'}
                          </Link>
                          <button
                            onClick={() => toggleAlert(product.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                            style={{
                              background: alerts.has(product.id) ? 'rgba(6,182,212,0.12)' : '#09090E',
                              border: `1px solid ${alerts.has(product.id) ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.07)'}`,
                              color: alerts.has(product.id) ? '#22D3EE' : '#4B5563',
                            }}
                          >
                            {alerts.has(product.id) ? <Bell style={{ width: '12px', height: '12px' }} /> : <BellOff style={{ width: '12px', height: '12px' }} />}
                          </button>
                          <button
                            onClick={() => handleRemove(product.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 text-[#4B5563] hover:text-[#F87171] hover:bg-red-400/10"
                            style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.07)' }}
                          >
                            <Trash2 style={{ width: '12px', height: '12px' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── Savings summary bar ── */}
        {wishlistProducts.length > 0 && totalSavings > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <TrendingDown style={{ width: '18px', height: '18px', color: '#22C55E' }} />
              </div>
              <div>
                <p className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>
                  Вы сэкономите <span style={{ color: '#22C55E' }}>{formatPrice(totalSavings)}</span>
                </p>
                <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
                  Полная стоимость без скидки: {formatPrice(totalValue)}
                </p>
              </div>
            </div>
            <Link
              href="/catalog"
              className="font-heading font-semibold text-sm px-5 py-2.5 rounded-xl text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: '0 0 16px rgba(34,197,94,0.25)' }}
            >
              Найти ещё →
            </Link>
          </motion.div>
        )}

        {/* ── Telegram alerts info ── */}
        {alerts.size > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)' }}
          >
            <Bell style={{ width: '15px', height: '15px', color: '#06B6D4', flexShrink: 0 }} />
            <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
              Telegram-уведомления включены для{' '}
              <span style={{ color: '#22D3EE' }}>{alerts.size}</span>{' '}
              {alerts.size === 1 ? 'игры' : 'игр'}. Мы напишем вам при снижении цены.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
