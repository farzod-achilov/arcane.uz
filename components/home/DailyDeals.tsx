'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Star, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export type DealItem = {
  gameId:          string;
  title:           string;
  slug:            string;
  cover:           string | null;
  priceUzs:        number;
  discountedPrice: number;
  discountPct:     number;
  rating:          number | null;
  platforms:       string[];
  endsAt:          number | null;
};

/* ── Countdown ── */
function Countdown({ endTime }: { endTime: number }) {
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
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-1.5">
      {([{ val: t.h, label: 'ЧАС' }, { val: t.m, label: 'МИН' }, { val: t.s, label: 'СЕК' }]).map((u, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center rounded-xl px-3 py-2"
               style={{ minWidth: '52px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span className="font-pixel text-[#F87171] leading-none" style={{ fontSize: '17px', textShadow: '0 0 10px rgba(239,68,68,0.55)' }}>
              {pad(u.val)}
            </span>
            <span className="font-body text-[#4B5563] mt-1" style={{ fontSize: '8.5px', letterSpacing: '0.08em' }}>{u.label}</span>
          </div>
          {i < 2 && (
            <motion.span
              animate={{ opacity: [1, 0.15, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              className="font-pixel text-[#EF4444]/50 self-start mt-2"
              style={{ fontSize: '14px' }}
            >:</motion.span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main ── */
export default function DailyDeals({ deals, endTime }: { deals: DealItem[]; endTime: number }) {
  const stableEnd = useRef(endTime).current;

  return (
    <section className="py-12 sm:py-16 relative">
      <div className="absolute inset-0 bg-[#0A0A0F] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(239,68,68,0.04) 0%, transparent 70%)' }} />
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
           style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(239,68,68,0.28) 35%, rgba(239,68,68,0.45) 55%, rgba(124,58,237,0.2) 80%, transparent 95%)' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" style={{ boxShadow: '0 0 6px rgba(239,68,68,0.9)' }} />
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#EF4444]/70" />
                <span className="font-heading font-semibold text-[#EF4444]/70"
                      style={{ fontSize: '10.5px', letterSpacing: '0.13em', textTransform: 'uppercase' }}>
                  Ограниченное время
                </span>
              </div>
            </div>
            <h2 className="font-pixel text-white" style={{ fontSize: 'clamp(14px, 2.2vw, 20px)', textShadow: '0 0 12px rgba(239,68,68,0.3)', letterSpacing: '0.04em' }}>
              DAILY DEALS
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Countdown endTime={stableEnd} />
            <Link href="/catalog?sort=price_asc"
                  className="hidden lg:inline-flex items-center gap-1.5 font-body transition-colors duration-200 group text-[#4B5563] hover:text-[#9D60FA]"
                  style={{ fontSize: '13px' }}>
              <span>Все скидки</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {deals.map((deal, i) => (
            <motion.div key={deal.gameId}
                        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.07, ease: 'easeOut' }}>
              <DealCard deal={deal} />
            </motion.div>
          ))}
        </div>

        <div className="mt-5 text-center lg:hidden">
          <Link href="/catalog" className="font-body transition-colors duration-200 text-[#4B5563] hover:text-[#9D60FA]" style={{ fontSize: '13px' }}>
            Все скидки →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Deal Card ── */
function DealCard({ deal }: { deal: DealItem }) {
  return (
    <Link
      href={`/product/${deal.gameId}`}
      className="group flex gap-3.5 rounded-2xl p-3.5 transition-all duration-300"
      style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.055)' }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'rgba(124,58,237,0.35)';
        el.style.boxShadow = '0 0 28px rgba(124,58,237,0.12), 0 8px 32px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'rgba(255,255,255,0.055)';
        el.style.boxShadow = 'none';
      }}
    >
      <div className="relative w-[76px] h-[100px] rounded-xl overflow-hidden flex-shrink-0"
           style={{ background: 'rgba(124,58,237,0.08)' }}>
        {deal.cover && (
          <Image src={deal.cover} alt={deal.title} fill unoptimized
                 className="object-cover transition-transform duration-400 group-hover:scale-[1.07]" />
        )}
        <div className="absolute top-1.5 left-1.5 font-pixel rounded"
             style={{ background: '#EF4444', color: '#fff', fontSize: '8px', padding: '2px 5px',
                      letterSpacing: '0.04em', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }}>
          -{deal.discountPct}%
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, transparent, rgba(13,13,22,0.7))' }} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <h4 className="font-heading font-semibold text-white line-clamp-1 mb-1" style={{ fontSize: '13px' }}>
          {deal.title}
        </h4>
        <div className="flex items-center gap-2 mb-2.5">
          {deal.rating !== null && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
              <span className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>{deal.rating.toFixed(1)}</span>
            </div>
          )}
          {deal.platforms.length > 0 && (
            <>
              {deal.rating !== null && <span style={{ color: '#2D2D44', fontSize: '10px' }}>·</span>}
              <span className="font-body text-[#4B5563]" style={{ fontSize: '10.5px' }}>
                {deal.platforms.slice(0, 2).join(' · ')}
              </span>
            </>
          )}
        </div>
        <div className="mb-3">
          <p className="font-heading font-bold text-white leading-none" style={{ fontSize: '15px' }}>
            {deal.discountedPrice > 0 ? formatPrice(deal.discountedPrice) : formatPrice(deal.priceUzs)}
          </p>
          {deal.discountedPrice > 0 && deal.discountedPrice < deal.priceUzs && (
            <p className="font-body line-through mt-0.5" style={{ fontSize: '11px', color: '#374151' }}>
              {formatPrice(deal.priceUzs)}
            </p>
          )}
        </div>
        <div className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg font-heading font-semibold text-white"
             style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 60%, #06B6D4 130%)',
                      padding: '6px 12px', fontSize: '11.5px', boxShadow: '0 0 0 1px rgba(124,58,237,0.3)' }}>
          Смотреть
        </div>
      </div>
    </Link>
  );
}
