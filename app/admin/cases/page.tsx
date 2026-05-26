'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, Star, Zap, TrendingUp, Crown, Sparkles,
  X, Plus, ToggleLeft, ToggleRight, RefreshCw, Loader2,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

/* ── Rarity config ──────────────────────────────────────── */
const RARITY_META = {
  silver: {
    label: 'Silver', color: '#9CA3AF', glow: '#9CA3AF30',
    bg: 'linear-gradient(135deg, #1A1A25, #12121C)',
    border: 'rgba(156,163,175,0.25)', glowBorder: 'rgba(156,163,175,0.5)',
    icon: Star,
    headerGradient: 'linear-gradient(135deg, rgba(156,163,175,0.15), rgba(156,163,175,0.04))',
  },
  gold: {
    label: 'Gold', color: '#F59E0B', glow: '#F59E0B30',
    bg: 'linear-gradient(135deg, #1C1A10, #14120A)',
    border: 'rgba(245,158,11,0.3)', glowBorder: 'rgba(245,158,11,0.6)',
    icon: Crown,
    headerGradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.04))',
  },
  arcane: {
    label: 'Arcane', color: '#7C3AED', glow: '#7C3AED35',
    bg: 'linear-gradient(135deg, #130D1E, #0D0912)',
    border: 'rgba(124,58,237,0.35)', glowBorder: 'rgba(124,58,237,0.65)',
    icon: Sparkles,
    headerGradient: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(124,58,237,0.05))',
  },
} as const;

type RarityKey = keyof typeof RARITY_META;

function themeToRarity(theme: string): RarityKey {
  const t = theme.toLowerCase();
  if (t.includes('gold') || t.includes('золот') || t.includes('premium')) return 'gold';
  if (t.includes('arcane') || t.includes('арк') || t.includes('legend') || t.includes('epic')) return 'arcane';
  return 'silver';
}

const DB_RARITY_COLOR: Record<string, string> = {
  COMMON:    '#9CA3AF',
  RARE:      '#3B82F6',
  EPIC:      '#7C3AED',
  LEGENDARY: '#F59E0B',
};

/* ── Types ──────────────────────────────────────────────── */
interface DBReward {
  id:         string;
  name:       string;
  rarity:     string;
  dropChance: number;
  type:       string;
}

interface DBCase {
  id:            string;
  name:          string;
  slug:          string;
  theme:         string;
  price:         number;
  description:   string | null;
  imageUrl:      string | null;
  isActive:      boolean;
  totalOpened:   number;
  featuredOrder: number | null;
  drop_rewards:  DBReward[];
}

/* ── Drop chance bar ────────────────────────────────────── */
function DropBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-body text-[#6B7280] w-20 text-right flex-shrink-0" style={{ fontSize: '10.5px' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct * 100, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}50` }}
        />
      </div>
      <span className="font-heading font-bold w-12 text-right flex-shrink-0"
            style={{ fontSize: '11.5px', color }}>{(pct * 100).toFixed(1)}%</span>
    </div>
  );
}

