'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Search, Clock, CheckCircle2, RefreshCw, X,
  ChevronDown, Send, Key, Package, AlertCircle, Check,
  Hourglass, Ban, Calendar, ArrowUpDown, Download,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

/* ── Types ────────────────────────────────────────────────── */
interface GameItem {
  id: string; title: string; cover: string | null;
  slug: string; deliveryType: 'AUTO' | 'MANUAL';
}
interface OrderItem {
  id: string; price: number; keyValue: string | null;
  deliveredAt: string | null; game: GameItem;
}
interface AdminOrder {
  id: string; totalPrice: number; status: string;
  deliveredAt: string | null; deliveredBy: string | null; deliveryNote: string | null;
  createdAt: string; updatedAt: string;
  user:  { id: string; username: string; email: string };
  items: OrderItem[];
}

type StatusFilter = 'ALL' | 'PENDING' | 'PAID' | 'WAITING_MANUAL' | 'COMPLETED' | 'CANCELLED';
type DatePreset   = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';
type SortOption   = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'ALL',   label: 'Всё время' },
  { id: 'TODAY', label: 'Сегодня'   },
  { id: 'WEEK',  label: '7 дней'    },
  { id: 'MONTH', label: '30 дней'   },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'date_desc',   label: 'Дата ↓'   },
  { id: 'date_asc',    label: 'Дата ↑'   },
  { id: 'amount_desc', label: 'Сумма ↓'  },
  { id: 'amount_asc',  label: 'Сумма ↑'  },
];

