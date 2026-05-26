'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, ShoppingBag, Users, Package, Gamepad2, RefreshCw } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

/* ── Types ─────────────────────────────────────────────────────── */
interface DayData   { label: string; date: string; revenue: number; orders: number; newUsers: number }
interface TopGame   { gameId: string; title: string; cover: string | null; slug: string; sales: number; revenue: number }
interface Analytics {
  kpis:       { revenue7: number; orders7: number; newUsers7: number; totalRevenue: number; totalGames: number; totalUsers: number };
  daily:      DayData[];
  topGames:   TopGame[];
  statusDist: Record<string, number>;
}

/* ── Bar Chart ─────────────────────────────────────────────────── */
function BarChart({ data, color, height = 160, format }: {
  data: { label: string; value: number }[];
  color: string;
  height?: number;
  format?: (v: number) => string;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  const fmt = format ?? (v => v > 999999 ? `${(v/1000000).toFixed(1)}M` : v > 999 ? `${(v/1000).toFixed(0)}K` : String(v));
  return (
    <div className="flex items-end gap-1.5 w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="font-body text-[#374151]" style={{ fontSize: '9px' }}>{d.value > 0 ? fmt(d.value) : ''}</span>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(4, Math.round((d.value / max) * (height - 32)))}px` }}
            transition={{ delay: i * 0.06, duration: 0.6, ease: 'easeOut' }}
            className="w-full rounded-t-lg"
            style={{ background: `linear-gradient(180deg, ${color}, ${color}55)`, boxShadow: `0 0 8px ${color}30`, minHeight: '4px' }}
          />
          <span className="font-body text-[#374151]" style={{ fontSize: '9px' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Status badge ──────────────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; color: string }> = {
  PENDING:        { label: 'Ожидает',    color: '#6B7280' },
  PAID:           { label: 'Оплачен',    color: '#F59E0B' },
  WAITING_MANUAL: { label: 'Ждёт доставки', color: '#FB923C' },
  COMPLETED:      { label: 'Выполнен',   color: '#22C55E' },
  CANCELLED:      { label: 'Отменён',    color: '#EF4444' },
};

export default function AdminAnalyticsPage() {
  const [data, setData]       = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading || !data) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-[#4B5563] mb-6">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="font-body text-sm">Загрузка данных…</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: '#0D0D1A' }} />
          ))}
        </div>
      </div>
    );
  }

  const { kpis, daily, topGames, statusDist } = data;
  const maxSales = Math.max(...topGames.map(g => g.sales), 1);
  const totalStatusOrders = Object.values(statusDist).reduce((s, v) => s + v, 0);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#7C3AED', letterSpacing: '0.14em' }}>АНАЛИТИКА</p>
          <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>Аналитика</h1>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>За последние 7 дней · реальные данные</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-xl px-4 py-2 font-heading font-semibold text-sm transition-all"
          style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: '#A78BFA' }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Обновить
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Выручка (7д)',   value: formatPrice(kpis.revenue7),    color: '#22C55E', icon: DollarSign  },
          { label: 'Заказов (7д)',   value: String(kpis.orders7),           color: '#7C3AED', icon: ShoppingBag },
          { label: 'Новых юзеров',   value: String(kpis.newUsers7),         color: '#06B6D4', icon: Users       },
          { label: 'Выручка всего',  value: formatPrice(kpis.totalRevenue), color: '#F59E0B', icon: TrendingUp  },
          { label: 'Игр в каталоге', value: String(kpis.totalGames),        color: '#9D60FA', icon: Gamepad2    },
          { label: 'Пользователей',  value: String(kpis.totalUsers),        color: '#FB923C', icon: Package     },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: '#0D0D1A', border: `1px solid ${s.color}15` }}
          >
            <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
                 style={{ background: `radial-gradient(circle at top right, ${s.color}12, transparent 70%)` }} />
            <s.icon style={{ width: '14px', height: '14px', color: s.color, marginBottom: '8px' }} />
            <p className="font-heading font-bold" style={{ fontSize: '17px', color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p className="font-body text-[#4B5563] mt-1" style={{ fontSize: '10.5px' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue + Orders charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {[
          { title: 'Выручка по дням', data: daily.map(d => ({ label: d.label, value: d.revenue })), color: '#22C55E', format: (v: number) => formatPrice(v) },
          { title: 'Заказы по дням',  data: daily.map(d => ({ label: d.label, value: d.orders  })), color: '#7C3AED' },
        ].map((chart, i) => (
          <motion.div
            key={chart.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.08 }}
            className="rounded-2xl p-5"
            style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="font-heading font-semibold text-white mb-4" style={{ fontSize: '13px' }}>{chart.title}</p>
            <BarChart data={chart.data} color={chart.color} format={chart.format} />
          </motion.div>
        ))}
      </div>

      {/* Top games + Status distribution */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Top games */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="font-heading font-semibold text-white mb-4" style={{ fontSize: '13px' }}>
            Топ игр по продажам <span className="font-body text-[#374151] text-xs">(30 дней)</span>
          </p>
          {topGames.length === 0 ? (
            <p className="font-body text-[#374151] text-sm text-center py-6">Пока нет продаж</p>
          ) : (
            <div className="space-y-3">
              {topGames.map((g, i) => (
                <div key={g.gameId} className="flex items-center gap-3">
                  <span className="font-pixel text-[#374151] w-4 text-center flex-shrink-0" style={{ fontSize: '9px' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[#9CA3AF] truncate mb-1" style={{ fontSize: '12px' }}>{g.title}</p>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(g.sales / maxSales) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.4 + i * 0.08 }}
                        className="h-full rounded-full"
                        style={{ background: ['linear-gradient(90deg,#F59E0B,#F97316)', '#7C3AED', '#06B6D4', '#22C55E', '#9D60FA'][i] }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-heading font-bold" style={{ fontSize: '12px', color: i === 0 ? '#F59E0B' : '#9CA3AF' }}>{g.sales} шт.</p>
                    <p className="font-body text-[#374151]" style={{ fontSize: '10px' }}>{formatPrice(g.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Order status distribution */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
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
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>{cfg.label}</span>
                          <span className="font-heading font-semibold" style={{ fontSize: '11px', color: cfg.color }}>{count}</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / totalStatusOrders) * 100}%` }}
                            transition={{ duration: 0.7 }}
                            className="h-full rounded-full"
                            style={{ background: cfg.color }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="font-body text-[#374151] text-center" style={{ fontSize: '11px' }}>
              Всего заказов: <span className="text-white font-semibold">{totalStatusOrders}</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
