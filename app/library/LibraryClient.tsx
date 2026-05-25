'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Copy, Eye, EyeOff, ExternalLink,
  Clock, CheckCircle2, AlertCircle, Package,
  Filter, Search, Monitor, Apple, Terminal,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Types ── */
interface LibraryItem {
  orderId:     string;
  orderStatus: string;
  orderDate:   string;
  itemId:      string;
  price:       number;
  keyValue:    string | null;
  deliveredAt: string | null;
  game: {
    id:        string;
    title:     string;
    cover:     string | null;
    slug:      string;
    genres:    string[];
    platforms: string[];
    developer: string | null;
  };
}

/* ── Helpers ── */
function formatPrice(uzs: number) {
  return new Intl.NumberFormat('ru-UZ', { style: 'decimal' }).format(uzs) + ' сум';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  COMPLETED:     { label: 'Доставлен',       color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   icon: CheckCircle2  },
  PAID:          { label: 'Оплачен',         color: '#06B6D4', bg: 'rgba(6,182,212,0.12)',   icon: Clock         },
  WAITING_STOCK: { label: 'Ожидает ключ',    color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  icon: AlertCircle   },
};

function PlatformIcon({ p }: { p: string }) {
  if (p === 'PC')    return <Monitor className="w-3 h-3" />;
  if (p === 'Mac')   return <Apple   className="w-3 h-3" />;
  if (p === 'Linux') return <Terminal className="w-3 h-3" />;
  return <Monitor className="w-3 h-3" />;
}

/* ── Key reveal cell ── */
function KeyCell({ value }: { value: string }) {
  const [visible, setVisible] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value).then(() =>
      toast.success('Ключ скопирован!', { duration: 2000 })
    );
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-lg px-3 py-2 font-mono relative overflow-hidden"
           style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '13px', color: '#E2E8F0', letterSpacing: '0.04em' }}>
        {visible ? value : '•'.repeat(Math.min(value.length, 17))}
      </div>
      <button onClick={() => setVisible(v => !v)}
              className="p-2 rounded-lg transition-all duration-150 flex-shrink-0"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
              title={visible ? 'Скрыть' : 'Показать ключ'}>
        {visible
          ? <EyeOff className="w-3.5 h-3.5" style={{ color: '#9D60FA' }} />
          : <Eye    className="w-3.5 h-3.5" style={{ color: '#9D60FA' }} />}
      </button>
      <button onClick={copy}
              className="p-2 rounded-lg transition-all duration-150 flex-shrink-0"
              style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}
              title="Копировать ключ">
        <Copy className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />
      </button>
    </div>
  );
}

