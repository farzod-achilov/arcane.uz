'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Star, ThumbsUp, Check, Clock, Monitor } from 'lucide-react';
import type { ProductReview } from '@/lib/types';

interface ProductReviewsProps {
  reviews: ProductReview[];
  overallRating: number;
  totalReviews: number;
  productTitle: string;
}

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          style={{
            width: '13px', height: '13px',
            color: i < Math.round(rating) ? '#F59E0B' : '#1F2937',
            fill: i < Math.round(rating) ? '#F59E0B' : 'transparent',
          }}
        />
      ))}
    </div>
  );
}

function RatingSummary({
  rating, total,
}: { rating: number; total: number }) {
  const bars = [5, 4, 3, 2, 1].map((n) => {
    const rough = n === 5 ? 0.65 : n === 4 ? 0.22 : n === 3 ? 0.08 : n === 2 ? 0.03 : 0.02;
    return { stars: n, pct: rough * 100 };
  });

  return (
    <div
      className="rounded-2xl p-5 flex flex-col sm:flex-row items-center sm:items-start gap-6"
      style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Overall */}
      <div className="text-center flex-shrink-0">
        <p
          className="font-pixel text-white mb-1"
          style={{ fontSize: '40px', letterSpacing: '-0.02em', textShadow: '0 0 20px rgba(245,158,11,0.4)' }}
        >
          {rating.toFixed(1)}
        </p>
        <StarRow rating={rating} />
        <p className="font-body text-[#4B5563] mt-2" style={{ fontSize: '11px' }}>
          {total.toLocaleString('ru')} отзывов
        </p>
      </div>

      {/* Bars */}
      <div className="flex-1 w-full space-y-1.5">
        {bars.map(({ stars, pct }) => (
          <div key={stars} className="flex items-center gap-2.5">
            <span className="font-body text-[#4B5563] flex-shrink-0" style={{ fontSize: '11px', width: '8px' }}>
              {stars}
            </span>
            <Star style={{ width: '10px', height: '10px', color: '#F59E0B', fill: '#F59E0B', flexShrink: 0 }} />
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: (5 - stars) * 0.07, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: stars >= 4 ? '#22C55E' : stars === 3 ? '#F59E0B' : '#EF4444' }}
              />
            </div>
            <span className="font-body text-[#374151] flex-shrink-0" style={{ fontSize: '11px', width: '32px' }}>
              {pct.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ review, index }: { review: ProductReview; index: number }) {
  const [helpful, setHelpful] = useState(review.helpful ?? 0);
  const [voted, setVoted] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className="rounded-2xl p-5"
      style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.22)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
          <Image src={review.avatar} alt={review.author} fill unoptimized className="object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>
              {review.author}
            </span>
            {review.verified && (
              <div
                className="flex items-center gap-1 rounded px-1.5 py-0.5"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <Check style={{ width: '9px', height: '9px', color: '#22C55E' }} />
                <span className="font-body text-[#22C55E]" style={{ fontSize: '9px' }}>Проверено</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <StarRow rating={review.rating} />
            <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>{review.date}</span>
          </div>
        </div>
      </div>

      {/* Meta badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {review.platform && (
          <div
            className="flex items-center gap-1 rounded-lg px-2 py-1"
            style={{ background: 'rgba(102,192,244,0.08)', border: '1px solid rgba(102,192,244,0.15)' }}
          >
            <Monitor style={{ width: '9px', height: '9px', color: '#66C0F4' }} />
            <span className="font-body text-[#66C0F4]" style={{ fontSize: '10px' }}>{review.platform}</span>
          </div>
        )}
        {review.playtime && (
          <div
            className="flex items-center gap-1 rounded-lg px-2 py-1"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}
          >
            <Clock style={{ width: '9px', height: '9px', color: '#9D60FA' }} />
            <span className="font-body text-[#9D60FA]" style={{ fontSize: '10px' }}>{review.playtime}</span>
          </div>
        )}
      </div>

      {/* Review text */}
      <p className="font-body text-[#9CA3AF] mb-4" style={{ fontSize: '13px', lineHeight: '1.65' }}>
        {review.text}
      </p>

      {/* Helpful */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { if (!voted) { setHelpful(h => h + 1); setVoted(true); } }}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all duration-200"
          style={{
            background: voted ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${voted ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)'}`,
            color: voted ? '#22C55E' : '#4B5563',
          }}
        >
          <ThumbsUp style={{ width: '11px', height: '11px' }} />
          <span className="font-body" style={{ fontSize: '11px' }}>Полезно ({helpful})</span>
        </button>
      </div>
    </motion.div>
  );
}

export default function ProductReviews({
  reviews, overallRating, totalReviews, productTitle,
}: ProductReviewsProps) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? reviews : reviews.slice(0, 3);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1" style={{ background: 'rgba(245,158,11,0.15)' }} />
        <p className="font-pixel" style={{ fontSize: '9px', color: '#F59E0B', letterSpacing: '0.14em' }}>
          ОТЗЫВЫ ПОКУПАТЕЛЕЙ
        </p>
        <div className="h-px flex-1" style={{ background: 'rgba(245,158,11,0.15)' }} />
      </div>
      <h2 className="font-heading font-bold text-white text-xl sm:text-2xl mb-6">
        Что говорят игроки
      </h2>

      {/* Rating summary */}
      <div className="mb-6">
        <RatingSummary rating={overallRating} total={totalReviews} />
      </div>

      {/* Review cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {visible.map((review, i) => (
            <ReviewCard key={review.id} review={review} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {/* Show more */}
      {reviews.length > 3 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="font-heading font-semibold px-6 py-2.5 rounded-xl transition-all duration-200"
            style={{
              background: '#0D0D16',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '13px',
              color: '#6B7280',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.35)';
              (e.currentTarget as HTMLElement).style.color = '#9D60FA';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLElement).style.color = '#6B7280';
            }}
          >
            {showAll ? 'Скрыть отзывы' : `Показать все ${reviews.length} отзыва`}
          </button>
        </div>
      )}
    </motion.section>
  );
}
