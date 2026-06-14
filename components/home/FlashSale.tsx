'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Zap, Star, ShoppingCart, ArrowRight, Flame } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useDict } from '@/lib/locale/client';

export type FlashDeal = {
  gameId:          string;
  title:           string;
  slug:            string;
  cover:           string | null;
  priceUzs:        number;
  discountedPrice: number;
  discountPct:     number;
  rating:          number | null;
  genres:          string[];
  endsAt:          number;
};

/* ── Big countdown ── */
function BigCountdown({ endTime }: { endTime: number }) {
  const tm = useDict().home.time;
  const [t, setT] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, endTime - Date.now());
      setT({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      });
    };
    update();
    const id = setInterval(update, 1_000);
    return () => clearInterval(id);
  }, [endTime]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const units = [
    { val: t.h, label: tm.hours },
    { val: t.m, label: tm.min },
    { val: t.s, label: tm.sec },
  ];

  return (
    <div className="flex items-center gap-2">
      {units.map((u, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="flex flex-col items-center rounded-2xl px-4 py-3 relative overflow-hidden"
            style={{
              minWidth: '64px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              boxShadow: '0 0 20px rgba(239,68,68,0.08)',
            }}
          >
            <AnimatePresence mode="popLayout">
              <motion.span
                key={u.val}
                initial={{ y: -16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 16, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="font-pixel text-[#F87171] leading-none"
                style={{ fontSize: '22px', textShadow: '0 0 14px rgba(239,68,68,0.7)' }}
              >
                {pad(u.val)}
              </motion.span>
            </AnimatePresence>
            <span className="font-body text-[#4B5563] mt-1.5" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
              {u.label}
            </span>
          </div>
          {i < 2 && (
            <motion.span
              animate={{ opacity: [1, 0.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="font-pixel text-[#EF4444]/40 self-start mt-3"
              style={{ fontSize: '18px' }}
            >
              :
            </motion.span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Flash Sale Card ── */
function FlashCard({ deal, index }: { deal: FlashDeal; index: number }) {
  const f = useDict().home.flash;
  const [hovered, setHovered] = useState(false);
  const savings = deal.priceUzs - deal.discountedPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
    >
      <Link
        href={`/games/${deal.slug}`}
        className="group block rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: '#0D0D16',
          border: `1px solid ${hovered ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.06)'}`,
          boxShadow: hovered ? '0 0 32px rgba(239,68,68,0.12), 0 12px 40px rgba(0,0,0,0.5)' : 'none',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Cover 16:9 */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
          {deal.cover ? (
            <Image
              src={deal.cover}
              alt={deal.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
                 style={{ background: 'rgba(124,58,237,0.08)' }}>
              <ShoppingCart style={{ width: '28px', height: '28px', color: '#4B5563' }} />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(13,13,22,0.9) 100%)' }} />

          {/* Discount badge */}
          <div
            className="absolute top-3 left-3 font-pixel rounded-xl px-2.5 py-1.5 flex items-center gap-1"
            style={{
              background: 'linear-gradient(135deg, #DC2626, #EF4444)',
              color: '#fff',
              fontSize: '11px',
              letterSpacing: '0.04em',
              boxShadow: '0 0 16px rgba(239,68,68,0.6)',
            }}
          >
            <Zap style={{ width: '10px', height: '10px' }} />
            -{deal.discountPct}%
          </div>

          {/* Rating badge */}
          {deal.rating !== null && (
            <div
              className="absolute top-3 right-3 font-body flex items-center gap-1 rounded-lg px-2 py-1"
              style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px' }}
            >
              <Star style={{ width: '10px', height: '10px', color: '#F59E0B', fill: '#F59E0B' }} />
              <span className="text-white">{deal.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-heading font-bold text-white line-clamp-1 mb-1.5" style={{ fontSize: '14px' }}>
            {deal.title}
          </h3>

          {deal.genres.length > 0 && (
            <div className="flex items-center gap-1.5 mb-3">
              {deal.genres.slice(0, 2).map(g => (
                <span
                  key={g}
                  className="font-pixel rounded"
                  style={{
                    fontSize: '6.5px', padding: '2px 6px',
                    background: 'rgba(124,58,237,0.1)',
                    color: '#9D60FA',
                    border: '1px solid rgba(124,58,237,0.2)',
                  }}
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-end justify-between">
            <div>
              <p className="font-heading font-bold text-white" style={{ fontSize: '18px' }}>
                {formatPrice(deal.discountedPrice)}
              </p>
              <p className="font-body line-through mt-0.5" style={{ fontSize: '12px', color: '#374151' }}>
                {formatPrice(deal.priceUzs)}
              </p>
            </div>

            <div
              className="font-body rounded-xl px-2.5 py-1"
              style={{
                fontSize: '11px',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                color: '#4ADE80',
              }}
            >
              {f.savings} {formatPrice(savings)}
            </div>
          </div>
        </div>

        {/* Buy button — visible on hover */}
        <div
          className="mx-4 mb-4 flex items-center justify-center gap-2 rounded-xl font-heading font-semibold text-white transition-all duration-300"
          style={{
            padding: '10px',
            fontSize: '13px',
            background: hovered
              ? 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)'
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${hovered ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.06)'}`,
            boxShadow: hovered ? '0 0 20px rgba(239,68,68,0.25)' : 'none',
          }}
        >
          <ShoppingCart style={{ width: '14px', height: '14px' }} />
          {f.buy}
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Section ── */
export default function FlashSale({ deals, endTime }: { deals: FlashDeal[]; endTime: number }) {
  const f = useDict().home.flash;
  const stableEnd = useRef(endTime).current;

  if (deals.length === 0) return null;

  return (
    <section className="py-14 sm:py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: '#07070F' }} />
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(239,68,68,0.06) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse 40% 30% at 50% 100%, rgba(124,58,237,0.04) 0%, transparent 70%)' }} />

      {/* Top border accent */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
           style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.5) 30%, rgba(239,68,68,0.7) 50%, rgba(124,58,237,0.3) 75%, transparent)' }} />

      {/* Animated scan */}
      <style>{`
        @keyframes flash-scan {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100vw); }
        }
      `}</style>
      <div className="absolute top-0 bottom-0 w-32 pointer-events-none overflow-hidden left-0 right-0">
        <div style={{
          position: 'absolute', top: 0, bottom: 0, width: '2px',
          background: 'linear-gradient(to bottom, transparent, rgba(239,68,68,0.4), transparent)',
          animation: 'flash-scan 8s linear infinite',
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10"
        >
          {/* Title */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {/* Live dot */}
              <motion.div
                animate={{ opacity: [1, 0.2, 1], scale: [1, 1.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="w-2 h-2 rounded-full"
                style={{ background: '#EF4444', boxShadow: '0 0 8px rgba(239,68,68,1)' }}
              />
              <span className="font-heading font-semibold text-[#EF4444]/80 flex items-center gap-1.5"
                    style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}>
                <Flame style={{ width: '12px', height: '12px' }} />
                {f.limited}
              </span>
            </div>
            <h2
              className="font-pixel text-white"
              style={{
                fontSize: 'clamp(18px, 3vw, 28px)',
                letterSpacing: '0.06em',
                textShadow: '0 0 30px rgba(239,68,68,0.5)',
              }}
            >
              ⚡ FLASH SALE
            </h2>
          </div>

          {/* Countdown + link */}
          <div className="flex items-center gap-6">
            <BigCountdown endTime={stableEnd} />
            <Link
              href="/deals"
              className="hidden lg:inline-flex items-center gap-1.5 font-body transition-colors group text-[#4B5563] hover:text-[#F87171]"
              style={{ fontSize: '13px' }}
            >
              {f.seeAll}
              <ArrowRight style={{ width: '13px', height: '13px' }}
                          className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {deals.map((deal, i) => (
            <FlashCard key={deal.gameId} deal={deal} index={i} />
          ))}
        </div>

        {/* Mobile link */}
        <div className="mt-6 text-center lg:hidden">
          <Link href="/deals" className="font-body text-[#4B5563] hover:text-[#F87171] transition-colors" style={{ fontSize: '13px' }}>
            {f.seeAll} →
          </Link>
        </div>
      </div>
    </section>
  );
}
