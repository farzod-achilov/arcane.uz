'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Tag, Clock, ArrowRight, Flame } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import { products } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';

/* ── Countdown reusable ──────────────────────────────── */
function Countdown({ endTime }: { endTime: number }) {
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
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-1.5">
      {[{ v: t.h, l: 'ЧАС' }, { v: t.m, l: 'МИН' }, { v: t.s, l: 'СЕК' }].map((u, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center rounded-xl px-3 py-2 min-w-[50px]"
               style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)' }}>
            <span className="font-pixel text-[#F87171] leading-none"
                  style={{ fontSize: '16px', textShadow: '0 0 10px rgba(239,68,68,0.55)' }}>
              {p(u.v)}
            </span>
            <span className="font-body text-[#4B5563] mt-1" style={{ fontSize: '8px', letterSpacing: '0.08em' }}>
              {u.l}
            </span>
          </div>
          {i < 2 && (
            <motion.span
              animate={{ opacity: [1, 0.15, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="font-pixel text-[#EF4444]/40 self-start mt-2"
              style={{ fontSize: '13px' }}
            >:
            </motion.span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function DealsPage() {
  const endTime = useRef(Date.now() + 11 * 3_600_000 + 47 * 60_000).current;
  const dealProducts = products.filter(p => p.discount && p.discount > 0)
    .sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
  const featured = dealProducts[0];
  const rest = dealProducts.slice(1);

  return (
    <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(239,68,68,1) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,1) 1px, transparent 1px)',
             backgroundSize: '52px 52px',
             opacity: 0.012,
           }} />
      {/* Top glow */}
      <div className="fixed top-0 left-0 right-0 h-px pointer-events-none"
           style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(239,68,68,0.4) 45%, rgba(245,158,11,0.3) 70%, transparent 95%)' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4"
                 style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <Flame style={{ width: '13px', height: '13px', color: '#EF4444' }} />
              <span className="font-heading font-semibold text-[#F87171]"
                    style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}>
                Ограниченное время
              </span>
            </div>
            <h1 className="font-heading font-bold text-white"
                style={{ fontSize: 'clamp(26px, 4vw, 40px)', textShadow: '0 0 30px rgba(239,68,68,0.2)' }}>
              Скидки <span style={{ color: '#F87171' }}>& Акции</span>
            </h1>
            <p className="font-body text-[#6B7280] mt-2" style={{ fontSize: '15px' }}>
              {dealProducts.length} товаров со скидкой — только сегодня
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1.5">
            <div className="flex items-center gap-2 text-[#4B5563] mb-1">
              <Clock style={{ width: '13px', height: '13px' }} />
              <span className="font-body" style={{ fontSize: '12px' }}>Сброс через:</span>
            </div>
            <Countdown endTime={endTime} />
          </div>
        </motion.div>

        {/* Featured deal */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group relative rounded-2xl overflow-hidden mb-10 cursor-pointer"
            style={{ border: '1px solid rgba(239,68,68,0.2)', background: '#0D0D16' }}
            whileHover={{ y: -3 }}
            onClick={() => window.location.href = `/product/${featured.id}`}
          >
            <div className="absolute inset-0 pointer-events-none"
                 style={{ background: 'radial-gradient(ellipse 60% 100% at 70% 50%, rgba(239,68,68,0.07) 0%, transparent 70%)' }} />

            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
              <div className="relative w-full sm:w-40 aspect-[3/4] sm:aspect-auto sm:h-52 rounded-xl overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featured.image} alt={featured.title}
                     className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                     loading="lazy" />
                <div className="absolute inset-0"
                     style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(13,13,22,0.6) 100%)' }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-pixel rounded-lg text-white"
                        style={{ fontSize: '9px', background: '#EF4444', padding: '3px 8px',
                                 letterSpacing: '0.06em', boxShadow: '0 0 12px rgba(239,68,68,0.5)' }}>
                    -{featured.discount}% СКИДКА
                  </span>
                  <span className="font-heading text-[#4B5563]" style={{ fontSize: '12px' }}>
                    Лучшее предложение дня
                  </span>
                </div>
                <h2 className="font-heading font-bold text-white mb-1"
                    style={{ fontSize: 'clamp(18px, 2.5vw, 26px)' }}>
                  {featured.title}
                </h2>
                <p className="font-body text-[#6B7280] mb-4 line-clamp-2" style={{ fontSize: '14px' }}>
                  {featured.description}
                </p>
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
                    <span className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity"
                          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent 55%)' }} />
                    <span className="relative z-10">Купить со скидкой</span>
                    <ArrowRight style={{ width: '14px', height: '14px' }} className="relative z-10" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Section label */}
        <div className="flex items-center gap-3 mb-6">
          <Tag style={{ width: '16px', height: '16px', color: '#EF4444' }} />
          <h2 className="font-heading font-semibold text-[#9CA3AF]"
              style={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Все скидки
          </h2>
          <div className="flex-1 h-px" style={{ background: 'rgba(239,68,68,0.12)' }} />
        </div>

        {/* Deals grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {rest.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

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
