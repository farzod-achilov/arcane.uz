'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Star, Zap, ArrowRight } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import { products } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';

export default function NewReleasesPage() {
  const newProducts = products.filter(p => p.badge === 'new' || p.badge === 'hot');
  const featured = newProducts[0] ?? products[0];
  const rest = newProducts.slice(1);
  const trending = products.filter(p => !newProducts.includes(p)).slice(0, 4);

  return (
    <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)',
             backgroundSize: '52px 52px',
             opacity: 0.012,
           }} />
      <div className="fixed top-0 left-0 right-0 h-px pointer-events-none"
           style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(124,58,237,0.4) 40%, rgba(6,182,212,0.5) 65%, transparent 95%)' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4"
               style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)' }}>
            <Sparkles style={{ width: '13px', height: '13px', color: '#06B6D4' }} />
            <span className="font-heading font-semibold text-[#22D3EE]"
                  style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}>
              Только что вышло
            </span>
          </div>
          <h1 className="font-heading font-bold text-white"
              style={{ fontSize: 'clamp(26px, 4vw, 40px)' }}>
            Новинки &{' '}
            <span style={{
              background: 'linear-gradient(90deg, #9D60FA, #06B6D4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Релизы
            </span>
          </h1>
          <p className="font-body text-[#6B7280] mt-2" style={{ fontSize: '15px' }}>
            Самые свежие игры — мгновенная доставка ключа
          </p>
        </motion.div>

        {/* Featured */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="group relative rounded-2xl overflow-hidden mb-10"
          style={{ border: '1px solid rgba(6,182,212,0.18)', background: '#0D0D16' }}
        >
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: 'radial-gradient(ellipse 60% 100% at 65% 50%, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />

          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
            <div className="relative w-full sm:w-40 aspect-[3/4] sm:aspect-auto sm:h-52 rounded-xl overflow-hidden flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featured.image} alt={featured.title}
                   className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                   loading="lazy" />
              <div className="absolute inset-0"
                   style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(13,13,22,0.6) 100%)' }} />
              {/* New badge */}
              <div className="absolute top-2.5 left-2.5 font-pixel rounded"
                   style={{ fontSize: '8px', background: '#06B6D4', color: '#fff',
                            padding: '3px 7px', letterSpacing: '0.06em',
                            boxShadow: '0 0 10px rgba(6,182,212,0.6)' }}>
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
              </div>
              <h2 className="font-heading font-bold text-white mb-1"
                  style={{ fontSize: 'clamp(18px, 2.5vw, 28px)' }}>
                {featured.title}
              </h2>
              <p className="font-body text-[#374151] mb-1" style={{ fontSize: '13px' }}>
                {featured.subtitle}
              </p>
              <p className="font-body text-[#6B7280] mb-5 line-clamp-2" style={{ fontSize: '14px', lineHeight: '1.65' }}>
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
                <span className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent 55%)' }} />
                <span className="relative z-10">В каталог</span>
                <ArrowRight style={{ width: '14px', height: '14px' }} className="relative z-10" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* New releases grid */}
        {rest.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <Sparkles style={{ width: '14px', height: '14px', color: '#06B6D4' }} />
              <h2 className="font-heading font-semibold text-[#9CA3AF]"
                  style={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Свежие релизы
              </h2>
              <div className="flex-1 h-px" style={{ background: 'rgba(6,182,212,0.12)' }} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 mb-12">
              {rest.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </>
        )}

        {/* Also popular section */}
        {trending.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <Star style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
              <h2 className="font-heading font-semibold text-[#9CA3AF]"
                  style={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Популярное прямо сейчас
              </h2>
              <div className="flex-1 h-px" style={{ background: 'rgba(245,158,11,0.1)' }} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {trending.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
