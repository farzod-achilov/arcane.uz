'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Search, Ban, ExternalLink, User,
} from 'lucide-react';
import type { GameKeyRecord, KeyStatus, KeyType } from '@/lib/admin/adminKeysTypes';

const STATUS_CFG: Record<KeyStatus, { label: string; color: string; bg: string }> = {
  AVAILABLE: { label: 'Доступен',   color: '#22C55E', bg: 'rgba(34,197,94,0.1)'   },
  RESERVED:  { label: 'Зарезерв.',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  SOLD:      { label: 'Продан',     color: '#7C3AED', bg: 'rgba(124,58,237,0.1)'  },
  USED:      { label: 'Использован',color: '#06B6D4', bg: 'rgba(6,182,212,0.1)'   },
  DISABLED:  { label: 'Отключён',   color: '#4B5563', bg: 'rgba(75,85,99,0.1)'    },
};

const TYPE_CFG: Record<KeyType, { label: string; color: string }> = {
  STORE: { label: 'STORE', color: '#06B6D4' },
  DROP:  { label: 'DROP',  color: '#F59E0B' },
  BOTH:  { label: 'BOTH',  color: '#9D60FA' },
};

const STATUS_FILTERS: (KeyStatus | 'ALL')[] = ['ALL', 'AVAILABLE', 'RESERVED', 'SOLD', 'USED', 'DISABLED'];
const TYPE_FILTERS:   (KeyType  | 'ALL')[] = ['ALL', 'STORE', 'DROP', 'BOTH'];

const PAGE_SIZE = 10;

interface Props {
  keys: GameKeyRecord[];
  onDisable?: (keyIds: string[]) => void;
}

export default function KeysTable({ keys, onDisable }: Props) {
  const [statusFilter, setStatusFilter] = useState<KeyStatus | 'ALL'>('ALL');
  const [typeFilter,   setTypeFilter]   = useState<KeyType   | 'ALL'>('ALL');
  const [search,       setSearch]       = useState('');
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [page,         setPage]         = useState(1);

  const filtered = keys.filter(k => {
    if (statusFilter !== 'ALL' && k.status !== statusFilter) return false;
    if (typeFilter   !== 'ALL' && k.type   !== typeFilter)   return false;
    if (search && !k.id.toLowerCase().includes(search.toLowerCase()) &&
        !k.soldToUsername?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pages      = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, pages);
  const pageKeys   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allChecked = pageKeys.length > 0 && pageKeys.every(k => selected.has(k.id));

  const toggleAll = () => {
    if (allChecked) {
      const next = new Set(selected);
      pageKeys.forEach(k => next.delete(k.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      pageKeys.forEach(k => next.add(k.id));
      setSelected(next);
    }
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleDisableSelected = () => {
    const ids = Array.from(selected).filter(id => {
      const k = keys.find(k => k.id === id);
      return k && k.status !== 'SOLD' && k.status !== 'USED';
    });
    onDisable?.(ids);
    setSelected(new Set());
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div>
      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', color: '#4B5563' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по ID, пользователю..."
            className="w-full rounded-xl font-body outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#E2E8F0',
              fontSize: '12px',
              padding: '8px 12px 8px 30px',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1">
          {STATUS_FILTERS.map(s => {
            const active = statusFilter === s;
            const cfg = s !== 'ALL' ? STATUS_CFG[s] : null;
            return (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className="px-2.5 py-1.5 rounded-lg font-pixel transition-all"
                style={{
                  background: active ? (cfg ? `${cfg.color}15` : 'rgba(255,255,255,0.08)') : 'transparent',
                  border: `1px solid ${active ? (cfg ? `${cfg.color}30` : 'rgba(255,255,255,0.15)') : 'transparent'}`,
                  fontSize: '8px',
                  color: active ? (cfg ? cfg.color : '#E2E8F0') : '#4B5563',
                  letterSpacing: '0.06em',
                }}>
                {s}
              </button>
            );
          })}
        </div>

        {/* Type filter */}
        <div className="flex gap-1">
          {TYPE_FILTERS.map(t => {
            const active = typeFilter === t;
            const cfg = t !== 'ALL' ? TYPE_CFG[t] : null;
            return (
              <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
                className="px-2.5 py-1.5 rounded-lg font-pixel transition-all"
                style={{
                  background: active ? (cfg ? `${cfg.color}15` : 'rgba(255,255,255,0.08)') : 'transparent',
                  border: `1px solid ${active ? (cfg ? `${cfg.color}30` : 'rgba(255,255,255,0.15)') : 'transparent'}`,
                  fontSize: '8px',
                  color: active ? (cfg ? cfg.color : '#E2E8F0') : '#4B5563',
                  letterSpacing: '0.06em',
                }}>
                {t}
              </button>
            );
          })}
        </div>

        {/* Bulk disable */}
        {selected.size > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleDisableSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body transition-all"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              fontSize: '11px', color: '#EF4444',
            }}>
            <Ban style={{ width: '11px', height: '11px' }} />
            Отключить ({selected.size})
          </motion.button>
        )}

        <p className="font-body text-[#374151] ml-auto" style={{ fontSize: '11px' }}>
          {filtered.length} ключей
        </p>
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll}
                    style={{ accentColor: '#7C3AED', cursor: 'pointer' }} />
                </th>
                {['ID', 'Тип', 'Статус', 'Продан', 'Доставлен', 'Создан', ''].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-body text-[#374151]"
                      style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {pageKeys.map((k, i) => {
                  const sc = STATUS_CFG[k.status];
                  const tc = TYPE_CFG[k.type];
                  const isChecked = selected.has(k.id);
                  return (
                    <motion.tr
                      key={k.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: isChecked ? 'rgba(124,58,237,0.05)' : 'transparent' }}
                      className="hover:bg-white/[0.015] transition-colors group"
                    >
                      <td className="w-10 px-4 py-2.5">
                        <input type="checkbox" checked={isChecked} onChange={() => toggleRow(k.id)}
                          style={{ accentColor: '#7C3AED', cursor: 'pointer' }} />
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-pixel text-[#4B5563]" style={{ fontSize: '8px', letterSpacing: '0.04em' }}>
                          #{k.id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-pixel rounded px-2 py-0.5"
                          style={{ fontSize: '8px', color: tc.color, background: `${tc.color}10`, border: `1px solid ${tc.color}20`, letterSpacing: '0.04em' }}>
                          {tc.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-pixel"
                          style={{ fontSize: '8px', color: sc.color, background: sc.bg, border: `1px solid ${sc.color}25`, letterSpacing: '0.04em' }}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {k.soldToUsername ? (
                          <div className="flex items-center gap-1.5">
                            <User style={{ width: '10px', height: '10px', color: '#7C3AED' }} />
                            <span className="font-body text-[#9CA3AF]" style={{ fontSize: '11px' }}>
                              {k.soldToUsername}
                            </span>
                          </div>
                        ) : (
                          <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
                          {formatDate(k.deliveredAt)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
                          {formatDate(k.createdAt)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {k.status !== 'SOLD' && k.status !== 'USED' && (
                            <button onClick={() => onDisable?.([k.id])}
                              className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                              style={{ background: 'rgba(239,68,68,0.1)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.18)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}>
                              <Ban style={{ width: '10px', height: '10px', color: '#EF4444' }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>

              {pageKeys.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Нет ключей по заданным фильтрам</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3"
               style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
              {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} из {filtered.length}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.04)' }}
                onMouseEnter={e => { if (safePage > 1) (e.currentTarget.style.background = 'rgba(255,255,255,0.08)'); }}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
                <ChevronLeft style={{ width: '13px', height: '13px', color: '#6B7280' }} />
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const p = Math.max(1, Math.min(safePage - 2, pages - 4)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-7 h-7 rounded-lg font-body transition-all"
                    style={{
                      background: p === safePage ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                      border: p === safePage ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                      fontSize: '11px',
                      color: p === safePage ? '#9D60FA' : '#6B7280',
                    }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={safePage >= pages}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.04)' }}
                onMouseEnter={e => { if (safePage < pages) (e.currentTarget.style.background = 'rgba(255,255,255,0.08)'); }}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
                <ChevronRight style={{ width: '13px', height: '13px', color: '#6B7280' }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
