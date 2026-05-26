'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ShoppingBag, Users, TrendingUp, TrendingDown,
  ArrowRight, Clock, Check, RefreshCw, Truck,
  DollarSign, Package, Zap, AlertTriangle,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

/* ── Types ───────────────────────────────────────────── */
interface DashData {
  kpis: {
    totalRevenue: number; totalOrders: number; totalUsers: number; totalGames: number;
    rev7: number; orders7: number; newUsers7: number; waiting: number;
  };
  daily:        { label: string; date: string; revenue: number; orders: number; newUsers: number }[];
  statusDist:   Record<string, number>;
  recentOrders: { id: string; totalPrice: number; status: string; createdAt: string; username: string; gameTitle: string }[];
}

/* ── Bar Chart ───────────────────────────────────────── */
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-24 w-full">
      {data.map((d, i) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.round((d.value / max) * 88)}px` }}
            transition={{ delay: i * 0.07, duration: 0.6, ease: 'easeOut' }}
            className="w-full rounded-t-lg"
            style={{
              background: 'linear-gradient(180deg, rgba(124,58,237,0.8), rgba(124,58,237,0.4))',
              boxShadow: '0 0 6px rgba(124,58,237,0.3)',
              minHeight: '4px',
            }}
          />
          <span className="font-body text-[#374151] text-center leading-none" style={{ fontSize: '9px' }}>
            {d.label.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Stat Card ───────────────────────────────────────── */
function StatCard({
  title, value, sub, icon: Icon, color, href,
}: {
  title: string; value: string; sub?: string;
  icon: React.ElementType; color: string; href?: string;
}) {
  const content = (
    <motion.div
      whileHover={{ y: -3, boxShadow: `0 8px 30px ${color}14` }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl p-5 relative overflow-hidden cursor-pointer"
      style={{ background: '#0D0D1A', border: `1px solid ${color}18` }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
           style={{ background: `radial-gradient(circle at top right, ${color}0E, transparent 70%)` }} />
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
           style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
           style={{ background: `${color}15`, border: `1px solid ${color}25`, boxShadow: `0 0 12px ${color}15` }}>
        <Icon style={{ width: '17px', height: '17px', color }} />
      </div>
      <p className="font-pixel text-white mb-1 relative z-10"
         style={{ fontSize: '20px', letterSpacing: '0.02em', textShadow: `0 0 16px ${color}40` }}>
        {value}
      </p>
      <p className="font-body text-[#4B5563] relative z-10" style={{ fontSize: '12px' }}>{title}</p>
      {sub && <p className="font-body text-[#374151] relative z-10 mt-0.5" style={{ fontSize: '10.5px' }}>{sub}</p>}
    </motion.div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

/* ── Status badge ────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING:        { label: 'Ожидание',      color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  icon: Clock     },
  PAID:           { label: 'Оплачен',       color: '#06B6D4', bg: 'rgba(6,182,212,0.1)',   icon: Check     },
  WAITING_MANUAL: { label: 'Ждёт доставки', color: '#FB923C', bg: 'rgba(251,146,60,0.1)',  icon: Truck     },
  COMPLETED:      { label: 'Выполнен',      color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   icon: Check     },
  CANCELLED:      { label: 'Отменён',       color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   icon: TrendingDown },
};

/* ── Page ────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [data,    setData]    = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/dashboard');
      const json = await res.json() as DashData;
      setData(json);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const kpis    = data?.kpis;
  const daily   = data?.daily ?? [];
  const recent  = data?.recentOrders ?? [];
  const waiting = kpis?.waiting ?? 0;
  const today   = daily[daily.length - 1];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#7C3AED', letterSpacing: '0.14em' }}>
          ARCANE.UZ ADMIN
        </p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-white" style={{ fontSize: '24px' }}>Центр управления</h1>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '13px' }}>
              {loading ? 'Загрузка...' : `Сегодня ${today?.orders ?? 0} заказов · ${today?.newUsers ?? 0} новых пользователей`}
            </p>
          </div>
          <button
            onClick={load} disabled={loading}
            className="flex items-center gap-2 rounded-xl px-4 py-2 font-heading font-semibold text-sm transition-all disabled:opacity-50"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', color: '#9D60FA' }}
          >
            <RefreshCw style={{ width: '13px', height: '13px' }} className={loading ? 'animate-spin' : ''} />
            Обновить
          </button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Общая выручка', icon: DollarSign, color: '#22C55E', href: '/admin/analytics',
            value: kpis ? `${Math.round(kpis.totalRevenue / 1000)}K` : '—',
            sub:   kpis ? `+${Math.round(kpis.rev7 / 1000)}K за 7 дней` : undefined,
          },
          {
            title: 'Заказов всего', icon: ShoppingBag, color: '#7C3AED', href: '/admin/orders',
            value: kpis ? kpis.totalOrders.toLocaleString('ru') : '—',
            sub:   kpis ? `+${kpis.orders7} за 7 дней` : undefined,
          },
          {
            title: 'Пользователей', icon: Users, color: '#06B6D4', href: '/admin/users',
            value: kpis ? kpis.totalUsers.toLocaleString('ru') : '—',
            sub:   kpis ? `+${kpis.newUsers7} за 7 дней` : undefined,
          },
          {
            title: 'Ждут доставки', icon: Truck, color: '#FB923C', href: '/admin/deliveries',
            value: kpis ? String(waiting) : '—',
            sub:   waiting > 0 ? 'Требуют внимания' : 'Всё доставлено',
          },
        ].map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>Выручка за 7 дней</p>
              <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
                Итого: <span className="text-[#22C55E]">{kpis ? formatPrice(kpis.rev7) : '—'}</span>
              </p>
            </div>
            <Link href="/admin/analytics"
              className="flex items-center gap-1 font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors"
              style={{ fontSize: '12px' }}>
              Подробнее <ArrowRight style={{ width: '12px', height: '12px' }} />
            </Link>
          </div>
          {loading
            ? <div className="h-24 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            : <BarChart data={daily.map(d => ({ label: d.label, value: d.revenue }))} />
          }
        </motion.div>

        {/* Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl p-5"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="font-heading font-semibold text-white mb-4" style={{ fontSize: '14px' }}>Метрики</p>
          <div className="space-y-3">
            {[
              { label: 'Активных игр',  value: kpis?.totalGames ?? 0,  color: '#06B6D4', icon: Package     },
              { label: 'Новых (7 дней)',value: kpis?.newUsers7 ?? 0,   color: '#F59E0B', icon: Users       },
              { label: 'Заказов (7 дн)',value: kpis?.orders7 ?? 0,     color: '#22C55E', icon: ShoppingBag },
              { label: 'Ждут доставки', value: kpis?.waiting ?? 0,     color: kpis && kpis.waiting > 0 ? '#FB923C' : '#4B5563', icon: Truck },
            ].map(m => (
              <div key={m.label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ background: `${m.color}12`, border: `1px solid ${m.color}20` }}>
                  <m.icon style={{ width: '12px', height: '12px', color: m.color }} />
                </div>
                <p className="font-body text-[#6B7280] flex-1" style={{ fontSize: '11px' }}>{m.label}</p>
                <p className="font-heading font-semibold" style={{ fontSize: '13px', color: m.color }}>
                  {loading ? '…' : m.value.toLocaleString('ru')}
                </p>
              </div>
            ))}
          </div>

          {/* Status distribution */}
          {data && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="font-body text-[#4B5563] mb-2.5" style={{ fontSize: '10.5px' }}>Статусы заказов</p>
              {Object.entries(data.statusDist).map(([status, count]) => {
                const cfg = STATUS_CFG[status];
                const total = Object.values(data.statusDist).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={status} className="flex items-center gap-2 mb-1.5">
                    <div className="w-16 text-right">
                      <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
                        {cfg?.label ?? status}
                      </span>
                    </div>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: cfg?.color ?? '#6B7280' }}
                      />
                    </div>
                    <span className="font-body text-[#4B5563] w-6 text-right" style={{ fontSize: '10px' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between px-5 py-4"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <ShoppingBag style={{ width: '14px', height: '14px', color: '#7C3AED' }} />
            <span className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>Последние заказы</span>
          </div>
          <Link href="/admin/orders"
            className="flex items-center gap-1 font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors"
            style={{ fontSize: '12px' }}>
            Все <ArrowRight style={{ width: '12px', height: '12px' }} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['ID', 'Игра', 'Пользователь', 'Сумма', 'Статус', 'Дата'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-body text-[#374151]"
                      style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <RefreshCw style={{ width: '14px', height: '14px', color: '#374151', margin: '0 auto 6px', animation: 'spin 1s linear infinite' }} />
                    <p className="font-body text-[#374151]" style={{ fontSize: '12px' }}>Загрузка...</p>
                  </td>
                </tr>
              ) : recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <p className="font-body text-[#374151]" style={{ fontSize: '12px' }}>Нет заказов</p>
                  </td>
                </tr>
              ) : recent.map((order, i) => {
                const sc = STATUS_CFG[order.status] ?? STATUS_CFG.PENDING;
                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.05 }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-pixel text-[#6B7280]" style={{ fontSize: '8px' }}>
                        #{order.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-body text-white" style={{ fontSize: '12px' }}>{order.gameTitle}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{order.username}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-heading font-semibold text-white" style={{ fontSize: '12px' }}>
                        {Math.round(order.totalPrice / 1000)}K
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1"
                           style={{ background: sc.bg, border: `1px solid ${sc.color}25` }}>
                        <sc.icon style={{ width: '9px', height: '9px', color: sc.color }} />
                        <span className="font-body" style={{ fontSize: '10px', color: sc.color }}>{sc.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
                        {new Date(order.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Warning if deliveries pending */}
      {!loading && waiting > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
          style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.2)' }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle style={{ width: '16px', height: '16px', color: '#FB923C', flexShrink: 0 }} />
            <p className="font-body text-[#FB923C]" style={{ fontSize: '13px' }}>
              <strong>{waiting}</strong> {waiting === 1 ? 'заказ ждёт' : 'заказов ждут'} ручной доставки
            </p>
          </div>
          <Link href="/admin/deliveries"
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 font-heading font-semibold text-white text-sm whitespace-nowrap"
            style={{ background: 'rgba(251,146,60,0.85)', boxShadow: '0 0 12px rgba(251,146,60,0.25)' }}>
            Доставить <ArrowRight style={{ width: '13px', height: '13px' }} />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