/* ── Skeleton ── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse"
         style={{ background: 'rgba(18,18,26,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex">
        <div className="w-36 h-48 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="flex-1 p-5 space-y-3">
          <div className="h-5 rounded-lg w-2/3" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <div className="h-3 rounded w-1/3"    style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-8 rounded-lg"       style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
      </div>
    </div>
  );
}

/* ── Game card ── */
function GameCard({ item, index }: { item: LibraryItem; index: number }) {
  const status = STATUS_MAP[item.orderStatus] ?? STATUS_MAP['PAID'];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group rounded-2xl overflow-hidden relative"
      style={{ background: 'rgba(18,18,26,0.8)', border: '1px solid rgba(255,255,255,0.06)',
               boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
               transition: 'border-color 0.2s, box-shadow 0.2s' }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'rgba(124,58,237,0.3)';
        el.style.boxShadow   = '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.15)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'rgba(255,255,255,0.06)';
        el.style.boxShadow   = '0 4px 24px rgba(0,0,0,0.3)';
      }}
    >
      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-px"
           style={{ background: `linear-gradient(90deg, transparent, ${status.color}44, transparent)` }} />

      <div className="flex flex-col sm:flex-row">
        {/* Cover */}
        <div className="relative sm:w-36 sm:h-48 h-40 w-full flex-shrink-0 overflow-hidden"
             style={{ background: 'rgba(10,10,15,0.8)' }}>
          {item.game.cover ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={item.game.cover} alt={item.game.title}
                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                 style={{ objectPosition: 'top center' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))' }}>
              <Package style={{ width: '40px', height: '40px', color: 'rgba(255,255,255,0.15)' }} />
            </div>
          )}
          {/* Cover gradient */}
          <div className="absolute inset-0 sm:hidden"
               style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(18,18,26,0.95))' }} />
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-white truncate" style={{ fontSize: '16px' }}>
                {item.game.title}
              </h3>
              {item.game.developer && (
                <p className="font-body text-[#6B7280] mt-0.5 truncate" style={{ fontSize: '12px' }}>
                  {item.game.developer}
                </p>
              )}
              {/* Platforms + Genres */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {item.game.platforms.map((p) => (
                  <span key={p} className="flex items-center gap-1 font-body rounded-md px-2 py-0.5"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                                 fontSize: '10.5px', color: '#9CA3AF' }}>
                    <PlatformIcon p={p} /> {p}
                  </span>
                ))}
                {item.game.genres.slice(0, 2).map((g) => (
                  <span key={g} className="font-body rounded-md px-2 py-0.5"
                        style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)',
                                 fontSize: '10.5px', color: '#9D60FA' }}>
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
                 style={{ background: status.bg, border: `1px solid ${status.color}30` }}>
              <StatusIcon style={{ width: '12px', height: '12px', color: status.color }} />
              <span className="font-body font-medium" style={{ fontSize: '11px', color: status.color }}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Key section */}
          <div className="rounded-xl p-3 relative overflow-hidden"
               style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-pixel mb-2"
               style={{ fontSize: '7px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em' }}>
              ◆ КЛЮЧ АКТИВАЦИИ
            </p>
            {item.keyValue ? (
              <KeyCell value={item.keyValue} />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                   style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <AlertCircle style={{ width: '14px', height: '14px', color: '#F59E0B', flexShrink: 0 }} />
                <span className="font-body text-[#92400E]" style={{ fontSize: '12.5px' }}>
                  Ключ будет доставлен в ближайшее время
                </span>
              </div>
            )}
          </div>

          {/* Footer: date + price + link */}
          <div className="flex items-center justify-between pt-1 mt-auto">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-pixel" style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.1em' }}>
                  ДАТА ПОКУПКИ
                </p>
                <p className="font-body text-[#9CA3AF] mt-0.5" style={{ fontSize: '12px' }}>
                  {formatDate(item.orderDate)}
                </p>
              </div>
              <div>
                <p className="font-pixel" style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.1em' }}>
                  СТОИМОСТЬ
                </p>
                <p className="font-body text-[#E2E8F0] font-medium mt-0.5" style={{ fontSize: '12px' }}>
                  {formatPrice(item.price)}
                </p>
              </div>
            </div>

            <Link href={`/product/${item.game.slug}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-heading font-medium text-[#9D60FA] transition-all duration-200 group/link"
                  style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                           fontSize: '12px' }}
                  target="_blank">
              <ExternalLink className="w-3 h-3" />
              Страница игры
              <ChevronRight className="w-3 h-3 transition-transform group-hover/link:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main component ── */
interface Props {
  items:    LibraryItem[];
  username: string;
  avatar:   string | null;
}

const FILTERS = [
  { id: 'all',     label: 'Все'          },
  { id: 'COMPLETED',     label: 'Доставлены'  },
  { id: 'WAITING_STOCK', label: 'Ожидают ключ' },
  { id: 'PAID',          label: 'Оплачены'    },
] as const;

export default function LibraryClient({ items, username, avatar }: Props) {
  const [filter, setFilter]   = useState<string>('all');
  const [search, setSearch]   = useState('');

  const stats = useMemo(() => ({
    total:     items.length,
    delivered: items.filter(i => i.keyValue).length,
    waiting:   items.filter(i => !i.keyValue).length,
  }), [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (filter !== 'all')       list = list.filter(i => i.orderStatus === filter);
    if (search.trim())          list = list.filter(i => i.game.title.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [items, filter, search]);

  return (
    <div className="min-h-screen" style={{ background: '#03020A', paddingTop: '120px', paddingBottom: '80px' }}>
      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div style={{ position: 'absolute', top: '0', left: '20%', width: '600px', height: '400px',
                      background: 'radial-gradient(ellipse, rgba(124,58,237,0.07) 0%, transparent 70%)',
                      filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: '400px', height: '300px',
                      background: 'radial-gradient(ellipse, rgba(6,182,212,0.05) 0%, transparent 70%)',
                      filter: 'blur(60px)' }} />
        <div className="absolute inset-0"
             style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
                      backgroundSize: '52px 52px', opacity: 0.018 }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        {/* ── Hero header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-6">
            {/* Avatar */}
            <div className="relative">
              {avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatar} alt={username}
                     className="w-16 h-16 rounded-2xl object-cover"
                     style={{ border: '2px solid rgba(124,58,237,0.4)',
                              boxShadow: '0 0 20px rgba(124,58,237,0.3)' }} />
              ) : (
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-heading font-bold text-white"
                     style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                              fontSize: '22px', border: '2px solid rgba(124,58,237,0.4)',
                              boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}>
                  {username[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#22C55E] flex items-center justify-center"
                   style={{ border: '2px solid #03020A', boxShadow: '0 0 8px rgba(34,197,94,0.6)' }}>
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen style={{ width: '16px', height: '16px', color: '#7C3AED' }} />
                <span className="font-pixel" style={{ fontSize: '7px', color: 'rgba(124,58,237,0.6)', letterSpacing: '0.18em' }}>
                  МОЯ БИБЛИОТЕКА
                </span>
              </div>
              <h1 className="font-heading font-bold text-white" style={{ fontSize: '28px' }}>
                {username}
              </h1>
              <p className="font-body text-[#6B7280] mt-0.5" style={{ fontSize: '13.5px' }}>
                Все купленные игры в одном месте
              </p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'ВСЕГО ИГР',        value: stats.total,     color: '#7C3AED' },
              { label: 'КЛЮЧЕЙ ПОЛУЧЕНО',  value: stats.delivered, color: '#22C55E' },
              { label: 'ОЖИДАЕТ КЛЮЧ',     value: stats.waiting,   color: '#F59E0B' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-4 relative overflow-hidden"
                   style={{ background: 'rgba(18,18,26,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="absolute top-0 left-0 right-0 h-px"
                     style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />
                <p className="font-heading font-black" style={{ fontSize: '28px', color, lineHeight: 1 }}>
                  {value}
                </p>
                <p className="font-pixel mt-1" style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Filters + Search ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl flex-shrink-0"
               style={{ background: 'rgba(18,18,26,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Filter style={{ width: '13px', height: '13px', color: '#4B5563', marginLeft: '8px', flexShrink: 0 }} />
            {FILTERS.map(({ id, label }) => (
              <button key={id} onClick={() => setFilter(id)}
                      className="px-4 py-2 rounded-lg font-heading font-medium transition-all duration-200"
                      style={{
                        fontSize: '12.5px',
                        background: filter === id ? 'rgba(124,58,237,0.2)' : 'transparent',
                        color:      filter === id ? '#C4B5FD' : '#6B7280',
                        border:     filter === id ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                        boxShadow:  filter === id ? '0 0 12px rgba(124,58,237,0.15)' : 'none',
                      }}>
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                             width: '14px', height: '14px', color: '#4B5563', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Поиск по названию…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl font-body outline-none transition-all duration-200"
              style={{ background: 'rgba(18,18,26,0.8)', border: '1px solid rgba(255,255,255,0.06)',
                       color: '#E2E8F0', fontSize: '13.5px' }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(124,58,237,0.4)'; }}
              onBlur={(e) =>  { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; }}
            />
          </div>
        </motion.div>

        {/* ── Game list ── */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 rounded-2xl"
              style={{ background: 'rgba(18,18,26,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
                   style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
                <BookOpen style={{ width: '36px', height: '36px', color: 'rgba(124,58,237,0.4)' }} />
              </div>
              <h3 className="font-heading font-bold text-white mb-2" style={{ fontSize: '18px' }}>
                {items.length === 0 ? 'Библиотека пуста' : 'Ничего не найдено'}
              </h3>
              <p className="font-body text-[#6B7280] mb-6" style={{ fontSize: '14px' }}>
                {items.length === 0
                  ? 'Купите первую игру и она появится здесь'
                  : 'Попробуйте изменить фильтры или запрос'}
              </p>
              {items.length === 0 && (
                <Link href="/catalog"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-heading font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                               boxShadow: '0 0 24px rgba(124,58,237,0.35)', fontSize: '14px' }}>
                  Перейти в каталог
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </motion.div>
          ) : (
            <motion.div key="list" className="space-y-4">
              {filtered.map((item, i) => (
                <GameCard key={item.itemId} item={item} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Bottom CTA ── */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}
          >
            <div>
              <p className="font-heading font-semibold text-white" style={{ fontSize: '15px' }}>
                Ищете новые игры?
              </p>
              <p className="font-body text-[#6B7280] mt-0.5" style={{ fontSize: '13px' }}>
                Сотни игр по лучшим ценам в Узбекистане
              </p>
            </div>
            <Link href="/catalog"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-heading font-semibold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                           boxShadow: '0 0 24px rgba(124,58,237,0.3)', fontSize: '14px' }}>
              Каталог игр
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