/* ── Case card ──────────────────────────────────────────── */
function CaseCard({
  item, toggling, onToggle,
}: {
  item: DBCase;
  toggling: boolean;
  onToggle: () => void;
}) {
  const rarityKey = themeToRarity(item.theme);
  const meta      = RARITY_META[rarityKey];
  const RarityIcon = meta.icon;
  const revenue   = item.totalOpened * item.price;

  const byRarity = item.drop_rewards.reduce<Record<string, number>>((acc, r) => {
    acc[r.rarity] = (acc[r.rarity] ?? 0) + r.dropChance;
    return acc;
  }, {});

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, boxShadow: `0 16px 48px ${meta.glow}` }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden relative"
      style={{ background: meta.bg, border: `1px solid ${item.isActive ? meta.border : 'rgba(255,255,255,0.06)'}`, opacity: item.isActive ? 1 : 0.55 }}
    >
      <div className="absolute top-0 left-0 right-0 h-px"
           style={{ background: `linear-gradient(90deg, transparent, ${meta.color}60, transparent)` }} />
      <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none"
           style={{ background: `radial-gradient(circle at top right, ${meta.glow}, transparent 65%)` }} />

      {/* Header */}
      <div className="p-5" style={{ background: meta.headerGradient }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                 style={{ background: `${meta.color}15`, border: `1px solid ${meta.border}`, boxShadow: `0 0 20px ${meta.glow}` }}>
              {item.imageUrl
                ? <img src={item.imageUrl} alt={item.name} className="w-8 h-8 object-contain" />
                : <RarityIcon style={{ width: '22px', height: '22px', color: meta.color }} />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-pixel" style={{ fontSize: '7px', color: meta.color, letterSpacing: '0.1em' }}>
                  {meta.label.toUpperCase()}
                </span>
                {item.featuredOrder != null && (
                  <span className="font-pixel rounded px-1.5 py-0.5"
                        style={{ fontSize: '6px', color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', letterSpacing: '0.06em' }}>
                    FEATURED
                  </span>
                )}
              </div>
              <p className="font-heading font-bold text-white" style={{ fontSize: '16px' }}>{item.name}</p>
              {item.description && (
                <p className="font-body text-[#4B5563] mt-0.5 line-clamp-1" style={{ fontSize: '10.5px' }}>{item.description}</p>
              )}
            </div>
          </div>

          {/* Active toggle */}
          <button
            onClick={onToggle}
            disabled={toggling}
            title={item.isActive ? 'Деактивировать' : 'Активировать'}
            className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 transition-all disabled:opacity-50 flex-shrink-0"
            style={{
              background: item.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)',
              border: item.isActive ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(107,114,128,0.2)',
              color: item.isActive ? '#22C55E' : '#6B7280',
            }}
          >
            {toggling
              ? <Loader2 style={{ width: '12px', height: '12px' }} className="animate-spin" />
              : item.isActive
                ? <ToggleRight style={{ width: '14px', height: '14px' }} />
                : <ToggleLeft  style={{ width: '14px', height: '14px' }} />}
            <span className="font-body" style={{ fontSize: '10px' }}>
              {item.isActive ? 'Активен' : 'Выкл'}
            </span>
          </button>
        </div>
      </div>

      {/* Price + stats */}
      <div className="px-5 py-3 flex items-center gap-4"
           style={{ borderTop: `1px solid ${meta.border}`, borderBottom: `1px solid ${meta.border}` }}>
        <div>
          <p className="font-body text-[#374151]" style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Цена</p>
          <p className="font-pixel" style={{ fontSize: '16px', color: meta.color, textShadow: `0 0 10px ${meta.color}60` }}>
            {formatPrice(item.price)}
          </p>
        </div>
        <div style={{ borderLeft: `1px solid ${meta.border}`, paddingLeft: '16px' }}>
          <p className="font-body text-[#374151]" style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Открыто</p>
          <p className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>{item.totalOpened.toLocaleString('ru')}</p>
        </div>
        <div style={{ borderLeft: `1px solid ${meta.border}`, paddingLeft: '16px' }}>
          <p className="font-body text-[#374151]" style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Выручка</p>
          <p className="font-heading font-bold text-[#22C55E]" style={{ fontSize: '13px' }}>
            {revenue >= 1_000_000 ? `${(revenue / 1_000_000).toFixed(1)}M` : `${(revenue / 1000).toFixed(0)}K`}
          </p>
        </div>
        <div style={{ borderLeft: `1px solid ${meta.border}`, paddingLeft: '16px' }}>
          <p className="font-body text-[#374151]" style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Призов</p>
          <p className="font-heading font-bold text-[#9CA3AF]" style={{ fontSize: '15px' }}>{item.drop_rewards.length}</p>
        </div>
      </div>

      {/* Rewards + drop chances */}
      <div className="px-5 py-4">
        {item.drop_rewards.length > 0 ? (
          <>
            <p className="font-body text-[#374151] mb-2.5" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Топ награды
            </p>
            <div className="space-y-1.5 mb-4">
              {item.drop_rewards.slice(0, 4).map(r => (
                <div key={r.id} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full flex-shrink-0"
                       style={{ background: DB_RARITY_COLOR[r.rarity] ?? meta.color }} />
                  <span className="font-body text-[#9CA3AF] truncate" style={{ fontSize: '12px' }}>{r.name}</span>
                  <span className="font-body text-[#374151] ml-auto flex-shrink-0" style={{ fontSize: '10.5px' }}>
                    {(r.dropChance * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
              {item.drop_rewards.length > 4 && (
                <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>
                  + ещё {item.drop_rewards.length - 4}
                </p>
              )}
            </div>
            <div className="space-y-2">
              {Object.entries(byRarity).map(([rarity, pct]) => (
                <DropBar key={rarity} label={rarity} pct={pct} color={DB_RARITY_COLOR[rarity] ?? meta.color} />
              ))}
            </div>
          </>
        ) : (
          <p className="font-body text-[#1F2937]" style={{ fontSize: '12px' }}>Нет активных призов</p>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main page ──────────────────────────────────────────── */
export default function AdminCasesPage() {
  const [cases,    setCases]   = useState<DBCase[]>([]);
  const [loading,  setLoading] = useState(true);
  const [toggling, setToggling]= useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/cases');
      const data = await res.json();
      setCases(data.cases ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(c: DBCase) {
    setToggling(c.id);
    try {
      const res  = await fetch(`/api/admin/cases/${c.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ isActive: !c.isActive }),
      });
      const data = await res.json();
      if (data.ok) {
        setCases(prev => prev.map(x => x.id === c.id ? { ...x, isActive: data.case.isActive } : x));
      }
    } finally { setToggling(null); }
  }

  const totalOpened  = cases.reduce((s, c) => s + c.totalOpened, 0);
  const totalRevenue = cases.reduce((s, c) => s + c.totalOpened * c.price, 0);
  const active       = cases.filter(c => c.isActive).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#9D60FA', letterSpacing: '0.14em' }}>УПРАВЛЕНИЕ</p>
          <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>Mystery Cases</h1>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
            {loading ? 'Загрузка...' : `${cases.length} кейсов · ${active} активных · ${totalOpened.toLocaleString('ru')} открыто`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load} disabled={loading}
            className="flex items-center gap-2 rounded-xl px-3 py-2 font-heading font-semibold text-sm transition-all disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280' }}
          >
            <RefreshCw style={{ width: '13px', height: '13px' }} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-semibold text-white transition-all self-start sm:self-auto"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: '13px', boxShadow: '0 0 16px rgba(124,58,237,0.3)' }}
          >
            <Plus style={{ width: '14px', height: '14px' }} />
            Новый кейс
          </button>
        </div>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Всего открыто',  value: loading ? '...' : totalOpened.toLocaleString('ru'),                            color: '#9D60FA', icon: Gift      },
          { label: 'Выручка кейсов', value: loading ? '...' : `${(totalRevenue / 1_000_000).toFixed(1)}M`,                color: '#22C55E', icon: TrendingUp },
          { label: 'Активных',       value: loading ? '...' : String(active),                                              color: '#06B6D4', icon: Zap        },
          { label: 'Наград в кейсах',value: loading ? '...' : cases.reduce((s, c) => s + c.drop_rewards.length, 0).toLocaleString('ru'), color: '#F59E0B', icon: Star },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: '#0D0D1A', border: `1px solid ${s.color}18` }}
            whileHover={{ y: -2, boxShadow: `0 8px 24px ${s.color}18` }}
          >
            <div className="absolute top-0 right-0 w-20 h-20"
                 style={{ background: `radial-gradient(circle at top right, ${s.color}12, transparent 65%)` }} />
            <s.icon style={{ width: '14px', height: '14px', color: s.color, marginBottom: '10px' }} />
            <p className="font-pixel mb-0.5" style={{ fontSize: '16px', color: s.color }}>{s.value}</p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Case cards grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 style={{ width: '24px', height: '24px', color: '#374151' }} className="animate-spin" />
          <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Загрузка кейсов...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-2xl"
             style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Gift style={{ width: '32px', height: '32px', color: '#1F2937' }} />
          <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Кейсы не найдены</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {cases.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <CaseCard
                  item={item}
                  toggling={toggling === item.id}
                  onToggle={() => toggleActive(item)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Revenue comparison */}
      {!loading && cases.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl p-5"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp style={{ width: '14px', height: '14px', color: '#9D60FA' }} />
            <h2 className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>Сравнение выручки</h2>
          </div>
          <div className="space-y-4">
            {cases.map((item, i) => {
              const rarityKey = themeToRarity(item.theme);
              const meta    = RARITY_META[rarityKey];
              const revenue = item.totalOpened * item.price;
              const maxRev  = Math.max(...cases.map(c => c.totalOpened * c.price), 1);
              return (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: `${meta.color}12`, border: `1px solid ${meta.border}` }}>
                    <meta.icon style={{ width: '13px', height: '13px', color: meta.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{item.name}</p>
                      <p className="font-heading font-semibold" style={{ fontSize: '12px', color: '#22C55E' }}>
                        {revenue >= 1_000_000 ? `${(revenue / 1_000_000).toFixed(1)}M` : formatPrice(revenue)}
                      </p>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(revenue / maxRev) * 100}%` }}
                        transition={{ duration: 0.9, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: meta.color, boxShadow: `0 0 8px ${meta.glow}` }}
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
                        Открыто: {item.totalOpened.toLocaleString('ru')}
                      </span>
                      {item.totalOpened > 0 && (
                        <>
                          <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>·</span>
                          <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
                            Средняя: {formatPrice(item.price)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
