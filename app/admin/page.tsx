'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag, Users, Zap, Package, TrendingUp, TrendingDown,
  MessageSquare, ArrowRight, Clock, Check, RefreshCw, Truck,
  DollarSign,
} from 'lucide-react';
import {
  ADMIN_STATS, ADMIN_ORDERS, ADMIN_TICKETS, ANALYTICS_DAILY,
} from '@/lib/admin/mockAdminData';
import { formatPrice } from '@/lib/utils';

/* ── Animated Bar Chart ──────────────────────────────── */
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end gap-1.5 h-24 w-full">
      {data.map((d, i) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.round((d.value / max) * 88)}px` }}
            transition={{ delay: i * 0.07, duration: 0.6, ease: 'easeOut' }}
            className="w-full rounded-t-lg cursor-pointer"
            style={{
              background: 'linear-gradient(180deg, rgba(124,58,237,0.8), rgba(124,58,237,0.4))',
              boxShadow: '0 0 6px rgba(124,58,237,0.3)',
              minHeight: '4px',
            }}
            whileHover={{ opacity: 1, boxShadow: '0 0 12px rgba(124,58,237,0.6)' }}
          />
          <span className="font-body text-[#374151] text-center leading-none" style={{ fontSize: '9px' }}>
            {d.label.replace(' мая', '')}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Stat Card ───────────────────────────────────────── */
function StatCard({
  title, value, change, icon: Icon, color, prefix = '', suffix = '', href,
}: {
  title: string; value: number | string; change?: number;
  icon: React.ElementType; color: string;
  prefix?: string; suffix?: string; href?: string;
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

      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ background: `${color}15`, border: `1px solid ${color}25`, boxShadow: `0 0 12px ${color}15` }}>
          <Icon style={{ width: '17px', height: '17px', color }} />
        </div>
        {change !== undefined && (
          <div
            className="flex items-center gap-1 rounded-lg px-2 py-1"
            style={{
              background: change >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${change >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}
          >
            {change >= 0
              ? <TrendingUp style={{ width: '10px', height: '10px', color: '#22C55E' }} />
              : <TrendingDown style={{ width: '10px', height: '10px', color: '#EF4444' }} />}
            <span className="font-body" style={{ fontSize: '10px', color: change >= 0 ? '#22C55E' : '#F87171' }}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
          </div>
        )}
      </div>

      <p className="font-pixel text-white mb-1 relative z-10"
         style={{ fontSize: '20px', letterSpacing: '0.02em', textShadow: `0 0 16px ${color}40` }}>
        {prefix}{typeof value === 'number' ? value.toLocaleString('ru') : value}{suffix}
      </p>
      <p className="font-body text-[#4B5563] relative z-10" style={{ fontSize: '12px' }}>{title}</p>
    </motion.div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

/* ── Status badge ────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:    { label: 'Ожидание',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  icon: Clock  },
  paid:       { label: 'Оплачен',   color: '#06B6D4', bg: 'rgba(6,182,212,0.1)',   icon: Check  },
  processing: { label: 'Обработка', color: '#9D60FA', bg: 'rgba(157,96,250,0.1)',  icon: RefreshCw },
  delivered:  { label: 'Доставлен', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)',  icon: Truck  },
  completed:  { label: 'Выполнен',  color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   icon: Check  },
  refunded:   { label: 'Возврат',   color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   icon: TrendingDown },
};

const TICKET_PRIORITY_CFG: Record<string, { color: string; bg: string }> = {
  low:    { color: '#4B5563', bg: 'rgba(75,85,99,0.1)'    },
  medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  high:   { color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
  urgent: { color: '#F87171', bg: 'rgba(239,68,68,0.15)'  },
};

export default function AdminDashboard() {
  const recentOrders  = ADMIN_ORDERS.slice(0, 6);
  const openTickets   = ADMIN_TICKETS.filter(t => t.status !== 'resolved').slice(0, 4);
  const totalRevenue7d = ANALYTICS_DAILY.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#7C3AED', letterSpacing: '0.14em' }}>
          ARCANE.UZ ADMIN
        </p>
        <h1 className="font-heading font-bold text-white" style={{ fontSize: '24px' }}>
          Центр управления
        </h1>
        <p className="font-body text-[#4B5563]" style={{ fontSize: '13px' }}>
          10 мая 2025 · Сегодня {ANALYTICS_DAILY[ANALYTICS_DAILY.length - 1]?.orders} заказов
        </p>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Общая выручка', value: Math.round(ADMIN_STATS.totalRevenue / 1000), suffix: 'K сум', change: ADMIN_STATS.weekRevenueDelta, icon: DollarSign, color: '#22C55E', href: '/admin/analytics' },
          { title: 'Заказов всего',  value: ADMIN_STATS.totalOrders,   change: ADMIN_STATS.weekOrdersDelta, icon: ShoppingBag, color: '#7C3AED', href: '/admin/orders'   },
          { title: 'Пользователей', value: ADMIN_STATS.totalUsers,    change: ADMIN_STATS.weekUsersDelta,  icon: Users,       color: '#06B6D4', href: '/admin/users'    },
          { title: 'Открытых тикетов', value: ADMIN_STATS.openTickets, icon: MessageSquare, color: '#EF4444', href: '/admin/support' },
        ].map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>Выручка за 7 дней</p>
              <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
                Итого: <span className="text-[#22C55E]">{formatPrice(totalRevenue7d)}</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                 style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <TrendingUp style={{ width: '12px', height: '12px', color: '#22C55E' }} />
              <span className="font-body text-[#22C55E]" style={{ fontSize: '11px' }}>+{ADMIN_STATS.weekRevenueDelta}%</span>
            </div>
          </div>
          <BarChart data={ANALYTICS_DAILY.map(d => ({ label: d.date, value: d.revenue }))} />
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-5"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="font-heading font-semibold text-white mb-4" style={{ fontSize: '14px' }}>
            Метрики
          </p>
          <div className="space-y-3">
            {[
              { label: 'Продуктов',        value: ADMIN_STATS.activeProducts,  color: '#06B6D4', icon: Package       },
              { label: 'Arcane Coins',      value: `${(ADMIN_STATS.totalCoinsEarned / 1000).toFixed(1)}K`, color: '#F59E0B', icon: Zap },
              { label: 'Мгновенных доставок', value: '89%', color: '#22C55E', icon: TrendingUp },
              { label: 'Возвратов',         value: '1.1%', color: '#EF4444',  icon: TrendingDown  },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ background: `${m.color}12`, border: `1px solid ${m.color}20` }}>
                  <m.icon style={{ width: '12px', height: '12px', color: m.color }} />
                </div>
                <div className="flex-1">
                  <p className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>{m.label}</p>
                </div>
                <p className="font-heading font-semibold" style={{ fontSize: '13px', color: m.color }}>
                  {typeof m.value === 'number' ? m.value.toLocaleString('ru') : m.value}
                </p>
              </div>
            ))}
          </div>

          {/* Delivery type breakdown */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="font-body text-[#4B5563] mb-2.5" style={{ fontSize: '10.5px' }}>Типы доставки (заказы)</p>
            {[
              { label: 'Instant', pct: 67, color: '#22C55E' },
              { label: 'Steam Gift', pct: 18, color: '#66C0F4' },
              { label: 'Manual', pct: 15, color: '#9D60FA' },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2 mb-1.5">
                <div className="w-12 text-right">
                  <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>{b.label}</span>
                </div>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${b.pct}%` }}
                    transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: b.color }}
                  />
                </div>
                <span className="font-body text-[#4B5563] w-8 text-right" style={{ fontSize: '10px' }}>{b.pct}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Row: Orders + Tickets ── */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3 rounded-2xl overflow-hidden"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <ShoppingBag style={{ width: '14px', height: '14px', color: '#7C3AED' }} />
              <span className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>Последние заказы</span>
            </div>
            <Link href="/admin/orders" className="flex items-center gap-1 font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors" style={{ fontSize: '12px' }}>
              Все <ArrowRight style={{ width: '12px', height: '12px' }} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {['Заказ', 'Игра', 'Пользователь', 'Сумма', 'Статус'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-body text-[#374151]" style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, i) => {
                  const sc = STATUS_CFG[order.status];
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
                        <span className="font-pixel text-[#6B7280]" style={{ fontSize: '8px' }}>{order.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="relative w-8 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            <Image src={order.productImage} alt="" fill unoptimized className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-body text-white line-clamp-1" style={{ fontSize: '12px' }}>{order.productTitle}</p>
                            <p className="font-pixel text-[#374151]" style={{ fontSize: '7px' }}>{order.platform}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{order.userName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-heading font-semibold text-white" style={{ fontSize: '12px' }}>
                          {(order.price / 1000).toFixed(0)}K
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1"
                             style={{ background: sc.bg, border: `1px solid ${sc.color}25` }}>
                          <sc.icon style={{ width: '9px', height: '9px', color: sc.color }} />
                          <span className="font-body" style={{ fontSize: '10px', color: sc.color }}>{sc.label}</span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Open Tickets */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <MessageSquare style={{ width: '14px', height: '14px', color: '#EF4444' }} />
              <span className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>Тикеты</span>
              <span
                className="font-pixel rounded-md px-1.5 py-0.5"
                style={{ fontSize: '7px', color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                {ADMIN_STATS.openTickets} ОТКРЫТО
              </span>
            </div>
            <Link href="/admin/support" className="flex items-center gap-1 font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors" style={{ fontSize: '12px' }}>
              Все <ArrowRight style={{ width: '12px', height: '12px' }} />
            </Link>
          </div>
          <div className="p-3 space-y-2">
            {openTickets.map((ticket, i) => {
              const pc = TICKET_PRIORITY_CFG[ticket.priority];
              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.07 }}
                  className="rounded-xl p-3 transition-all duration-200 cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.2)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; }}
                >
                  <div className="flex items-start gap-2 mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: pc.color, boxShadow: `0 0 4px ${pc.color}` }} />
                    <p className="font-body text-[#9CA3AF] line-clamp-1 flex-1" style={{ fontSize: '12px' }}>
                      {ticket.subject}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 ml-3.5">
                    <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>{ticket.userName}</p>
                    <div className="flex items-center gap-1.5">
                      {ticket.userTelegram && (
                        <span className="font-body" style={{ fontSize: '9px', color: '#06B6D4' }}>{ticket.userTelegram}</span>
                      )}
                      <div className="rounded px-1.5 py-0.5" style={{ background: pc.bg }}>
                        <span className="font-pixel" style={{ fontSize: '6.5px', color: pc.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
