'use client';

import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, ShoppingBag, Users, Zap } from 'lucide-react';
import { ANALYTICS_DAILY, ADMIN_ORDERS, ADMIN_PRODUCTS } from '@/lib/admin/mockAdminData';
import { formatPrice } from '@/lib/utils';

/* ── Animated Bar Chart ──────────────────────────────── */
function BarChart({
  data, color = '#7C3AED', height = 160,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end gap-2 w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="font-body text-[#374151]" style={{ fontSize: '9.5px' }}>
            {d.value > 1000000
              ? `${(d.value / 1000000).toFixed(1)}M`
              : d.value > 999 ? `${(d.value / 1000).toFixed(0)}K` : d.value}
          </span>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.round((d.value / max) * (height - 28))}px` }}
            transition={{ delay: i * 0.07, duration: 0.65, ease: 'easeOut' }}
            className="w-full rounded-t-lg"
            style={{
              background: `linear-gradient(180deg, ${color}, ${color}60)`,
              boxShadow: `0 0 8px ${color}30`,
              minHeight: '4px',
            }}
          />
          <span className="font-body text-[#2D2D44]" style={{ fontSize: '9px' }}>
            {d.label.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Horizontal Bar ──────────────────────────────────── */
function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <p className="font-body text-[#6B7280] w-28 truncate flex-shrink-0" style={{ fontSize: '12px' }}>{label}</p>
      <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}50` }}
        />
      </div>
      <p className="font-heading font-semibold w-10 text-right" style={{ fontSize: '12px', color }}>{value}</p>
    </div>
  );
}

