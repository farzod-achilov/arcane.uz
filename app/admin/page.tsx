'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag, Users, TrendingUp, TrendingDown,
  ArrowRight, Clock, Check, RefreshCw, Truck,
  DollarSign, Package, AlertTriangle, Trophy,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

/* ── Types ───────────────────────────────────────────── */
interface TopGame {
  gameId: string | null; title: string; cover: string | null;
  genres: string[]; sales: number; revenue: number;
}

interface DashData {
  kpis: {
    totalRevenue: number; totalOrders: number; totalUsers: number; totalGames: number;
    revPeriod: number; ordersPeriod: number; newUsersPeriod: number; waiting: number;
    revDelta: number | null; ordersDelta: number | null; usersDelta: number | null;
    // legacy compat
    rev7?: number; orders7?: number; newUsers7?: number;
  };
  daily:        { label: string; date: string; revenue: number; orders: number; newUsers: number }[];
  statusDist:   Record<string, number>;
  recentOrders: { id: string; totalPrice: number; status: string; createdAt: string; username: string; gameTitle: string }[];
  topGames:     TopGame[];
}

type Period = 7 | 30;

/* ── Delta badge ─────────────────────────────────────── */
function Delta({ pct }: { pct: number | null | undefined }) {
  if (pct === null || pct === undefined) return null;
  const up = pct >= 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 font-body rounded px-1.5 py-0.5"
      style={{
        fontSize: '10px',
        color:      up ? '#22C55E' : '#EF4444',
        background: up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        border:     `1px solid ${up ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
      }}
    >
      {up ? <TrendingUp style={{ width: '9px', height: '9px' }} /> : <TrendingDown style={{ width: '9px', height: '9px' }} />}
      {up ? '+' : ''}{pct}%
    </span>
  );
}

/* ── Bar Chart ───────────────────────────────────────── */
function BarChart({ data, color = '#7C3AED' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const step = data.length > 14 ? 7 : data.length > 10 ? 3 : 1;
  return (
    <div className="flex items-end gap-1 h-24 w-full">
      {data.map((d, i) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.round((d.value / max) * 88)}px` }}
            transition={{ delay: i * 0.03, duration: 0.5, ease: 'easeOut' }}
            className="w-full rounded-t-sm"
            style={{
              background: `linear-gradient(180deg, ${color}CC, ${color}55)`,
              boxShadow:  `0 0 4px ${color}44`,
              minHeight:  '3px',
            }}
            title={`${d.label}: ${d.value}`}
          />
          {i % step === 0 && (
            <span className="font-body text-[#374151] text-center truncate w-full" style={{ fontSize: '8px' }}>
              {d.label.split(' ')[0]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Stat Card ───────────────────────────────────────── */
function StatCard({
  title, value, sub, delta, icon: Icon, color, href,
}: {
  title: string; value: string; sub?: string; delta?: number | null;
  icon: React.ElementType; color: string; href?: string;
}) {
  const content = (
    <motion.div
      whileHover={{ y: -3, boxShadow: `0 8px 30px ${color}14` }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl p-5 relative overflow-hidden cursor-pointer h-full"
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
      <div className="flex items-center gap-2 mt-1 relative z-10">
        {sub && <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>{sub}</p>}
        {delta !== undefined && <Delta pct={delta} />}
      </div>
    </motion.div>
  );
  return href ? <Link href={href} className="block h-full">{content}</Link> : content;
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
  const [period,  setPeriod]  = useState<Period>(7);

  const load = useCallback(async (p = period) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/dashboard?days=${p}`);
      const json = await res.json();
      if (json && !json.error && json.kpis) setData(json as DashData);
    } catch {} finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(period); }, [period]); // eslint-disable-line

  const kpis      = data?.kpis;
  const daily     = data?.daily ?? [];
  const recent    = data?.recentOrders ?? [];
  const top       = data?.topGames ?? [];
  const statusDist = data?.statusDist ?? {};
  const today     = daily[daily.length - 1];

  const revPeriod    = kpis?.revPeriod    ?? kpis?.rev7 ?? 0;
  const ordersPeriod = kpis?.ordersPeriod ?? kpis?.orders7 ?? 0;
  const usersPeriod  = kpis?.newUsersPeriod ?? kpis?.newUsers7 ?? 0;
  const waiting      = kpis?.waiting ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#7C3AED', letterSpacing: '0.14em' }}>
          ARCANE.UZ ADMIN
        </p>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-heading font-bold text-white" style={{ fontSize: '24px' }}>Центр управления</h1>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '13px' }}>
              {loading ? 'Загрузка...' : `Сегодня ${today?.orders ?? 0} заказов · ${today?.newUsers ?? 0} новых пользователей`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Period toggle */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              {([7, 30] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-3 py-1.5 font-body text-xs transition-all"
                  style={{
                    background: period === p ? 'rgba(124,58,237,0.2)' : 'transparent',
                    color:      period === p ? '#A78BFA' : '#4B5563',
                    borderRight: p === 7 ? '1px solid rgba(255,255,255,0.08)' : undefined,
                  }}
                >
                  {p} дн.
                </button>
              ))}
            </div>
            <button
              onClick={() => load(period)} disabled={loading}
              className="flex items-center gap-2 rounded-xl px-4 py-2 font-heading font-semibold text-sm transition-all disabled:opacity-50"
              style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', color: '#9D60FA' }}
            >
              <RefreshCw style={{ width: '13px', height: '13px' }} className={loading ? 'animate-spin' : ''} />
              Обновить
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: `Выручка за ${period} дн.`, icon: DollarSign, color: '#22C55E', href: '/admin/analytics',
            value: kpis ? `${Math.round(revPeriod / 1000)}K` : '—',
            sub:   kpis ? `Всего: ${Math.round(kpis.totalRevenue / 1_000_000)}M` : undefined,
            delta: kpis?.revDelta,
          },
          {
            title: 'Заказов всего', icon: ShoppingBag, color: '#7C3AED', href: '/admin/orders',
            value: kpis ? kpis.totalOrders.toLocaleString('ru') : '—',
            sub:   kpis ? `+${ordersPeriod} за ${period} дн.` : undefined,
            delta: kpis?.ordersDelta,
          },
          {
            title: 'Пользователей', icon: Users, color: '#06B6D4', href: '/admin/users',
            value: kpis ? kpis.totalUsers.toLocaleString('ru') : '—',
            sub:   kpis ? `+${usersPeriod} за ${period} дн.` : undefined,
            delta: kpis?.usersDelta,
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
          <div className="flex items-center justify-between mb-1">
            <p className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>Выручка за {period} дней</p>
            <Link href="/admin/analytics"
              className="flex items-center gap-1 font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors"
              style={{ fontSize: '12px' }}>
              Подробнее <ArrowRight style={{ width: '12px', height: '12px' }} />
            </Link>
          </div>
          <p className="font-body text-[#4B5563] mb-4" style={{ fontSize: '12px' }}>
            Итого: <span className="text-[#22C55E]">{kpis ? formatPrice(revPeriod) : '—'}</span>
            {kpis?.revDelta != null && (
              <span className="ml-2"><Delta pct={kpis.revDelta} /></span>
            )}
          </p>
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
              { label: 'Активных игр',   value: kpis?.totalGames ?? 0,   color: '#06B6D4', icon: Package     },
              { label: `Новых (${period} дн.)`, value: usersPeriod,       color: '#F59E0B', icon: Users       },
              { label: `Заказов (${period} дн.)`, value: ordersPeriod,    color: '#22C55E', icon: ShoppingBag },
              { label: 'Ждут доставки',  value: kpis?.waiting ?? 0,      color: kpis && kpis.waiting > 0 ? '#FB923C' : '#4B5563', icon: Truck },
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
              {Object.entries(statusDist).map(([status, count]) => {
                const cfg = STATUS_CFG[status];
                const total = Object.values(statusDist).reduce((a, b) => a + b, 0);
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

      {/* Top Games */}
      {(loading || top.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <Trophy style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
            <span className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>
              Топ игр за {period} дней
            </span>
          </div>
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {top.map((g, i) => (
                <motion.div
                  key={g.gameId ?? i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Rank */}
                  <span className="font-pixel w-5 text-center flex-shrink-0"
                        style={{ fontSize: '11px', color: i < 3 ? ['#F59E0B','#9CA3AF','#CD7F32'][i] : '#374151' }}>
                    {i + 1}
                  </span>

                  {/* Cover */}
                  <div className="w-8 h-10 rounded-lg overflow-hidden flex-shrink-0 relative"
                       style={{ background: 'rgba(124,58,237,0.1)' }}>
                    {g.cover
                      ? <Image src={g.cover} alt={g.title} fill unoptimized className="object-cover" />
                      : <Package className="w-4 h-4 text-white/20 absolute inset-0 m-auto" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-white truncate" style={{ fontSize: '12.5px' }}>{g.title}</p>
                    <p className="font-body text-[#374151] truncate" style={{ fontSize: '10.5px' }}>
                      {g.genres.slice(0, 2).join(' · ') || '—'}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-heading font-semibold text-white" style={{ fontSize: '12px' }}>
                      {formatPrice(g.revenue)}
                    </p>
                    <p className="font-body text-[#4B5563]" style={{ fontSize: '10.5px' }}>
                      {g.sales} шт.
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

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

      {/* Banners quick link */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
        style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.18)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
               style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <span style={{ fontSize: '14px' }}>🖼</span>
          </div>
          <p className="font-body text-[#9CA3AF]" style={{ fontSize: '13px' }}>
            Управляйте промо-баннерами на главной странице
          </p>
        </div>
        <Link href="/admin/banners"
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 font-heading font-semibold text-white text-sm whitespace-nowrap"
          style={{ background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.4)' }}>
          Баннеры <ArrowRight style={{ width: '13px', height: '13px' }} />
        </Link>
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