function getDateRange(preset: DatePreset): { dateFrom: string; dateTo: string } {
  if (preset === 'ALL') return { dateFrom: '', dateTo: '' };
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === 'TODAY') {
    return { dateFrom: today.toISOString(), dateTo: new Date(today.getTime() + 86400000).toISOString() };
  }
  const days = preset === 'WEEK' ? 7 : 30;
  return { dateFrom: new Date(today.getTime() - days * 86400000).toISOString(), dateTo: '' };
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  PENDING:        { label: 'Ожидает',      color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.22)',  icon: Clock          },
  PAID:           { label: 'Оплачен',      color: '#06B6D4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.22)',   icon: CheckCircle2   },
  WAITING_MANUAL: { label: 'Ждёт доставки', color: '#FB923C', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.22)', icon: Hourglass       },
  COMPLETED:      { label: 'Выполнен',     color: '#22C55E', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',    icon: Check          },
  CANCELLED:      { label: 'Отменён',      color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',    icon: Ban            },
};

const ALL_STATUSES: StatusFilter[] = ['PENDING', 'PAID', 'WAITING_MANUAL', 'COMPLETED', 'CANCELLED'];

/* ── Complete Order Modal (WAITING_MANUAL) ────────────────── */
function CompleteModal({
  order, onClose, onDone,
}: { order: AdminOrder; onClose: () => void; onDone: () => void }) {
  const [keyValue,     setKeyValue]     = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  const submit = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/orders/${order.id}/manual-complete`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          keyValue:     keyValue.trim()     || undefined,
          deliveryNote: deliveryNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? 'Ошибка'); return; }
      onDone();
    } catch { setError('Ошибка сети'); }
    finally   { setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0E0E1A', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <Key style={{ width: '14px', height: '14px', color: '#22C55E' }} />
            </div>
            <div>
              <p className="font-heading font-bold text-white" style={{ fontSize: '14px' }}>Выполнить заказ</p>
              <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
                {order.items[0]?.game.title ?? order.id}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#374151] hover:text-white transition-colors">
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="font-body text-[#6B7280] mb-2" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Покупатель</p>
            <p className="font-body text-white"     style={{ fontSize: '13px' }}>{order.user.username}</p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{order.user.email}</p>
          </div>

          <div>
            <label className="font-body text-[#6B7280] mb-2 block" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Игровой ключ <span className="text-[#374151] normal-case">(необязательно)</span>
            </label>
            <input
              value={keyValue}
              onChange={e => setKeyValue(e.target.value)}
              placeholder="XXXXX-XXXXX-XXXXX"
              className="w-full rounded-xl px-4 py-3 text-white font-pixel outline-none placeholder:text-[#1F2937] placeholder:font-body"
              style={{ background: '#09090E', border: '1px solid rgba(124,58,237,0.3)', fontSize: '13px', letterSpacing: '0.06em' }}
            />
          </div>

          <div>
            <label className="font-body text-[#6B7280] mb-2 block" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Примечание <span className="text-[#374151] normal-case">(необязательно)</span>
            </label>
            <input
              value={deliveryNote}
              onChange={e => setDeliveryNote(e.target.value)}
              placeholder="Отправлен через Steam, инструкции в чате..."
              className="w-full rounded-xl px-4 py-3 text-white font-body outline-none placeholder:text-[#1F2937]"
              style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle style={{ width: '13px', height: '13px', color: '#EF4444', flexShrink: 0 }} />
              <p className="font-body text-[#EF4444]" style={{ fontSize: '12px' }}>{error}</p>
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-xl py-3 font-heading font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', fontSize: '14px', boxShadow: '0 0 20px rgba(34,197,94,0.25)' }}
          >
            {loading
              ? <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
              : <Check style={{ width: '14px', height: '14px' }} />}
            {loading ? 'Выполняем...' : 'Отметить выполненным'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function AdminOrdersPage() {
  const [orders,  setOrders]  = useState<AdminOrder[]>([]);
  const [counts,  setCounts]  = useState<Record<string, number>>({});
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [tab,        setTab]        = useState<StatusFilter>('ALL');
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [sort,       setSort]       = useState<SortOption>('date_desc');
  const [completing,    setCompleting]    = useState<AdminOrder | null>(null);
  const [openStatusId,  setOpenStatusId]  = useState<string | null>(null);
  const [dropRect,      setDropRect]      = useState<DOMRect | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { dateFrom, dateTo } = getDateRange(datePreset);
      const [sortBy, sortDir]    = sort.includes('amount') ? ['totalPrice', sort.endsWith('asc') ? 'asc' : 'desc'] : ['createdAt', sort.endsWith('asc') ? 'asc' : 'desc'];
      const qs = new URLSearchParams({
        page:    String(page),
        sortBy,
        sortDir,
        ...(tab    !== 'ALL'  ? { status:   tab      } : {}),
        ...(search.trim()     ? { q:        search   } : {}),
        ...(dateFrom          ? { dateFrom            } : {}),
        ...(dateTo            ? { dateTo              } : {}),
      });
      const res  = await fetch(`/api/admin/orders?${qs}`);
      const data = await res.json();
      setOrders(data.orders  ?? []);
      setCounts(data.counts  ?? {});
      setTotal(data.total    ?? 0);
      setPages(data.pages    ?? 1);
    } finally { setLoading(false); }
  }, [page, tab, search, datePreset, sort]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setOpenStatusId(null);
    await fetch(`/api/admin/orders/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const toggleStatusDrop = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (openStatusId === id) { setOpenStatusId(null); return; }
    setDropRect((e.currentTarget as HTMLElement).getBoundingClientRect());
    setOpenStatusId(id);
  };

  useEffect(() => {
    if (!openStatusId) return;
    const close = () => setOpenStatusId(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openStatusId]);

  const totalCount = Object.values(counts).reduce((s, v) => s + v, 0);

  return (
    <div className="p-6 space-y-5">
      {/* Complete modal */}
      <AnimatePresence>
        {completing && (
          <CompleteModal
            order={completing}
            onClose={() => setCompleting(null)}
            onDone={() => { setCompleting(null); load(); }}
          />
        )}
      </AnimatePresence>

      {/* Status dropdown — fixed to avoid overflow clipping */}
      <AnimatePresence>
        {openStatusId && dropRect && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            onMouseDown={e => e.stopPropagation()}
            style={{
              position:  'fixed',
              top:       dropRect.bottom + 4,
              left:      dropRect.left,
              zIndex:    9999,
              width:     '160px',
              background: '#0D0D1A',
              border:    '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px',
              overflow:  'hidden',
              boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            }}
          >
            {ALL_STATUSES.map(s => {
              const cfg     = STATUS_CFG[s];
              const current = orders.find(o => o.id === openStatusId)?.status === s;
              return (
                <button
                  key={s}
                  onClick={() => updateStatus(openStatusId, s)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                  style={{ color: current ? cfg.color : '#6B7280', fontSize: '12px' }}
                >
                  <cfg.icon style={{ width: '10px', height: '10px', color: cfg.color, flexShrink: 0 }} />
                  <span className="font-body">{cfg.label}</span>
                  {current && <span className="ml-auto font-body" style={{ fontSize: '10px', color: cfg.color }}>✓</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#22C55E', letterSpacing: '0.14em' }}>УПРАВЛЕНИЕ</p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>Заказы</h1>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
              {loading ? 'Загрузка...' : `${totalCount} заказов всего`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/admin/orders/export"
              download
              className="flex items-center gap-2 rounded-xl px-4 py-2 font-heading font-semibold text-sm transition-all"
              style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', color: '#A78BFA' }}
            >
              <Download style={{ width: '13px', height: '13px' }} />
              CSV
            </a>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl px-4 py-2 font-heading font-semibold text-sm transition-all disabled:opacity-50"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}
            >
              <RefreshCw style={{ width: '13px', height: '13px' }} className={loading ? 'animate-spin' : ''} />
              Обновить
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs + Search */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="flex flex-wrap gap-2">
        {/* All tab */}
        <button
          onClick={() => { setTab('ALL'); setPage(1); }}
          className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-body transition-all duration-200"
          style={{
            background: tab === 'ALL' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${tab === 'ALL' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
            fontSize: '12px', color: tab === 'ALL' ? '#E2E8F0' : '#4B5563',
          }}
        >
          Все <span className="font-pixel" style={{ fontSize: '8px' }}>({totalCount})</span>
        </button>

        {ALL_STATUSES.map(s => {
          const sc  = STATUS_CFG[s];
          const cnt = counts[s] ?? 0;
          return (
            <button
              key={s}
              onClick={() => { setTab(s); setPage(1); }}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-body transition-all duration-200"
              style={{
                background: tab === s ? sc.bg   : 'rgba(255,255,255,0.03)',
                border: `1px solid ${tab === s ? sc.border : 'rgba(255,255,255,0.06)'}`,
                fontSize: '12px', color: tab === s ? sc.color : '#4B5563',
              }}
            >
              <sc.icon style={{ width: '11px', height: '11px', flexShrink: 0 }} />
              {sc.label}
              <span className="font-pixel" style={{ fontSize: '8px' }}>({cnt})</span>
            </button>
          );
        })}

        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 ml-auto min-w-52"
             style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Search style={{ width: '13px', height: '13px', color: '#374151', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="ID, покупатель, игра..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent outline-none text-white font-body flex-1 placeholder:text-[#1F2937]"
            style={{ fontSize: '12px' }}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X style={{ width: '12px', height: '12px', color: '#374151' }} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Date + Sort filters */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-2">

        {/* Date presets */}
        <div className="flex items-center gap-1.5">
          <Calendar style={{ width: '12px', height: '12px', color: '#374151', flexShrink: 0 }} />
          <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>Период:</span>
          {DATE_PRESETS.map(d => (
            <button
              key={d.id}
              onClick={() => { setDatePreset(d.id); setPage(1); }}
              className="rounded-lg px-2.5 py-1 font-body transition-all duration-150"
              style={{
                fontSize: '11px',
                background: datePreset === d.id ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${datePreset === d.id ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.06)'}`,
                color: datePreset === d.id ? '#06B6D4' : '#4B5563',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-4 w-px mx-1" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown style={{ width: '12px', height: '12px', color: '#374151', flexShrink: 0 }} />
          <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>Сортировка:</span>
          {SORT_OPTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => { setSort(s.id); setPage(1); }}
              className="rounded-lg px-2.5 py-1 font-body transition-all duration-150"
              style={{
                fontSize: '11px',
                background: sort === s.id ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${sort === s.id ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)'}`,
                color: sort === s.id ? '#9D60FA' : '#4B5563',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Active filters summary */}
        {(datePreset !== 'ALL' || sort !== 'date_desc') && (
          <button
            onClick={() => { setDatePreset('ALL'); setSort('date_desc'); setPage(1); }}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-body transition-all hover:opacity-80"
            style={{ fontSize: '11px', color: '#EF4444', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <X style={{ width: '10px', height: '10px' }} />
            Сбросить фильтры
          </button>
        )}
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['#', 'Продукт', 'Покупатель', 'Сумма', 'Статус', 'Дата', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-body text-[#374151] whitespace-nowrap"
                      style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <RefreshCw style={{ width: '16px', height: '16px', color: '#374151', margin: '0 auto 8px', animation: 'spin 1s linear infinite' }} />
                    <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Загрузка заказов...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Package style={{ width: '28px', height: '28px', color: '#1F2937', margin: '0 auto 8px' }} />
                    <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Заказы не найдены</p>
                  </td>
                </tr>
              ) : orders.map((order, i) => {
                const sc       = STATUS_CFG[order.status] ?? STATUS_CFG.PENDING;
                const game     = order.items[0]?.game;
                const isManual = order.status === 'WAITING_MANUAL';
                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.035 }}
                    className="group hover:bg-white/[0.015] transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    {/* ID */}
                    <td className="px-4 py-3">
                      <span className="font-pixel text-[#374151]" style={{ fontSize: '8px' }}>
                        {order.id.slice(0, 8)}…
                      </span>
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {game?.cover ? (
                          <div className="relative w-8 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            <Image src={game.cover} alt="" fill unoptimized className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                               style={{ background: 'rgba(124,58,237,0.08)' }}>
                            <Package style={{ width: '12px', height: '12px', color: '#374151' }} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-body text-white line-clamp-1" style={{ fontSize: '12px' }}>
                            {game?.title ?? '—'}
                          </p>
                          {order.items.length > 1 && (
                            <p className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
                              +{order.items.length - 1} позиций
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <p className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{order.user.username}</p>
                      <p className="font-body text-[#374151]" style={{ fontSize: '10px' }}>{order.user.email}</p>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3">
                      <p className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>
                        {formatPrice(order.totalPrice)}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <button
                        onClick={e => toggleStatusDrop(e, order.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 cursor-pointer transition-opacity hover:opacity-80"
                        style={{ background: sc.bg, border: `1px solid ${sc.border}` }}
                      >
                        <sc.icon style={{ width: '9px', height: '9px', color: sc.color }} />
                        <span className="font-body" style={{ fontSize: '10.5px', color: sc.color }}>{sc.label}</span>
                        <ChevronDown style={{ width: '9px', height: '9px', color: sc.color,
                          transform: openStatusId === order.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                      </button>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3">
                      <p className="font-body text-[#374151] whitespace-nowrap" style={{ fontSize: '11px' }}>
                        {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                        })}
                      </p>
                      <p className="font-body text-[#1F2937]" style={{ fontSize: '10px' }}>
                        {new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3">
                      {isManual && (
                        <button
                          onClick={() => setCompleting(order)}
                          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-heading font-semibold text-white transition-all hover:scale-105"
                          style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', fontSize: '11px', boxShadow: '0 0 12px rgba(34,197,94,0.25)' }}
                        >
                          <Send style={{ width: '10px', height: '10px' }} />
                          Доставить
                        </button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5"
               style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
              Страница {page} из {pages} · {total} заказов
            </p>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg font-body text-[#4B5563] disabled:opacity-30 hover:text-white transition-colors"
                style={{ fontSize: '12px', background: 'rgba(255,255,255,0.04)' }}
              >
                ← Назад
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg font-body text-[#4B5563] disabled:opacity-30 hover:text-white transition-colors"
                style={{ fontSize: '12px', background: 'rgba(255,255,255,0.04)' }}
              >
                Вперёд →
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
