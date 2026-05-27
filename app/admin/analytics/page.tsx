'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Package,
  Gamepad2, RefreshCw, Ticket, CheckCircle2, BarChart3, Download,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

/* ── Types ─────────────────────────────────────────────────────── */
interface DayData   { label: string; date: string; revenue: number; orders: number; newUsers: number }
interface TopGame   { gameId: string; title: string; cover: string | null; slug: string; sales: number; revenue: number }
interface TopPromo  { code: string; type: 'PERCENT' | 'FIXED'; value: number; usedCount: number }
interface Analytics {
  period:   number;
  kpis:     {
    revenueN: number; ordersN: number; newUsersN: number;
    totalRevenue: number; avgOrderValue: number; completionRate: number;
    totalGames: number; totalUsers: number;
  };
  changes:    { revenueN: number; ordersN: number; newUsersN: number };
  daily:      DayData[];
  topGames:   TopGame[];
  statusDist: Record<string, number>;
  topPromos:  TopPromo[];
}

function DeltaBadge({ pct }: { pct: number }) {
  if (pct === 0) return null;
  const up = pct > 0;
  return (
    <div className="flex items-center gap-0.5"
         style={{ color: up ? '#4ADE80' : '#F87171', fontSize: '9px' }}>
      {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      <span className="font-body">{up ? '+' : ''}{pct}%</span>
    </div>
  );
}

const PERIODS = [
  { label: '7 дней',  value: 7  },
  { label: '30 дней', value: 30 },
  { label: '90 дней', value: 90 },
];

/* ── Bar Chart ─────────────────────────────────────────────────── */
function BarChart({ data, color, height = 160, format }: {
  data:    { label: string; value: number }[];
  color:   string;
  height?: number;
  format?: (v: number) => string;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  const fmt = format ?? (v => v > 999_999 ? `${(v / 1_000_000).toFixed(1)}M` : v > 999 ? `${(v / 1000).toFixed(0)}K` : String(v));
  const skip = data.length > 14 ? Math.ceil(data.length / 14) : 1;

  return (
    <div className="flex items-end gap-0.5 w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label + i} className="flex-1 flex flex-col items-center gap-1">
          <span className="font-body text-[#374151]" style={{ fontSize: '8px' }}>
            {d.value > 0 ? fmt(d.value) : ''}
          </span>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(2, Math.round((d.value / max) * (height - 36)))}px` }}
            transition={{ delay: i * 0.02, duration: 0.5, ease: 'easeOut' }}
            className="w-full rounded-t-md"
            style={{ background: `linear-gradient(180deg, ${color}, ${color}44)`, minHeight: '2px' }}
          />
          {i % skip === 0 && (
            <span className="font-body text-[#374151]" style={{ fontSize: '8px', whiteSpace: 'nowrap' }}>{d.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Status badge config ───────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; color: string }> = {
  PENDING:        { label: 'Ожидает',        color: '#6B7280' },
  PAID:           { label: 'Оплачен',        color: '#F59E0B' },
  WAITING_MANUAL: { label: 'Ждёт доставки', color: '#FB923C' },
  COMPLETED:      { label: 'Выполнен',       color: '#22C55E' },
  CANCELLED:      { label: 'Отменён',        color: '#EF4444' },
};

/* ── Analytics Page ────────────────────────────────────────────── */
export default function AdminAnalyticsPage() {
  const [data,    setData]    = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState(7);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(period); }, [period, load]);

  if (loading || !data) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-[#4B5563] mb-6">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="font-body text-sm">Загрузка данных…</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: '#0D0D1A' }} />
          ))}
        </div>
      </div>
    );
  }

  const { kpis, changes, daily, topGames, statusDist, topPromos } = data;
  const maxSales = Math.max(...topGames.map(g => g.sales), 1);
  const totalStatusOrders = Object.values(statusDist).reduce((s, v) => s + v, 0);

  const periodLabel = PERIODS.find(p => p.value === period)?.label ?? `${period} дней`;

  const kpiCards = [
    { label: `Выручка (${periodLabel})`,  value: formatPrice(kpis.revenueN),       color: '#22C55E', icon: DollarSign,   delta: changes?.revenueN  },
    { label: `Заказов (${periodLabel})`,  value: String(kpis.ordersN),             color: '#7C3AED', icon: ShoppingBag,  delta: changes?.ordersN   },
    { label: 'Новых юзеров',             value: String(kpis.newUsersN),           color: '#06B6D4', icon: Users,        delta: changes?.newUsersN },
    { label: 'Средний чек',              value: formatPrice(kpis.avgOrderValue),   color: '#F59E0B', icon: BarChart3,    delta: undefined          },
    { label: 'Выполнено заказов',         value: `${kpis.completionRate}%`,        color: '#4ADE80', icon: CheckCircle2, delta: undefined          },
    { label: 'Выручка всего',            value: formatPrice(kpis.totalRevenue),   color: '#F59E0B', icon: TrendingUp,   delta: undefined          },
    { label: 'Игр в каталоге',           value: String(kpis.totalGames),          color: '#9D60FA', icon: Gamepad2,     delta: undefined          },
    { label: 'Пользователей',            value: String(kpis.totalUsers),          color: '#FB923C', icon: Package,      delta: undefined          },
  ];

  const handleExport = () => {
    window.location.href = `/api/admin/export/orders`;
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#7C3AED', letterSpacing: '0.14em' }}>АНАЛИТИКА</p>
          <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>Аналитика</h1>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>Реальные данные из базы</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className="px-4 py-2 font-heading font-semibold text-sm transition-all"
                style={{
                  background: period === p.value ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.03)',
                  color:      period === p.value ? '#A78BFA' : '#4B5563',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                }}>
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl px-4 py-2 font-heading font-semibold text-sm transition-all hover:opacity-90"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ADE80' }}
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={() => load(period)}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl px-4 py-2 font-heading font-semibold text-sm transition-all disabled:opacity-50"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: '#A78BFA' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {kpiCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: '#0D0D1A', border: `1px solid ${s.color}15` }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
                 style={{ background: `radial-gradient(circle at top right, ${s.color}14, transparent 70%)` }} />
            <div className="flex items-start justify-between mb-1.5">
              <s.icon style={{ width: '13px', height: '13px', color: s.color }} />
              {s.delta !== undefined && <DeltaBadge pct={s.delta} />}
            </div>
            <p className="font-heading font-bold truncate" style={{ fontSize: '15px', color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p className="font-body text-[#4B5563] mt-1 leading-tight" style={{ fontSize: '9.5px' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue + Orders + New Users charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        {[
          { title: 'Выручка по дням',       data: daily.map(d => ({ label: d.label, value: d.revenue  })), color: '#22C55E', format: (v: number) => formatPrice(v) },
          { title: 'Заказы по дням',         data: daily.map(d => ({ label: d.label, value: d.orders   })), color: '#7C3AED' },
          { title: 'Новые пользователи',     data: daily.map(d => ({ label: d.label, value: d.newUsers })), color: '#06B6D4' },
        ].map((chart, i) => (
          <motion.div
            key={chart.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.07 }}
            className="rounded-2xl p-5"
            style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="font-heading font-semibold text-white mb-4" style={{ fontSize: '13px' }}>{chart.title}</p>
            <BarChart data={chart.data} color={chart.color} format={chart.format} />
          </motion.div>
        ))}
      </div>

      {/* Bottom row: Top games + Status + Promos */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Top games */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl p-5"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="font-heading font-semibold text-white mb-4" style={{ fontSize: '13px' }}>
            Топ игр <span className="font-body text-[#374151] text-xs">(30 дней)</span>
          </p>
          {topGames.length === 0 ? (
            <p className="font-body text-[#374151] text-sm text-center py-6">Нет продаж</p>
          ) : (
            <div className="space-y-3">
              {topGames.map((g, i) => (
                <div key={g.gameId} className="flex items-center gap-3">
                  <span className="font-pixel text-[#374151] w-4 text-center flex-shrink-0" style={{ fontSize: '9px' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[#9CA3AF] truncate mb-1" style={{ fontSize: '11px' }}>{g.title}</p>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(g.sales / maxSales) * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.35 + i * 0.06 }}
                        className="h-full rounded-full"
                        style={{ background: ['linear-gradient(90deg,#F59E0B,#F97316)', '#7C3AED', '#06B6D4', '#22C55E', '#9D60FA', '#FB923C', '#EF4444', '#A78BFA', '#67E8F9', '#4ADE80'][i % 10] }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-heading font-bold" style={{ fontSize: '11px', color: i === 0 ? '#F59E0B' : '#9CA3AF' }}>{g.sales} шт.</p>
                    <p className="font-body text-[#374151]" style={{ fontSize: '9px' }}>{formatPrice(g.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Order status */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl p-5"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="font-heading font-semibold text-white mb-4" style={{ fontSize: '13px' }}>Статусы заказов</p>
          {totalStatusOrders === 0 ? (
            <p className="font-body text-[#374151] text-sm text-center py-6">Заказов нет</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusDist)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => {
                  const cfg = STATUS_CFG[status] ?? { label: status, color: '#6B7280' };
                  const pct = Math.round((count / totalStatusOrders) * 100);
                  return (
                    <div key={status}>
                      <div className="flex justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                          <span className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>{cfg.label}</span>
                        </div>
                        <span className="font-heading font-semibold" style={{ fontSize: '11px', color: cfg.color }}>{count} <span className="text-[#374151] font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full rounded-full"
                          style={{ background: cfg.color }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="font-body text-[#374151] text-center" style={{ fontSize: '11px' }}>
              Всего: <span className="text-white font-semibold">{totalStatusOrders}</span>
            </p>
          </div>
        </motion.div>

        {/* Promo codes usage */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="rounded-2xl p-5"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Ticket size={13} style={{ color: '#22C55E' }} />
            <p className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>Промокоды</p>
          </div>
          {topPromos.length === 0 ? (
            <p className="font-body text-[#374151] text-sm text-center py-6">Промокоды ещё не использовались</p>
          ) : (
            <div className="space-y-3">
              {topPromos.map((p, i) => (
                <div key={p.code} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-pixel text-[#374151] w-4 text-center flex-shrink-0" style={{ fontSize: '8px' }}>{i + 1}</span>
                    <code className="font-mono font-bold text-[#A78BFA] text-xs truncate">{p.code}</code>
                    <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{
                            background: p.type === 'PERCENT' ? 'rgba(124,58,237,0.15)' : 'rgba(6,182,212,0.12)',
                            color:      p.type === 'PERCENT' ? '#A78BFA' : '#67E8F9',
                            fontSize: '9px',
                          }}>
                      {p.type === 'PERCENT' ? `${p.value}%` : `${p.value.toLocaleString('ru')} сум`}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-heading font-bold text-[#4ADE80] text-sm">{p.usedCount}</span>
                    <span className="font-body text-[#374151] text-xs"> раз</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <a href="/admin/promo-codes"
               className="flex items-center justify-center gap-1.5 font-body text-[#4B5563] hover:text-[#A78BFA] transition-colors"
               style={{ fontSize: '11px' }}>
              <Ticket size={10} />
              Управление промокодами
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
