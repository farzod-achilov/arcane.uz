'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Star, ThumbsUp, Check, Send, Loader2, CheckCircle2 } from 'lucide-react';

interface ApiReview {
  id:         string;
  rating:     number;
  body:       string | null;
  authorName: string;
  avatar:     string | null;
  verified:   boolean;
  createdAt:  string;
}

interface ProductReviewsProps {
  slug:         string;
  productTitle: string;
}

function StarRow({ rating, max = 5, size = 13 }: { rating: number; max?: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} style={{
          width: `${size}px`, height: `${size}px`,
          color: i < Math.round(rating) ? '#F59E0B' : '#1F2937',
          fill:  i < Math.round(rating) ? '#F59E0B' : 'transparent',
        }} />
      ))}
    </div>
  );
}

function InteractiveStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1;
        const lit = n <= (hover || value);
        return (
          <button key={i} type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
          >
            <Star style={{
              width: '22px', height: '22px',
              color: lit ? '#F59E0B' : '#374151',
              fill:  lit ? '#F59E0B' : 'transparent',
              transition: 'all 0.1s',
            }} />
          </button>
        );
      })}
    </div>
  );
}

function RatingSummary({ avg, total, dist }: { avg: number; total: number; dist: { rating: number; count: number }[] }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col sm:flex-row items-center sm:items-start gap-6"
         style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="text-center flex-shrink-0">
        <p className="font-pixel text-white mb-1"
           style={{ fontSize: '40px', letterSpacing: '-0.02em', textShadow: '0 0 20px rgba(245,158,11,0.4)' }}>
          {avg.toFixed(1)}
        </p>
        <StarRow rating={avg} />
        <p className="font-body text-[#4B5563] mt-2" style={{ fontSize: '11px' }}>
          {total.toLocaleString('ru')} отзывов
        </p>
      </div>
      <div className="flex-1 w-full space-y-1.5">
        {[5, 4, 3, 2, 1].map((stars) => {
          const d = dist.find((d) => d.rating === stars);
          const pct = total > 0 ? ((d?.count ?? 0) / total) * 100 : 0;
          return (
            <div key={stars} className="flex items-center gap-2.5">
              <span className="font-body text-[#4B5563] flex-shrink-0" style={{ fontSize: '11px', width: '8px' }}>{stars}</span>
              <Star style={{ width: '10px', height: '10px', color: '#F59E0B', fill: '#F59E0B', flexShrink: 0 }} />
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  initial={{ width: 0 }} whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }} transition={{ duration: 0.7, delay: (5 - stars) * 0.07, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: stars >= 4 ? '#22C55E' : stars === 3 ? '#F59E0B' : '#EF4444' }}
                />
              </div>
              <span className="font-body text-[#374151] flex-shrink-0" style={{ fontSize: '11px', width: '32px' }}>
                {pct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewCard({ review, index }: { review: ApiReview; index: number }) {
  const [helpful, setHelpful] = useState(0);
  const [voted,   setVoted]   = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: index * 0.06 }}
      className="rounded-2xl p-5"
      style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.22)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center font-heading font-bold text-white"
             style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', fontSize: '14px' }}>
          {review.avatar
            ? <Image src={review.avatar} alt={review.authorName} width={40} height={40} unoptimized className="object-cover w-full h-full" />
            : review.authorName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>{review.authorName}</span>
            {review.verified && (
              <div className="flex items-center gap-1 rounded px-1.5 py-0.5"
                   style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <Check style={{ width: '9px', height: '9px', color: '#22C55E' }} />
                <span className="font-body text-[#22C55E]" style={{ fontSize: '9px' }}>Покупатель</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRow rating={review.rating} />
            <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
              {new Date(review.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {review.body && (
        <p className="font-body text-[#9CA3AF] mb-4" style={{ fontSize: '13px', lineHeight: '1.65' }}>{review.body}</p>
      )}

      <button
        onClick={() => { if (!voted) { setHelpful((h) => h + 1); setVoted(true); } }}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all duration-200"
        style={{
          background: voted ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
          border:     `1px solid ${voted ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)'}`,
          color:      voted ? '#22C55E' : '#4B5563',
        }}
      >
        <ThumbsUp style={{ width: '11px', height: '11px' }} />
        <span className="font-body" style={{ fontSize: '11px' }}>Полезно ({helpful})</span>
      </button>
    </motion.div>
  );
}

export default function ProductReviews({ slug, productTitle }: ProductReviewsProps) {
  const [reviews,  setReviews]  = useState<ApiReview[]>([]);
  const [avg,      setAvg]      = useState(0);
  const [total,    setTotal]    = useState(0);
  const [dist,     setDist]     = useState<{ rating: number; count: number }[]>([]);
  const [loaded,   setLoaded]   = useState(false);
  const [showAll,  setShowAll]  = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [rating,  setRating]  = useState(0);
  const [body,    setBody]    = useState('');
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [formErr, setFormErr] = useState('');

  useEffect(() => {
    fetch(`/api/games/${slug}/reviews`)
      .then((r) => r.json())
      .then((d) => {
        if (d.reviews) {
          setReviews(d.reviews);
          setAvg(d.avgRating ?? 0);
          setTotal(d.total ?? 0);
          setDist(d.dist ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { setFormErr('Выберите оценку'); return; }
    if (!name.trim() || !email.trim()) { setFormErr('Укажите имя и email'); return; }
    setSending(true);
    setFormErr('');
    try {
      const res  = await fetch(`/api/games/${slug}/reviews`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rating, body: body.trim(), authorName: name, authorEmail: email }),
      });
      const data = await res.json();
      if (!res.ok) { setFormErr(data.error ?? 'Ошибка'); return; }
      setSent(true);
    } catch {
      setFormErr('Ошибка сети');
    } finally {
      setSending(false);
    }
  };

  const visible = showAll ? reviews : reviews.slice(0, 3);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.5 }}
      className="mb-12"
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1" style={{ background: 'rgba(245,158,11,0.15)' }} />
        <p className="font-pixel" style={{ fontSize: '9px', color: '#F59E0B', letterSpacing: '0.14em' }}>ОТЗЫВЫ ПОКУПАТЕЛЕЙ</p>
        <div className="h-px flex-1" style={{ background: 'rgba(245,158,11,0.15)' }} />
      </div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-white text-xl sm:text-2xl">Что говорят игроки</h2>
        {!showForm && !sent && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA' }}
          >
            <Send style={{ width: '13px' }} /> Оставить отзыв
          </button>
        )}
      </div>

      {/* Rating summary */}
      {loaded && total > 0 && (
        <div className="mb-6">
          <RatingSummary avg={avg} total={total} dist={dist} />
        </div>
      )}

      {/* Submit form */}
      <AnimatePresence>
        {showForm && !sent && (
          <motion.form
            key="form"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="rounded-2xl p-5 mb-6 overflow-hidden"
            style={{ background: '#0D0D16', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            <p className="font-heading font-semibold text-white mb-4" style={{ fontSize: '14px' }}>
              Ваш отзыв на «{productTitle}»
            </p>

            <div className="mb-4">
              <label className="text-xs text-[#6B7280] block mb-2">Оценка *</label>
              <InteractiveStars value={rating} onChange={setRating} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Имя *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-[#6B7280] block mb-1">Комментарий (необязательно)</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)}
                placeholder="Поделитесь впечатлениями..."
                rows={3}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>

            {formErr && <p className="text-red-400 text-xs mb-3">{formErr}</p>}

            <div className="flex gap-2">
              <button type="submit" disabled={sending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}>
                {sending ? <Loader2 className="animate-spin" style={{ width: '14px' }} /> : <Send style={{ width: '14px' }} />}
                Отправить отзыв
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl text-sm text-[#6B7280] transition-colors hover:text-white"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                Отмена
              </button>
            </div>
          </motion.form>
        )}

        {sent && (
          <motion.div key="sent"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5 mb-6 flex items-start gap-3"
            style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <CheckCircle2 style={{ width: '18px', color: '#22C55E', flexShrink: 0 }} />
            <div>
              <p className="font-semibold text-green-400 text-sm">Отзыв отправлен!</p>
              <p className="text-[#4B5563] text-xs mt-0.5">Он появится после проверки модератором.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {loaded && total === 0 && (
        <div className="rounded-2xl p-8 text-center mb-6"
             style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="font-body text-[#4B5563] text-sm">Пока нет отзывов. Будьте первым!</p>
        </div>
      )}

      {/* Review cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {visible.map((r, i) => <ReviewCard key={r.id} review={r} index={i} />)}
        </AnimatePresence>
      </div>

      {reviews.length > 3 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="font-heading font-semibold px-6 py-2.5 rounded-xl transition-all duration-200"
            style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.08)', fontSize: '13px', color: '#6B7280' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.35)'; (e.currentTarget as HTMLElement).style.color = '#9D60FA'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#6B7280'; }}
          >
            {showAll ? 'Скрыть отзывы' : `Показать все ${reviews.length} отзывов`}
          </button>
        </div>
      )}
    </motion.section>
  );
}