/* ── Donut Chart ─────────────────────────────────────── */
function DonutChart({ segments }: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  const size = 120;
  const r = 45;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dashArray = `${circumference * pct} ${circumference * (1 - pct)}`;
          const dashOffset = -offset * circumference;
          offset += pct;
          return (
            <motion.circle
              key={seg.label}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={`0 ${circumference}`}
              animate={{ strokeDasharray: dashArray, strokeDashoffset: dashOffset }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
        <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="14" fontFamily="'Space Grotesk'" fontWeight="700">
          {total}
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="font-body text-[#6B7280]" style={{ fontSize: '11.5px' }}>{seg.label}</span>
            <span className="font-heading font-semibold ml-1" style={{ fontSize: '11.5px', color: seg.color }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const totalRev   = ANALYTICS_DAILY.reduce((s, d) => s + d.revenue, 0);
  const totalOrders= ANALYTICS_DAILY.reduce((s, d) => s + d.orders, 0);
  const totalUsers = ANALYTICS_DAILY.reduce((s, d) => s + d.newUsers, 0);
  const totalCoins = ANALYTICS_DAILY.reduce((s, d) => s + d.coinsEarned, 0);

  /* Top products by sales from ADMIN_PRODUCTS */
  const topProducts = [...ADMIN_PRODUCTS].sort((a, b) => b.totalSales - a.totalSales).slice(0, 5);
  const maxSales    = topProducts[0]?.totalSales ?? 1;

  /* Platform distribution */
  const platformCount = ADMIN_ORDERS.reduce((acc, o) => ({ ...acc, [o.platform]: (acc[o.platform] ?? 0) + 1 }), {} as Record<string, number>);
  const totalOrdersAll = ADMIN_ORDERS.length;

  /* Order status distribution */
  const statusCounts = ADMIN_ORDERS.reduce((acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }), {} as Record<string, number>);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#7C3AED', letterSpacing: '0.14em' }}>АНАЛИТИКА</p>
        <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>Аналитика</h1>
        <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>За последние 7 дней</p>
      </motion.div>

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Выручка',  value: formatPrice(totalRev),                color: '#22C55E', icon: DollarSign, change: '+18.4%' },
          { label: 'Заказы',   value: String(totalOrders),                   color: '#7C3AED', icon: ShoppingBag,change: '+22.1%' },
          { label: 'Новые user',value: String(totalUsers),                   color: '#06B6D4', icon: Users,      change: '+9.6%'  },
          { label: 'Coins',    value: `${(totalCoins / 1000).toFixed(1)}K`, color: '#F59E0B', icon: Zap,         change: '+15.2%' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: '#0D0D1A', border: `1px solid ${s.color}15` }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
                 style={{ background: `radial-gradient(circle at top right, ${s.color}0E, transparent 70%)` }} />
            <div className="flex items-center justify-between mb-3">
              <s.icon style={{ width: '15px', height: '15px', color: s.color }} />
              <div className="flex items-center gap-1 rounded-lg px-2 py-0.5"
                   style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <TrendingUp style={{ width: '9px', height: '9px', color: '#22C55E' }} />
                <span className="font-body text-[#22C55E]" style={{ fontSize: '9.5px' }}>{s.change}</span>
              </div>
            </div>
            <p className="font-pixel text-white mb-0.5" style={{ fontSize: '14px', color: s.color }}>{s.value}</p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue + Orders charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-5"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="font-heading font-semibold text-white mb-1" style={{ fontSize: '13px' }}>Выручка по дням</p>
          <p className="font-body text-[#4B5563] mb-4" style={{ fontSize: '11px' }}>4–10 мая 2025</p>
          <BarChart data={ANALYTICS_DAILY.map(d => ({ label: d.date, value: d.revenue }))} color="#22C55E" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-5"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="font-heading font-semibold text-white mb-1" style={{ fontSize: '13px' }}>Заказы по дням</p>
          <p className="font-body text-[#4B5563] mb-4" style={{ fontSize: '11px' }}>4–10 мая 2025</p>
          <BarChart data={ANALYTICS_DAILY.map(d => ({ label: d.date, value: d.orders }))} color="#7C3AED" height={160} />
        </motion.div>
      </div>

      {/* Bottom row: Top products + Distribution */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="font-heading font-semibold text-white mb-4" style={{ fontSize: '13px' }}>Топ продуктов по продажам</p>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="font-pixel text-[#374151] w-4 text-center flex-shrink-0" style={{ fontSize: '9px' }}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-body text-[#9CA3AF] mb-1" style={{ fontSize: '12px' }}>{p.title}</p>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.totalSales / maxSales) * 100}%` }}
                      transition={{ duration: 0.7, delay: 0.4 + i * 0.08, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        background: i === 0 ? 'linear-gradient(90deg, #F59E0B, #F97316)' : i === 1 ? '#7C3AED' : '#06B6D4',
                        boxShadow: `0 0 6px ${i === 0 ? '#F59E0B' : i === 1 ? '#7C3AED' : '#06B6D4'}40`,
                      }}
                    />
                  </div>
                </div>
                <span className="font-heading font-bold w-10 text-right flex-shrink-0"
                      style={{ fontSize: '12px', color: i === 0 ? '#F59E0B' : '#9CA3AF' }}>
                  {p.totalSales}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Distributions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl p-5 space-y-5"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Order status */}
          <div>
            <p className="font-heading font-semibold text-white mb-3" style={{ fontSize: '13px' }}>Статусы заказов</p>
            <DonutChart segments={[
              { label: 'Выполнен',  value: statusCounts.completed ?? 0,  color: '#22C55E' },
              { label: 'Доставлен', value: statusCounts.delivered ?? 0,  color: '#7C3AED' },
              { label: 'Обработка', value: statusCounts.processing ?? 0, color: '#9D60FA' },
              { label: 'Ожидание',  value: statusCounts.pending ?? 0,    color: '#F59E0B' },
            ].filter(s => s.value > 0)} />
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
            <p className="font-heading font-semibold text-white mb-3" style={{ fontSize: '13px' }}>По платформам</p>
            <div className="space-y-2">
              {Object.entries(platformCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([platform, count]) => (
                  <HBar
                    key={platform}
                    label={platform}
                    value={count}
                    max={totalOrdersAll}
                    color={platform === 'Steam' ? '#66C0F4' : platform === 'PS5' ? '#0070CC' : platform === 'EA App' ? '#FF4500' : '#7C3AED'}
                  />
                ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
