'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Tag, Clock, ArrowRight, Flame, ShoppingCart, Star, Zap, TrendingDown } from 'lucide-react';
import { products } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';

/* ── Countdown ─────────────────────────────────────────── */
function Countdown({ endTime, compact = false }: { endTime: number; compact?: boolean }) {
  const [t, setT] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, endTime - Date.now());
      setT({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      });
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [endTime]);

  const p = (n: number) => String(n).padStart(2, '0');

  if (compact) {
    return (
      <div className="flex items-center gap-1 font-pixel text-[#F87171]" style={{ fontSize: '9px' }}>
        <Clock style={{ width: '10px', height: '10px' }} />
        <span>{p(t.h)}:{p(t.m)}:{p(t.s)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {[{ v: t.h, l: 'ЧАС' }, { v: t.m, l: 'МИН' }, { v: t.s, l: 'СЕК' }].map((u, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className="flex flex-col items-center rounded-xl px-3 py-2 min-w-[50px]"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)' }}
          >
            <span
              className="font-pixel text-[#F87171] leading-none"
              style={{ fontSize: '16px', textShadow: '0 0 10px rgba(239,68,68,0.55)' }}
            >
              {p(u.v)}
            </span>
            <span
              className="font-body text-[#4B5563] mt-1"
              style={{ fontSize: '8px', letterSpacing: '0.08em' }}
            >
              {u.l}
            </span>
          </div>
          {i < 2 && (
            <motion.span
              animate={{ opacity: [1, 0.15, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="font-pixel text-[#EF4444]/40 self-start mt-2"
              style={{ fontSize: '13px' }}
            >
              :
            </motion.span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Premium deal card ─────────────────────────────────── */
function DealCard({
  product,
  index,
  endTime,
}: {
  product: (typeof products)[number];
  index: number;
  endTime: number;
}) {
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const savings = product.originalPrice ? product.originalPrice - product.price : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.07 }}
      whileHover={{ y: -4 }}
    >
      <Link
        href={`/product/${product.id}`}
        className="group relative flex flex-col rounded-2xl overflow-hidden h-full transition-all duration-300"
        style={{ background: '#0D0D16', border: '1px solid rgba(239,68,68,0.12)' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.32)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 0 28px rgba(239,68,68,0.08), 0 12px 40px rgba(0,0,0,0.5)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.12)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        }}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={product.image}
            alt={product.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(13,13,22,0.85) 100%)' }}
          />
          {/* Discount badge */}
          <div
            className="absolute top-3 left-3 font-pixel text-white rounded-xl"
            style={{
              fontSize: '11px',
              background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
              padding: '5px 10px',
              letterSpacing: '0.05em',
              boxShadow: '0 0 16px rgba(239,68,68,0.6)',
            }}
          >
            -{product.discount}%
          </div>
          {/* Countdown on card */}
          <div
            className="absolute top-3 right-3 rounded-lg px-2 py-1.5"
            style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <Countdown endTime={endTime} compact />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4">
          {/* Title */}
          <div className="mb-2">
            {product.subtitle && (
              <p className="font-body text-[#374151] truncate" style={{ fontSize: '11px' }}>
                {product.subtitle}
              </p>
            )}
            <h3 className="font-heading font-bold text-white line-clamp-1" style={{ fontSize: '14px' }}>
              {product.title}
            </h3>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-3">
            <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
            <span className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{product.rating}</span>
            <span className="text-[#1F2937]" style={{ fontSize: '10px' }}>·</span>
            <div className="flex items-center gap-0.5">
              <Zap style={{ width: '10px', height: '10px', color: '#22C55E' }} />
              <span className="font-body text-[#22C55E]" style={{ fontSize: '10px' }}>Мгновенно</span>
            </div>
          </div>

          {/* Platforms */}
          <div className="flex flex-wrap gap-1 mb-3">
            {product.platform.slice(0, 2).map((p) => (
              <span
                key={p}
                className="font-pixel"
                style={{
                  fontSize: '7px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#6B7280',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {p}
              </span>
            ))}
          </div>

          {/* Price */}
          <div className="mt-auto">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-heading font-bold text-white" style={{ fontSize: '18px' }}>
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="font-body line-through text-[#374151]" style={{ fontSize: '12px' }}>
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {savings > 0 && (
              <p className="font-body text-[#22C55E] mb-3" style={{ fontSize: '11px' }}>
                Экономия {formatPrice(savings)}
              </p>
            )}

            {/* Add to cart */}
            <button
              onClick={handleAdd}
              className="w-full flex items-center justify-center gap-2 rounded-xl font-heading font-semibold text-white py-2.5 transition-all duration-200 relative overflow-hidden"
              style={{
                background: added
                  ? '#22C55E'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(185,28,28,0.95))',
                fontSize: '12.5px',
                boxShadow: added ? '0 0 16px rgba(34,197,94,0.4)' : '0 0 16px rgba(239,68,68,0.25)',
              }}
            >
              <span
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08), transparent)' }}
              />
              <AnimatePresence mode="wait">
                {added ? (
                  <motion.span
                    key="ok"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative z-10"
                  >
                    ✓ Добавлено
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 relative z-10"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    В корзину
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Page ──────────────────────────────────────────────── */
export default function DealsPage() {
  const endTime = useRef(Date.now() + 11 * 3_600_000 + 47 * 60_000).current;

  const dealProducts = products
    .filter((p) => p.discount && p.discount > 0)
    .sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));

  const featured = dealProducts[0];
  const rest = dealProducts.slice(1);

  const totalSavings = dealProducts.reduce(
    (sum, p) => sum + (p.originalPrice ? p.originalPrice - p.price : 0),
    0,
  );

  return (
    <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
      {/* Grid bg */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(239,68,68,1) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,1) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          opacity: 0.012,
        }}
      />
      {/* Top glow */}
      <div
        className="fixed top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(239,68,68,0.4) 45%, rgba(245,158,11,0.3) 70%, transparent 95%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10"
        >
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <Flame style={{ width: '13px', height: '13px', color: '#EF4444' }} />
              <span
                className="font-heading font-semibold text-[#F87171]"
                style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}
              >
                Ограниченное время
              </span>
            </div>
            <h1
              className="font-heading font-bold text-white"
              style={{ fontSize: 'clamp(26px, 4vw, 40px)', textShadow: '0 0 30px rgba(239,68,68,0.2)' }}
            >
              Скидки <span style={{ color: '#F87171' }}>&amp; Акции</span>
            </h1>
            <p className="font-body text-[#6B7280] mt-2" style={{ fontSize: '15px' }}>
              {dealProducts.length} товаров со скидкой · Общая экономия{' '}
              <span style={{ color: '#22C55E' }}>{formatPrice(totalSavings)}</span>
            </p>
          </div>

          {/* Countdown */}
          <div className="flex flex-col items-start sm:items-end gap-1.5">
            <div className="flex items-center gap-2 text-[#4B5563] mb-1">
              <Clock style={{ width: '13px', height: '13px' }} />
              <span className="font-body" style={{ fontSize: '12px' }}>Сброс через:</span>
            </div>
            <Countdown endTime={endTime} />
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { icon: TrendingDown, label: 'Скидок', value: `${dealProducts.length}`, color: '#EF4444' },
            { icon: Tag, label: 'Макс. скидка', value: `-${Math.max(...dealProducts.map(p => p.discount ?? 0))}%`, color: '#F59E0B' },
            { icon: Zap, label: 'Экономия', value: formatPrice(totalSavings), color: '#22C55E' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="rounded-2xl p-4 text-center"
              style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <s.icon style={{ width: '16px', height: '16px', color: s.color, margin: '0 auto 6px' }} />
              <p className="font-heading font-bold text-white" style={{ fontSize: '18px', color: s.color }}>
                {s.value}
              </p>
              <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Featured deal */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group relative rounded-2xl overflow-hidden mb-10 cursor-pointer"
            style={{ border: '1px solid rgba(239,68,68,0.2)', background: '#0D0D16' }}
            whileHover={{ y: -3 }}
            onClick={() => (window.location.href = `/product/${featured.id}`)}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 60% 100% at 70% 50%, rgba(239,68,68,0.07) 0%, transparent 70%)',
              }}
            />

            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
              <div className="relative w-full sm:w-40 aspect-[3/4] sm:aspect-auto sm:h-52 rounded-xl overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(13,13,22,0.6) 100%)' }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="font-pixel rounded-lg text-white"
                    style={{
                      fontSize: '9px',
                      background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
                      padding: '4px 10px',
                      letterSpacing: '0.06em',
                      boxShadow: '0 0 16px rgba(239,68,68,0.6)',
                    }}
                  >
                    -{featured.discount}% СКИДКА
                  </span>
                  <span className="font-heading text-[#F87171]" style={{ fontSize: '12px' }}>
                    🔥 Лучшее предложение дня
                  </span>
                </div>
                <h2
                  className="font-heading font-bold text-white mb-1"
                  style={{ fontSize: 'clamp(18px, 2.5vw, 26px)' }}
                >
                  {featured.title}
                </h2>
                <p className="font-body text-[#6B7280] mb-2" style={{ fontSize: '13px' }}>
                  {featured.subtitle}
                </p>
                <p
                  className="font-body text-[#4B5563] mb-4 line-clamp-2"
                  style={{ fontSize: '14px' }}
                >
                  {featured.description}
                </p>

                {/* Countdown for featured */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>Осталось:</span>
                  <Countdown endTime={endTime} compact />
                </div>

                <div className="flex items-baseline gap-3 mb-5">
                  <span className="font-heading font-bold text-white" style={{ fontSize: '26px' }}>
                    {formatPrice(featured.price)}
                  </span>
                  {featured.originalPrice && (
                    <span className="font-body line-through text-[#374151]" style={{ fontSize: '15px' }}>
                      {formatPrice(featured.originalPrice)}
                    </span>
                  )}
                  {featured.originalPrice && (
                    <span className="font-body text-[#22C55E]" style={{ fontSize: '13px' }}>
                      Экономия {formatPrice(featured.originalPrice - featured.price)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/product/${featured.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="group/btn relative inline-flex items-center gap-2 rounded-xl font-heading font-semibold text-white overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
                      padding: '11px 22px',
                      fontSize: '13.5px',
                      boxShadow: '0 0 0 1px rgba(239,68,68,0.4), 0 4px 20px rgba(239,68,68,0.3)',
                    }}
                  >
                    <span
                      className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent 55%)' }}
                    />
                    <span className="relative z-10">Купить со скидкой</span>
                    <ArrowRight style={{ width: '14px', height: '14px' }} className="relative z-10" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Section label */}
        {rest.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <Tag style={{ width: '16px', height: '16px', color: '#EF4444' }} />
              <h2
                className="font-heading font-semibold text-[#9CA3AF]"
                style={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase' }}
              >
                Все скидки
              </h2>
              <div className="flex-1 h-px" style={{ background: 'rgba(239,68,68,0.12)' }} />
            </div>

            {/* Deals grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {rest.map((product, i) => (
                <DealCard
                  key={product.id}
                  product={product}
                  index={i}
                  endTime={endTime + i * 3_600_000}
                />
              ))}
            </div>
          </>
        )}

        {dealProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="font-body text-[#4B5563]" style={{ fontSize: '16px' }}>
              Скидок пока нет. Загляните позже!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
