'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles, Star, Zap, ArrowRight, Calendar, Clock,
  Package, ShoppingCart, Bell, Check
} from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import { products } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';

/* ── Release countdown ─────────────────────────────────── */
function ReleaseCountdown({ releaseDate }: { releaseDate: string }) {
  const target = new Date(releaseDate).getTime();
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [released, setReleased] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setReleased(true); return; }
      setT({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff % 86_400_000) / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      });
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [target]);

  const p = (n: number) => String(n).padStart(2, '0');

  if (released) {
    return (
      <span
        className="font-pixel text-[#22C55E]"
        style={{ fontSize: '8px', letterSpacing: '0.08em' }}
      >
        ВЫШЛО
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {[
        { v: t.d, l: 'дн' },
        { v: t.h, l: 'ч' },
        { v: t.m, l: 'м' },
        { v: t.s, l: 'с' },
      ].map((u, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className="flex flex-col items-center rounded-lg px-2.5 py-1.5 min-w-[40px]"
            style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.2)' }}
          >
            <span
              className="font-pixel text-[#22D3EE] leading-none"
              style={{ fontSize: '13px', textShadow: '0 0 8px rgba(6,182,212,0.55)' }}
            >
              {p(u.v)}
            </span>
            <span
              className="font-body text-[#374151] mt-0.5"
              style={{ fontSize: '7px', letterSpacing: '0.08em' }}
            >
              {u.l}
            </span>
          </div>
          {i < 3 && (
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="font-pixel text-[#06B6D4]/35 self-start mt-1"
              style={{ fontSize: '11px' }}
            >
              :
            </motion.span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Preorder card ─────────────────────────────────────── */
function PreorderCard({ product, index }: { product: (typeof products)[number]; index: number }) {
  const [notified, setNotified] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.09 }}
      whileHover={{ y: -4 }}
    >
      <Link
        href={`/product/${product.id}`}
        className="group relative flex flex-col rounded-2xl overflow-hidden h-full transition-all duration-300"
        style={{ background: '#0D0D16', border: '1px solid rgba(124,58,237,0.15)' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.3)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 0 28px rgba(6,182,212,0.08), 0 12px 40px rgba(0,0,0,0.5)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.15)';
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
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(13,13,22,0.9) 100%)' }}
          />

          {/* PRE-ORDER badge */}
          <div
            className="absolute top-3 left-3 font-pixel text-white rounded-lg"
            style={{
              fontSize: '8px',
              background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
              padding: '4px 9px',
              letterSpacing: '0.06em',
              boxShadow: '0 0 14px rgba(245,158,11,0.5)',
            }}
          >
            PRE-ORDER
          </div>

          {/* Release date on image */}
          {product.releaseDate && (
            <div
              className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
              style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(6,182,212,0.2)' }}
            >
              <Calendar className="w-3 h-3 text-[#22D3EE]" />
              <span className="font-body text-[#9CA3AF]" style={{ fontSize: '10.5px' }}>
                {new Date(product.releaseDate).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4">
          {product.subtitle && (
            <p className="font-body text-[#374151] truncate mb-0.5" style={{ fontSize: '11px' }}>
              {product.subtitle}
            </p>
          )}
          <h3 className="font-heading font-bold text-white line-clamp-1 mb-2" style={{ fontSize: '14px' }}>
            {product.title}
          </h3>

          {/* Platforms */}
          <div className="flex flex-wrap gap-1 mb-3">
            {product.platform.slice(0, 3).map((p) => (
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

          {/* Countdown */}
          {product.releaseDate && (
            <div className="mb-3">
              <p className="font-body text-[#4B5563] mb-1.5" style={{ fontSize: '10px' }}>
                До релиза:
              </p>
              <ReleaseCountdown releaseDate={product.releaseDate} />
            </div>
          )}

          {/* Price + buttons */}
          <div className="mt-auto pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="font-heading font-bold text-white mb-2.5" style={{ fontSize: '18px' }}>
              {formatPrice(product.price)}
            </p>
            <div className="flex gap-2">
              <Link
                href={`/product/${product.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl font-heading font-semibold text-white py-2.5 relative overflow-hidden transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.85), rgba(6,182,212,0.85))',
                  fontSize: '12px',
                  boxShadow: '0 0 16px rgba(124,58,237,0.25)',
                }}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Предзаказ
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); setNotified((v) => !v); }}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                style={{
                  background: notified ? 'rgba(245,158,11,0.12)' : '#0A0A0F',
                  border: `1px solid ${notified ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  color: notified ? '#FCD34D' : '#4B5563',
                }}
                title={notified ? 'Уведомление включено' : 'Уведомить о выходе'}
              >
                {notified ? <Check className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Page ──────────────────────────────────────────────── */
export default function NewReleasesPage() {
  const preorderProducts = products.filter((p) => p.preorder);
  const newProducts = products.filter((p) => (p.badge === 'new' || p.badge === 'hot') && !p.preorder);
  const featured = newProducts[0] ?? products[0];
  const restNew = newProducts.slice(1);
  const trending = products.filter((p) => !newProducts.includes(p) && !p.preorder).slice(0, 4);

  return (
    <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
      {/* Grid bg */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          opacity: 0.012,
        }}
      />
      <div
        className="fixed top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(124,58,237,0.4) 40%, rgba(6,182,212,0.5) 65%, transparent 95%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)' }}
          >
            <Sparkles style={{ width: '13px', height: '13px', color: '#06B6D4' }} />
            <span
              className="font-heading font-semibold text-[#22D3EE]"
              style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}
            >
              Свежие релизы
            </span>
          </div>
          <h1 className="font-heading font-bold text-white" style={{ fontSize: 'clamp(26px, 4vw, 40px)' }}>
            Новинки &amp;{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #9D60FA, #06B6D4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Релизы
            </span>
          </h1>
          <p className="font-body text-[#6B7280] mt-2" style={{ fontSize: '15px' }}>
            Самые свежие игры — мгновенная доставка ключа
          </p>
        </motion.div>

        {/* ── Preorder section ── */}
        {preorderProducts.length > 0 && (
          <section className="mb-14">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <Clock style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
              <h2
                className="font-heading font-semibold text-[#9CA3AF]"
                style={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase' }}
              >
                Предзаказы
              </h2>
              <div className="flex-1 h-px" style={{ background: 'rgba(245,158,11,0.12)' }} />
              <span
                className="font-pixel text-[#F59E0B] rounded-lg px-2 py-1"
                style={{
                  fontSize: '8px',
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.2)',
                }}
              >
                {preorderProducts.length} ИГР
              </span>
            </div>

            {/* Preorder big feature (first item) + cards */}
            {preorderProducts.length === 1 ? (
              <PreorderCard product={preorderProducts[0]} index={0} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {preorderProducts.map((p, i) => (
                  <PreorderCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Featured new release ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="group relative rounded-2xl overflow-hidden mb-10"
          style={{ border: '1px solid rgba(6,182,212,0.18)', background: '#0D0D16' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 100% at 65% 50%, rgba(124,58,237,0.08) 0%, transparent 70%)',
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
              <div
                className="absolute top-2.5 left-2.5 font-pixel rounded text-white"
                style={{
                  fontSize: '8px',
                  background: '#06B6D4',
                  padding: '3px 7px',
                  letterSpacing: '0.06em',
                  boxShadow: '0 0 10px rgba(6,182,212,0.6)',
                }}
              >
                NEW
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Star style={{ width: '13px', height: '13px', color: '#F59E0B', fill: '#F59E0B' }} />
                  <span className="font-body text-[#9CA3AF]" style={{ fontSize: '13px' }}>
                    {featured.rating} · {featured.reviews.toLocaleString('ru')} отзывов
                  </span>
                </div>
                {featured.releaseDate && (
                  <div
                    className="flex items-center gap-1 rounded-lg px-2 py-0.5"
                    style={{
                      background: 'rgba(6,182,212,0.08)',
                      border: '1px solid rgba(6,182,212,0.18)',
                    }}
                  >
                    <Calendar className="w-3 h-3 text-[#22D3EE]" />
                    <span className="font-body text-[#22D3EE]" style={{ fontSize: '11px' }}>
                      {new Date(featured.releaseDate).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
              <h2
                className="font-heading font-bold text-white mb-1"
                style={{ fontSize: 'clamp(18px, 2.5vw, 28px)' }}
              >
                {featured.title}
              </h2>
              <p className="font-body text-[#374151] mb-1" style={{ fontSize: '13px' }}>
                {featured.subtitle}
              </p>
              <p
                className="font-body text-[#6B7280] mb-5 line-clamp-2"
                style={{ fontSize: '14px', lineHeight: '1.65' }}
              >
                {featured.description}
              </p>

              <div className="flex items-baseline gap-3 mb-5">
                <span className="font-heading font-bold text-white" style={{ fontSize: '26px' }}>
                  {formatPrice(featured.price)}
                </span>
                <div className="flex items-center gap-1.5">
                  <Zap style={{ width: '12px', height: '12px', color: '#22C55E' }} />
                  <span className="font-body text-[#22C55E]" style={{ fontSize: '13px' }}>
                    Мгновенная доставка
                  </span>
                </div>
              </div>

              <Link
                href={`/product/${featured.id}`}
                className="group/btn relative inline-flex items-center gap-2 rounded-xl font-heading font-semibold text-white overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                  padding: '11px 22px',
                  fontSize: '13.5px',
                  boxShadow: '0 0 0 1px rgba(124,58,237,0.4), 0 4px 20px rgba(124,58,237,0.3)',
                }}
              >
                <span
                  className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent 55%)' }}
                />
                <span className="relative z-10">Смотреть игру</span>
                <ArrowRight style={{ width: '14px', height: '14px' }} className="relative z-10" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── More new releases ── */}
        {restNew.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <Sparkles style={{ width: '14px', height: '14px', color: '#06B6D4' }} />
              <h2
                className="font-heading font-semibold text-[#9CA3AF]"
                style={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase' }}
              >
                Свежие релизы
              </h2>
              <div className="flex-1 h-px" style={{ background: 'rgba(6,182,212,0.12)' }} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 mb-12">
              {restNew.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </>
        )}

        {/* ── Trending section ── */}
        {trending.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <Star style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
              <h2
                className="font-heading font-semibold text-[#9CA3AF]"
                style={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase' }}
              >
                Популярное прямо сейчас
              </h2>
              <div className="flex-1 h-px" style={{ background: 'rgba(245,158,11,0.1)' }} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {trending.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
