'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Calendar, Flame, Clock, TrendingDown, Plus, Trash2, Search, X, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const TYPE_CFG = {
  flash:     { label: 'Flash Sale', color: '#EF4444', icon: Flame    },
  scheduled: { label: 'Плановая',   color: '#7C3AED', icon: Calendar },
  seasonal:  { label: 'Сезонная',   color: '#F59E0B', icon: Clock    },
};

interface GameOption { id: string; title: string; priceUzs: number | null; cover: string | null }
interface Discount {
  id: string; type: string; discountPct: number;
  isActive: boolean; isFeatured: boolean;
  startsAt: string | null; endsAt: string | null;
  games: { id: string; title: string; cover: string | null; priceUzs: number | null };
}

// ── Add Discount Modal ─────────────────────────────────────────────
function AddDiscountModal({ onClose, onAdd }: { onClose: () => void; onAdd: (d: Discount) => void }) {
  const [games,       setGames]       = useState<GameOption[]>([]);
  const [query,       setQuery]       = useState('');
  const [selected,    setSelected]    = useState<GameOption | null>(null);
  const [type,        setType]        = useState('flash');
  const [pct,         setPct]         = useState(20);
  const [startsAt,    setStartsAt]    = useState('');
  const [endsAt,      setEndsAt]      = useState('');
  const [loading,     setLoading]     = useState(false);
  const [searching,   setSearching]   = useState(false);
  const [error,       setError]       = useState('');

  const searchGames = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const res  = await fetch(`/api/admin/games?q=${encodeURIComponent(q)}&limit=20`);
      const data = await res.json() as { games?: GameOption[] };
      setGames(data.games ?? []);
    } catch { setGames([]); } finally { setSearching(false); }
  }, []);

  useEffect(() => { searchGames(query); }, [query, searchGames]);

  const handleSubmit = async () => {
    if (!selected)        { setError('Выберите игру'); return; }
    if (pct < 1 || pct > 99) { setError('Скидка: 1–99%'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/admin/discounts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ gameId: selected.id, type, discountPct: pct, startsAt: startsAt || null, endsAt: endsAt || null }),
      });
      const data = await res.json() as { ok?: boolean; discount?: Discount; error?: string };
      if (!res.ok) { setError(data.error ?? 'Ошибка'); return; }
      onAdd(data.discount!);
      onClose();
    } catch { setError('Ошибка сети'); } finally { setLoading(false); }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.1)' }}
        initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="font-heading font-bold text-white" style={{ fontSize: 17 }}>Добавить скидку</h2>
          <button onClick={onClose} className="text-[#4B5563] hover:text-white transition-colors">
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Game search */}
          <div>
            <label className="block font-body text-[#9CA3AF] mb-2" style={{ fontSize: 12 }}>Игра</label>
            {selected ? (
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.4)' }}>
                <span className="font-heading font-semibold text-white flex-1" style={{ fontSize: 13 }}>{selected.title}</span>
                <button onClick={() => setSelected(null)} className="text-[#4B5563] hover:text-white">
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" style={{ width: 14, height: 14 }} />
                <input
                  value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Поиск игры..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#09090E] text-white placeholder-[#374151] outline-none"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#4B5563]" style={{ width: 14, height: 14 }} />}
                {games.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10"
                    style={{ background: '#13131F', border: '1px solid rgba(255,255,255,0.1)', maxHeight: 200, overflowY: 'auto' }}>
                    {games.map(g => (
                      <button key={g.id} onClick={() => { setSelected(g); setQuery(''); setGames([]); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left">
                        <span className="font-body text-white flex-1" style={{ fontSize: 13 }}>{g.title}</span>
                        {g.priceUzs && <span className="font-body text-[#4B5563]" style={{ fontSize: 11 }}>{formatPrice(g.priceUzs)}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {!searching && games.length === 0 && query.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl px-4 py-3 text-center"
                    style={{ background: '#13131F', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span className="font-body text-[#4B5563]" style={{ fontSize: 12 }}>Игры не найдены</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block font-body text-[#9CA3AF] mb-2" style={{ fontSize: 12 }}>Тип акции</label>
            <div className="flex gap-2">
              {Object.entries(TYPE_CFG).map(([key, cfg]) => (
                <button key={key} onClick={() => setType(key)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all"
                  style={{
                    background: type === key ? `${cfg.color}18` : '#09090E',
                    border: `1px solid ${type === key ? cfg.color : 'rgba(255,255,255,0.08)'}`,
                    color: type === key ? cfg.color : '#4B5563',
                    fontSize: 11,
                  }}>
                  <cfg.icon style={{ width: 11, height: 11 }} />
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Discount % */}
          <div>
            <label className="block font-body text-[#9CA3AF] mb-2" style={{ fontSize: 12 }}>Скидка</label>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={99} value={pct} onChange={e => setPct(+e.target.value)} className="flex-1 accent-[#7C3AED]" />
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ background: '#09090E', border: '1px solid rgba(239,68,68,0.3)', minWidth: 60 }}>
                <span className="font-heading font-bold text-white" style={{ fontSize: 16 }}>{pct}</span>
                <span className="font-body text-[#EF4444]" style={{ fontSize: 13 }}>%</span>
              </div>
            </div>
            {selected?.priceUzs && (
              <p className="font-body text-[#22C55E] mt-1" style={{ fontSize: 12 }}>
                Цена после: {formatPrice(Math.round(selected.priceUzs * (1 - pct / 100)))}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Начало (необязательно)', val: startsAt, set: setStartsAt },
              { label: 'Конец (необязательно)',  val: endsAt,   set: setEndsAt   },
            ].map(f => (
              <div key={f.label}>
                <label className="block font-body text-[#9CA3AF] mb-1.5" style={{ fontSize: 11 }}>{f.label}</label>
                <input type="date" value={f.val} onChange={e => f.set(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090E] text-white outline-none"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, colorScheme: 'dark' }} />
              </div>
            ))}
          </div>

          {error && <p className="font-body text-[#EF4444]" style={{ fontSize: 12 }}>{error}</p>}

          <button onClick={handleSubmit} disabled={loading || !selected}
            className="w-full py-3 rounded-xl font-heading font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: 14 }}>
            {loading ? <><Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />Создание...</> : 'Добавить скидку'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Toggle ──────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className="w-9 h-5 rounded-full relative transition-all"
      style={{ background: value ? 'linear-gradient(90deg, #7C3AED, #06B6D4)' : '#1A1A28', border: value ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: value ? 'calc(100% - 18px)' : 2 }} />
    </button>
  );
}

// ── Main page ───────────────────────────────────────────────────────
export default function AdminDiscountsPage() {
  const [discounts,  setDiscounts]  = useState<Discount[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [savingId,   setSavingId]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetch('/api/admin/discounts').then(r => r.json()) as { discounts?: Discount[] };
      setDiscounts(data.discounts ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const patch = useCallback(async (id: string, body: Record<string, unknown>) => {
    setSavingId(id);
    try {
      const res  = await fetch(`/api/admin/discounts/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json() as { discount?: Discount };
      if (data.discount) setDiscounts(prev => prev.map(d => d.id === id ? data.discount! : d));
    } finally { setSavingId(null); }
  }, []);

  const remove = useCallback(async (id: string) => {
    if (!confirm('Удалить эту скидку?')) return;
    await fetch(`/api/admin/discounts/${id}`, { method: 'DELETE' });
    setDiscounts(prev => prev.filter(d => d.id !== id));
  }, []);

  const activeCount  = discounts.filter(d => d.isActive).length;
  const totalSavings = discounts.filter(d => d.isActive).reduce((s, d) =>
    s + Math.round((d.games.priceUzs ?? 0) * d.discountPct / 100), 0);

  return (
    <div className="p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start justify-between">
        <div>
          <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#EF4444', letterSpacing: '0.14em' }}>УПРАВЛЕНИЕ</p>
          <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>Скидки & Акции</h1>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
            {activeCount} активных скидок · Общая экономия покупателей: {formatPrice(totalSavings)}
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl font-heading font-semibold text-white px-4 py-2.5"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: 13 }}>
          <Plus style={{ width: 15, height: 15 }} />
          Добавить скидку
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Flash Sale', count: discounts.filter(d => d.type === 'flash').length,     color: '#EF4444', icon: Flame    },
          { label: 'Плановые',   count: discounts.filter(d => d.type === 'scheduled').length, color: '#7C3AED', icon: Calendar },
          { label: 'Сезонные',   count: discounts.filter(d => d.type === 'seasonal').length,  color: '#F59E0B', icon: Clock    },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }} className="rounded-2xl p-4"
            style={{ background: '#0D0D1A', border: `1px solid ${s.color}18` }}>
            <s.icon style={{ width: '14px', height: '14px', color: s.color, marginBottom: '8px' }} />
            <p className="font-pixel text-white mb-0.5" style={{ fontSize: '18px', color: s.color }}>{s.count}</p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="animate-spin text-[#7C3AED]" style={{ width: 20, height: 20 }} />
            <span className="font-body text-[#4B5563]" style={{ fontSize: 13 }}>Загрузка...</span>
          </div>
        ) : discounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Tag style={{ width: 32, height: 32, color: '#1F2937' }} />
            <p className="font-heading font-semibold text-[#374151]" style={{ fontSize: 15 }}>Скидок пока нет</p>
            <p className="font-body text-[#1F2937]" style={{ fontSize: 12 }}>Добавьте игры и назначьте им скидки</p>
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-xl font-heading font-semibold text-white px-4 py-2 mt-2"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: 13 }}>
              <Plus style={{ width: 14, height: 14 }} />
              Добавить первую скидку
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  {['Игра', 'Тип', 'Скидка', 'Цена до/после', 'Период', 'Активна', 'Featured', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-body text-[#374151] whitespace-nowrap"
                      style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {discounts.map((d, i) => {
                  const tc = TYPE_CFG[d.type as keyof typeof TYPE_CFG] ?? TYPE_CFG.flash;
                  const isSaving = savingId === d.id;
                  const discountedPrice = d.games.priceUzs
                    ? Math.round(d.games.priceUzs * (1 - d.discountPct / 100)) : null;
                  return (
                    <motion.tr key={d.id}
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.04 }}
                      className="hover:bg-white/[0.015] transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: isSaving ? 0.6 : 1 }}>

                      <td className="px-4 py-3">
                        <p className="font-body text-white" style={{ fontSize: '13px' }}>{d.games.title}</p>
                      </td>

                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1"
                          style={{ background: `${tc.color}10`, border: `1px solid ${tc.color}25` }}>
                          <tc.icon style={{ width: '10px', height: '10px', color: tc.color }} />
                          <span className="font-body" style={{ fontSize: '10.5px', color: tc.color }}>{tc.label}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input type="number" value={d.discountPct} min={1} max={99}
                            onChange={e => {
                              const val = Math.max(1, Math.min(99, +e.target.value));
                              setDiscounts(prev => prev.map(x => x.id === d.id ? { ...x, discountPct: val } : x));
                            }}
                            onBlur={e => patch(d.id, { discountPct: +e.target.value })}
                            className="bg-[#09090E] border border-[#EF4444]/30 rounded-lg px-2 py-1 text-white font-heading font-bold outline-none w-14 text-center"
                            style={{ fontSize: '13px' }} />
                          <span className="font-body text-[#EF4444]" style={{ fontSize: '12px' }}>%</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {d.games.priceUzs ? (
                          <div>
                            <p className="font-body text-[#374151] line-through" style={{ fontSize: '11px' }}>
                              {formatPrice(d.games.priceUzs)}
                            </p>
                            <p className="font-heading font-semibold text-[#22C55E]" style={{ fontSize: '13px' }}>
                              {discountedPrice ? formatPrice(discountedPrice) : '—'}
                            </p>
                          </div>
                        ) : <span className="text-[#374151]" style={{ fontSize: 11 }}>—</span>}
                      </td>

                      <td className="px-4 py-3">
                        {d.startsAt || d.endsAt ? (
                          <div>
                            <p className="font-body text-[#6B7280]" style={{ fontSize: '10.5px' }}>
                              {d.startsAt ? new Date(d.startsAt).toLocaleDateString('ru') : '—'}
                            </p>
                            <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>
                              → {d.endsAt ? new Date(d.endsAt).toLocaleDateString('ru') : '∞'}
                            </p>
                          </div>
                        ) : <span className="font-body text-[#1F2937]" style={{ fontSize: '11px' }}>—</span>}
                      </td>

                      <td className="px-4 py-3">
                        <Toggle value={d.isActive} onChange={() => patch(d.id, { isActive: !d.isActive })} />
                      </td>

                      <td className="px-4 py-3">
                        <Toggle value={d.isFeatured} onChange={() => patch(d.id, { isFeatured: !d.isFeatured })} />
                      </td>

                      <td className="px-4 py-3">
                        <button onClick={() => remove(d.id)}
                          className="text-[#374151] hover:text-[#EF4444] transition-colors">
                          <Trash2 style={{ width: 14, height: 14 }} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && <AddDiscountModal onClose={() => setShowModal(false)} onAdd={d => setDiscounts(prev => [d, ...prev])} />}
      </AnimatePresence>
    </div>
  );
}
