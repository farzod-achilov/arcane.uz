'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, MessageSquare, Send, Loader2, CheckCircle2, LogIn } from 'lucide-react';
import Link from 'next/link';
import StarRating from './StarRating';

interface Review {
  id:        string;
  rating:    number;
  body:      string | null;
  verified:  boolean;
  createdAt: string;
  username:  string;
  avatar:    string | null;
}

interface ReviewsData {
  reviews:   Review[];
  avgRating: number;
  total:     number;
  dist:      { rating: number; count: number }[];
}

export default function ReviewSection({ slug }: { slug: string }) {
  const { data: session, status } = useSession();
  const [data, setData]     = useState<ReviewsData | null>(null);
  const [rating, setRating] = useState(0);
  const [body, setBody]     = useState('');
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [error, setError]           = useState('');

  const load = useCallback(() => {
    fetch(`/api/games/${slug}/reviews`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) { setError('Выберите оценку'); return; }
    if (!session && (!name.trim() || !email.trim())) {
      setError('Укажите имя и email');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/games/${slug}/reviews`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(
          session
            ? { rating, body }
            : { rating, body, authorName: name.trim(), authorEmail: email.trim() }
        ),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Ошибка'); return; }
      setSubmitted(true);
      setShowForm(false);
    } catch {
      setError('Ошибка сети');
    } finally {
      setSubmitting(false);
    }
  }

  if (!data) return null;

  const maxCount = Math.max(...data.dist.map(d => d.count), 1);

  return (
    <div className="mt-10 pt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-white text-xl flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#7C3AED]" />
          Отзывы
          {data.total > 0 && (
            <span className="font-body text-sm text-[#4B5563]">({data.total})</span>
          )}
        </h2>

        {!submitted && !showForm && status !== 'loading' && (
          <button
            onClick={() => setShowForm(true)}
            className="font-heading font-semibold text-sm px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            style={{
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.3)',
              color: '#A78BFA',
            }}
          >
            <Send className="w-3.5 h-3.5" />
            Написать отзыв
          </button>
        )}
        {showForm && !submitted && (
          <button
            onClick={() => { setShowForm(false); setError(''); }}
            className="font-heading font-semibold text-sm px-4 py-2 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#6B7280' }}
          >
            Отмена
          </button>
        )}
      </div>

      {/* Rating summary */}
      {data.total > 0 && (
        <div className="flex gap-8 mb-8 p-5 rounded-2xl" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-center flex-shrink-0">
            <p className="font-heading font-bold text-white" style={{ fontSize: '48px', lineHeight: 1 }}>
              {data.avgRating.toFixed(1)}
            </p>
            <StarRating value={Math.round(data.avgRating)} size={14} readonly />
            <p className="font-body text-xs text-[#4B5563] mt-1">{data.total} отзывов</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {data.dist.map(d => (
              <div key={d.rating} className="flex items-center gap-2">
                <span className="font-body text-xs text-[#6B7280] w-4 text-right">{d.rating}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(d.count / maxCount) * 100}%`,
                      background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
                    }}
                  />
                </div>
                <span className="font-body text-xs text-[#4B5563] w-4">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 rounded-2xl p-4 mb-6"
            style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-heading font-semibold text-green-400 text-sm">Отзыв отправлен!</p>
              <p className="font-body text-[#4B5563] text-xs mt-0.5">Он появится после проверки модератором.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review form */}
      <AnimatePresence>
        {showForm && !submitted && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={submit}
            className="mb-6 p-5 rounded-2xl space-y-4"
            style={{ background: '#0D0D16', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            {/* Guest name/email */}
            {!session && (
              <>
                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-1"
                     style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
                  <LogIn className="w-3.5 h-3.5 text-[#7C3AED] flex-shrink-0" />
                  <p className="font-body text-[#9CA3AF] text-xs">
                    Или{' '}
                    <Link href="/login" className="text-[#A78BFA] hover:underline">войдите</Link>
                    {' '}для верифицированного отзыва
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-pixel text-[#4B5563] block mb-1.5" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>ИМЯ *</label>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ваше имя"
                      className="w-full font-body text-sm text-white rounded-xl px-3 py-2.5 outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)')}
                      onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                    />
                  </div>
                  <div>
                    <label className="font-pixel text-[#4B5563] block mb-1.5" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>EMAIL *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full font-body text-sm text-white rounded-xl px-3 py-2.5 outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)')}
                      onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Rating */}
            <div>
              <p className="font-pixel text-[#4B5563] mb-2" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>ОЦЕНКА *</p>
              <StarRating value={rating} onChange={setRating} size={26} />
            </div>

            {/* Body */}
            <div>
              <p className="font-pixel text-[#4B5563] mb-2" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>КОММЕНТАРИЙ (необязательно)</p>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Расскажите об игре..."
                maxLength={1000}
                rows={3}
                className="w-full font-body text-sm text-white rounded-xl px-4 py-3 resize-none outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#E2E8F0' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)')}
                onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>

            {error && (
              <p className="font-body text-red-400 text-xs">{error}</p>
            )}

            <button
              type="submit"
              disabled={!rating || submitting}
              className="flex items-center gap-2 font-heading font-semibold text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#fff' }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Отправить отзыв
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Reviews list */}
      {data.reviews.length === 0 ? (
        <p className="font-body text-sm text-[#4B5563] text-center py-8">Отзывов пока нет. Будьте первым!</p>
      ) : (
        <div className="space-y-3">
          {data.reviews.map(r => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-xl"
              style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-heading font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', fontSize: '12px' }}
                >
                  {r.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-heading font-semibold text-white text-sm">{r.username}</span>
                    {r.verified && (
                      <span className="inline-flex items-center gap-1 font-pixel px-1.5 py-0.5 rounded"
                            style={{ fontSize: '7px', color: '#22C55E', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <ShieldCheck className="w-2.5 h-2.5" />
                        КУПИЛ
                      </span>
                    )}
                    <StarRating value={r.rating} size={12} readonly />
                    <span className="font-body text-xs text-[#374151] ml-auto">
                      {new Date(r.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  {r.body && (
                    <p className="font-body text-sm text-[#9CA3AF] leading-relaxed">{r.body}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
