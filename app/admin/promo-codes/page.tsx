'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw, X,
  Loader2, ChevronLeft, ChevronRight, CalendarDays, Infinity as InfinityIcon,
} from 'lucide-react';

interface PromoCode {
  id: string; code: string; type: 'PERCENT' | 'FIXED';
  value: number; maxUses: number | null; usedCount: number;
  expiresAt: string | null; isActive: boolean; createdAt: string;
}

interface PageData { promos: PromoCode[]; total: number; pages: number }

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatValue(p: PromoCode) {
  return p.type === 'PERCENT' ? `${p.value}%` : `${p.value.toLocaleString('ru')} сум`;
}

// ── Create modal ───────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (p: PromoCode) => void }) {
  const [code,      setCode]      = useState('');
  const [type,      setType]      = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [value,     setValue]     = useState('');
  const [maxUses,   setMaxUses]   = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code, type, value: parseInt(value),
          maxUses:   maxUses   ? parseInt(maxUses)  : null,
          expiresAt: expiresAt ? expiresAt           : null,
        }),
      });
      const data = await res.json() as { ok?: boolean; promo?: PromoCode; error?: string };
      if (!res.ok) { setError(data.error ?? 'Ошибка'); return; }
      onCreate(data.promo!);
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: '#0D0D1A', border: '1px solid rgba(124,58,237,0.2)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-bold text-white text-lg">Новый промокод</h3>
          <button onClick={onClose} className="text-[#4B5563] hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Code */}
          <div>
            <label className="block text-[#9CA3AF] text-xs mb-1.5 font-medium uppercase tracking-wide">Код</label>
            <input
              value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER20"
              className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              required
            />
          </div>

          {/* Type + Value */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[#9CA3AF] text-xs mb-1.5 font-medium uppercase tracking-wide">Тип</label>
              <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                {(['PERCENT', 'FIXED'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className="flex-1 py-2 text-sm font-medium transition-all"
                    style={{
                      background: type === t ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.03)',
                      color: type === t ? '#A78BFA' : '#6B7280',
                    }}>
                    {t === 'PERCENT' ? '%' : 'Фикс'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-[#9CA3AF] text-xs mb-1.5 font-medium uppercase tracking-wide">
                {type === 'PERCENT' ? 'Процент' : 'Сумма (сум)'}
              </label>
              <input
                type="number" min="1" max={type === 'PERCENT' ? 100 : undefined}
                value={value} onChange={e => setValue(e.target.value)}
                placeholder={type === 'PERCENT' ? '10' : '50000'}
                className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                required
              />
            </div>
          </div>

          {/* MaxUses + Expires */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[#9CA3AF] text-xs mb-1.5 font-medium uppercase tracking-wide">Макс. использований</label>
              <input
                type="number" min="1"
                value={maxUses} onChange={e => setMaxUses(e.target.value)}
                placeholder="Без ограничений"
                className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[#9CA3AF] text-xs mb-1.5 font-medium uppercase tracking-wide">Истекает</label>
              <input
                type="date"
                value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#6B7280] transition-colors hover:text-white"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Отмена
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)' }}>
              {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Создать'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────
export default function PromoCodesPage() {
  const [data,       setData]       = useState<PageData | null>(null);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/promo-codes?page=${p}`);
      const json = await res.json() as PageData;
      setData(json);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  async function toggleActive(promo: PromoCode) {
    setTogglingId(promo.id);
    try {
      const res = await fetch(`/api/admin/promo-codes/${promo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      if (res.ok) {
        setData(d => d ? { ...d, promos: d.promos.map(p => p.id === promo.id ? { ...p, isActive: !promo.isActive } : p) } : d);
      }
    } finally { setTogglingId(null); }
  }

  async function deletePromo(id: string) {
    if (!confirm('Удалить промокод?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setData(d => d ? { ...d, promos: d.promos.filter(p => p.id !== id), total: d.total - 1 } : d);
      }
    } finally { setDeletingId(null); }
  }

  function handleCreated(promo: PromoCode) {
    setShowCreate(false);
    setData(d => d ? { ...d, promos: [promo, ...d.promos], total: d.total + 1 } : d);
  }

  const isExpired = (p: PromoCode) => !!p.expiresAt && new Date(p.expiresAt) < new Date();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <Ticket size={17} style={{ color: '#22C55E' }} />
          </div>
          <div>
            <h1 className="font-heading font-bold text-white text-xl">Промокоды</h1>
            <p className="text-[#4B5563] text-xs">{data?.total ?? '…'} кодов</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(page)} className="p-2 rounded-xl text-[#4B5563] hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)' }}>
            <Plus size={15} /> Создать
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Head */}
        <div className="grid gap-4 px-5 py-3"
             style={{
               gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1fr 1fr',
               background: 'rgba(255,255,255,0.02)',
               borderBottom: '1px solid rgba(255,255,255,0.04)',
             }}>
          {['Код', 'Скидка', 'Использования', 'Истекает', 'Статус', ''].map(h => (
            <span key={h} className="text-[#4B5563] text-xs font-medium uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#7C3AED]" />
          </div>
        ) : data?.promos.length === 0 ? (
          <div className="text-center py-16">
            <Ticket size={32} className="mx-auto mb-3 text-[#374151]" />
            <p className="text-[#4B5563] text-sm">Нет промокодов</p>
          </div>
        ) : (
          <AnimatePresence>
            {data?.promos.map((promo, i) => {
              const expired = isExpired(promo);
              return (
                <motion.div key={promo.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid gap-4 px-5 py-4 items-center"
                  style={{
                    gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1fr 1fr',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    opacity: !promo.isActive ? 0.55 : 1,
                  }}>
                  {/* Code */}
                  <div>
                    <code className="text-[#A78BFA] font-mono font-bold text-sm">{promo.code}</code>
                  </div>

                  {/* Value */}
                  <div>
                    <span className="text-white font-semibold text-sm">{formatValue(promo)}</span>
                    <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-md"
                          style={{
                            background: promo.type === 'PERCENT' ? 'rgba(124,58,237,0.15)' : 'rgba(6,182,212,0.12)',
                            color:      promo.type === 'PERCENT' ? '#A78BFA' : '#67E8F9',
                          }}>
                      {promo.type === 'PERCENT' ? '%' : 'сум'}
                    </span>
                  </div>

                  {/* Uses */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-sm">{promo.usedCount}</span>
                    <span className="text-[#4B5563] text-sm">/</span>
                    {promo.maxUses !== null
                      ? <span className="text-[#9CA3AF] text-sm">{promo.maxUses}</span>
                      : <InfinityIcon size={13} className="text-[#4B5563]" />}
                  </div>

                  {/* Expires */}
                  <div className="flex items-center gap-1.5">
                    <CalendarDays size={12} style={{ color: expired ? '#EF4444' : '#4B5563', flexShrink: 0 }} />
                    <span className="text-sm" style={{ color: expired ? '#EF4444' : '#9CA3AF' }}>
                      {formatDate(promo.expiresAt)}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    {expired ? (
                      <span className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>Истёк</span>
                    ) : promo.isActive ? (
                      <span className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ background: 'rgba(34,197,94,0.12)', color: '#4ADE80' }}>Активен</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ background: 'rgba(107,114,128,0.15)', color: '#6B7280' }}>Выкл</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => toggleActive(promo)}
                      className="p-1.5 rounded-lg transition-all hover:scale-105"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                      title={promo.isActive ? 'Деактивировать' : 'Активировать'}>
                      {togglingId === promo.id
                        ? <Loader2 size={14} className="animate-spin text-[#4B5563]" />
                        : promo.isActive
                          ? <ToggleRight size={14} style={{ color: '#22C55E' }} />
                          : <ToggleLeft  size={14} style={{ color: '#4B5563' }} />}
                    </button>
                    <button onClick={() => deletePromo(promo.id)}
                      className="p-1.5 rounded-lg transition-all hover:scale-105"
                      style={{ background: 'rgba(239,68,68,0.08)' }}
                      title="Удалить">
                      {deletingId === promo.id
                        ? <Loader2 size={14} className="animate-spin text-[#EF4444]" />
                        : <Trash2 size={14} style={{ color: '#EF4444' }} />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-xl text-[#4B5563] disabled:opacity-30 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-[#6B7280] text-sm">{page} / {data.pages}</span>
          <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
            className="p-2 rounded-xl text-[#4B5563] disabled:opacity-30 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreated} />}
      </AnimatePresence>
    </div>
  );
}
