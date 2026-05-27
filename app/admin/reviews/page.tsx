'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Check, X, Trash2, MessageSquare, Loader2, ExternalLink, RefreshCw } from 'lucide-react';

type Review = {
  id:          string;
  rating:      number;
  body:        string | null;
  authorName:  string | null;
  authorEmail: string | null;
  verified:    boolean;
  isApproved:  boolean;
  createdAt:   string;
  game:        { id: string; title: string; slug: string; cover: string | null };
  user:        { username: string; email: string } | null;
};

type ApiResult = { success: boolean; data: Review[]; total: number; page: number; pages: number };

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} style={{
          width: '12px', height: '12px',
          color: i < rating ? '#F59E0B' : '#1F2937',
          fill:  i < rating ? '#F59E0B' : 'transparent',
        }} />
      ))}
    </div>
  );
}

export default function ReviewsModerationPage() {
  const [tab,     setTab]     = useState<'pending' | 'approved' | 'all'>('pending');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState<string | null>(null);

  const load = useCallback(async (t = tab, p = page) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/reviews?status=${t}&page=${p}`);
      const data = await res.json() as ApiResult;
      if (data.success) {
        setReviews(data.data);
        setTotal(data.total);
        setPages(data.pages);
      }
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string, val: boolean) => {
    setActing(id);
    await fetch(`/api/admin/reviews/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isApproved: val }),
    });
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setTotal((t) => t - 1);
    setActing(null);
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить отзыв?')) return;
    setActing(id);
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setTotal((t) => t - 1);
    setActing(null);
  };

  const switchTab = (t: typeof tab) => { setTab(t); setPage(1); load(t, 1); };

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <MessageSquare style={{ width: '18px', height: '18px', color: '#F59E0B' }} />
          </div>
          <div>
            <h1 className="font-heading font-bold text-white text-lg">Модерация отзывов</h1>
            <p className="text-[#6B7280] text-sm">{total} отзывов</p>
          </div>
        </div>
        <button onClick={() => load()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-[#6B7280] transition-colors hover:text-white"
                style={{ background: '#1A1A28', border: '1px solid #1E1E2E' }}>
          <RefreshCw style={{ width: '13px' }} /> Обновить
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['pending', 'Ожидают'], ['approved', 'Одобренные'], ['all', 'Все']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => switchTab(val)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: tab === val ? 'rgba(245,158,11,0.12)' : 'transparent',
              border:     `1px solid ${tab === val ? 'rgba(245,158,11,0.35)' : '#1E1E2E'}`,
              color:      tab === val ? '#F59E0B' : '#6B7280',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="animate-spin text-[#7C3AED]" style={{ width: '28px' }} />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 rounded-2xl"
             style={{ background: '#12121A', border: '1px solid #1E1E2E' }}>
          <MessageSquare style={{ width: '28px', color: '#374151', marginBottom: '8px' }} />
          <p className="text-[#4B5563] text-sm">Нет отзывов</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id}
                 className="rounded-2xl p-4"
                 style={{ background: '#12121A', border: `1px solid ${r.isApproved ? '#1E3A28' : '#1E1E2E'}` }}>
              <div className="flex gap-4">
                {/* Game cover */}
                <Link href={`/product/${r.game.slug}`} target="_blank" className="flex-shrink-0">
                  <div className="w-16 h-10 rounded-lg overflow-hidden relative">
                    {r.game.cover ? (
                      <Image src={r.game.cover} alt={r.game.title} fill unoptimized className="object-cover" />
                    ) : (
                      <div className="w-full h-full" style={{ background: '#1A1A28' }} />
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                    <div>
                      <Link href={`/product/${r.game.slug}`} target="_blank"
                            className="flex items-center gap-1 font-semibold text-white text-sm hover:text-[#7C3AED] transition-colors">
                        {r.game.title}
                        <ExternalLink style={{ width: '11px' }} />
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Stars rating={r.rating} />
                        <span className="text-xs text-[#4B5563]">
                          {r.user ? r.user.username : r.authorName ?? 'Гость'}
                          {r.user ? ` · ${r.user.email}` : r.authorEmail ? ` · ${r.authorEmail}` : ''}
                        </span>
                        {r.verified && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
                            Покупатель
                          </span>
                        )}
                        {r.isApproved && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.08)', color: '#4ADE80' }}>
                            Одобрен
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-[#4B5563] flex-shrink-0">
                      {new Date(r.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {r.body && (
                    <p className="text-[#9CA3AF] text-sm mt-2 leading-relaxed line-clamp-3">{r.body}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #1E1E2E' }}>
                {!r.isApproved && (
                  <button
                    onClick={() => approve(r.id, true)}
                    disabled={acting === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ADE80' }}
                  >
                    {acting === r.id ? <Loader2 className="animate-spin" style={{ width: '12px' }} /> : <Check style={{ width: '12px' }} />}
                    Одобрить
                  </button>
                )}
                {r.isApproved && (
                  <button
                    onClick={() => approve(r.id, false)}
                    disabled={acting === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}
                  >
                    <X style={{ width: '12px' }} /> Отклонить
                  </button>
                )}
                <button
                  onClick={() => remove(r.id)}
                  disabled={acting === r.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ml-auto"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444' }}
                >
                  <Trash2 style={{ width: '12px' }} /> Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => { setPage(i + 1); load(tab, i + 1); }}
              className="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: page === i + 1 ? 'rgba(124,58,237,0.2)' : '#1A1A28',
                border:     `1px solid ${page === i + 1 ? 'rgba(124,58,237,0.4)' : '#1E1E2E'}`,
                color:      page === i + 1 ? '#A78BFA' : '#6B7280',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
