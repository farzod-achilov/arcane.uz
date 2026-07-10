'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, TrendingUp, ArrowDownLeft, ArrowUpRight,
  Crown, Star, Shield, Sparkles, Settings2, Check, X,
  RefreshCw, Gift, Percent, Search, Loader2, Plus,
} from 'lucide-react';
import type { UserLevel } from '@/lib/admin/adminTypes';

/* ── Level meta ─────────────────────────────────────────── */
const LEVEL_META: Record<UserLevel, { color: string; glow: string; icon: React.ElementType; bg: string; border: string }> = {
  Rookie:  { color: '#9CA3AF', glow: '#9CA3AF40', icon: Shield,   bg: 'rgba(156,163,175,0.07)', border: 'rgba(156,163,175,0.18)' },
  Player:  { color: '#3B82F6', glow: '#3B82F640', icon: Star,     bg: 'rgba(59,130,246,0.07)',  border: 'rgba(59,130,246,0.18)'  },
  Elite:   { color: '#7C3AED', glow: '#7C3AED40', icon: Crown,    bg: 'rgba(124,58,237,0.07)', border: 'rgba(124,58,237,0.18)'  },
  Phantom: { color: '#06B6D4', glow: '#06B6D440', icon: Sparkles, bg: 'rgba(6,182,212,0.07)',  border: 'rgba(6,182,212,0.18)'   },
  Arcane:  { color: '#F59E0B', glow: '#F59E0B40', icon: Zap,      bg: 'rgba(245,158,11,0.09)', border: 'rgba(245,158,11,0.22)'  },
};

const LEVEL_MAP: Record<number, UserLevel> = { 1: 'Rookie', 2: 'Player', 3: 'Elite', 4: 'Phantom' };
function numToLevel(n: number): UserLevel { return LEVEL_MAP[Math.min(n, 4)] ?? 'Arcane'; }

const LEVELS: UserLevel[] = ['Rookie', 'Player', 'Elite', 'Phantom', 'Arcane'];

const COINS_CONFIG = {
  cashbackByLevel:  { Rookie: 1, Player: 2, Elite: 3, Phantom: 4, Arcane: 5 } as Record<UserLevel, number>,
  multiplierByLevel:{ Rookie: 1, Player: 1.2, Elite: 1.5, Phantom: 2, Arcane: 3 } as Record<UserLevel, number>,
  welcomeBonus:  500,
  referralBonus: 200,
  seasonalMultiplier: 2,
};

const TX_TYPE_LABEL: Record<string, string> = {
  ADMIN_GRANT:    'Администратор',
  STORE_PURCHASE: 'Покупка',
  REFERRAL_BONUS: 'Реферал',
  JACKPOT_WIN:    'Джекпот',
  DROP_OPEN:      'Кейс',
  REWARD_SELL:    'Продажа',
};

/* ── Types ──────────────────────────────────────────────── */
interface TxRecord {
  id:          string;
  type:        string;
  amount:      number;
  description: string | null;
  createdAt:   string;
  users: { id: string; username: string; level: number };
}

interface CoinsData {
  totalCoins:   number;
  earnedToday:  number;
  spentToday:   number;
  totalAllTime: number;
  recentTx:     TxRecord[];
}

interface UserHit {
  id:       string;
  username: string;
  email:    string;
  arcCoins: number;
  level:    number;
}

/* ── MetricCard ─────────────────────────────────────────── */
function MetricCard({
  title, value, sub, icon: Icon, color, glow, delay = 0,
}: {
  title: string; value: string; sub?: string;
  icon: React.ElementType; color: string; glow: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: '#0D0D1A', border: `1px solid ${color}18` }}
      whileHover={{ y: -2, boxShadow: `0 8px 32px ${glow}` }}
    >
      <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none"
           style={{ background: `radial-gradient(circle at top right, ${glow}, transparent 65%)` }} />
      <div className="absolute top-0 left-0 right-0 h-px"
           style={{ background: `linear-gradient(90deg, transparent, ${color}45, transparent)` }} />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
           style={{ background: `${color}12`, border: `1px solid ${color}22`, boxShadow: `0 0 14px ${glow}` }}>
        <Icon style={{ width: '17px', height: '17px', color }} />
      </div>
      <p className="font-pixel text-white mb-1"
         style={{ fontSize: '20px', letterSpacing: '0.02em', textShadow: `0 0 18px ${glow}` }}>
        {value}
      </p>
      <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>{title}</p>
      {sub && <p className="font-body mt-0.5" style={{ fontSize: '11px', color }}>{sub}</p>}
    </motion.div>
  );
}

/* ── LevelCard ──────────────────────────────────────────── */
function LevelCard({
  level, cashback, multiplier, isEditing, onEdit, editVal, onSave, onCancel, onChange,
}: {
  level: UserLevel; cashback: number; multiplier: number;
  isEditing: boolean; onEdit: () => void; editVal: number;
  onSave: () => void; onCancel: () => void; onChange: (v: number) => void;
}) {
  const meta = LEVEL_META[level];
  const LevelIcon = meta.icon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl p-4 relative overflow-hidden cursor-pointer group"
      style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
      whileHover={{ boxShadow: `0 0 24px ${meta.glow}` }}
    >
      <div className="absolute top-0 right-0 w-24 h-24"
           style={{ background: `radial-gradient(circle at top right, ${meta.glow}, transparent 70%)` }} />
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: `${meta.color}18`, boxShadow: `0 0 10px ${meta.glow}` }}>
          <LevelIcon style={{ width: '15px', height: '15px', color: meta.color }} />
        </div>
        <div className="flex-1">
          <p className="font-pixel" style={{ fontSize: '10px', color: meta.color, letterSpacing: '0.08em' }}>
            {level.toUpperCase()}
          </p>
        </div>
        <button
          onClick={isEditing ? onCancel : onEdit}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: meta.color }}
        >
          {isEditing
            ? <X style={{ width: '13px', height: '13px' }} />
            : <Settings2 style={{ width: '13px', height: '13px' }} />}
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <p className="font-body text-[#374151] mb-1.5" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Кэшбэк %
          </p>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number" value={editVal}
                onChange={e => onChange(parseFloat(e.target.value) || 0)}
                step="0.5" min="0" max="10"
                className="rounded-lg px-2 py-1.5 text-white font-heading font-bold outline-none w-20"
                style={{ background: '#09090E', border: `1px solid ${meta.color}40`, fontSize: '16px' }}
              />
              <span style={{ color: meta.color }} className="font-heading font-bold text-base">%</span>
              <button
                onClick={onSave}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E' }}
              >
                <Check style={{ width: '12px', height: '12px' }} />
              </button>
            </div>
          ) : (
            <p className="font-pixel" style={{ fontSize: '22px', color: meta.color, textShadow: `0 0 12px ${meta.glow}` }}>
              {cashback}%
            </p>
          )}
        </div>
        <div className="pt-3" style={{ borderTop: `1px solid ${meta.color}15` }}>
          <div className="flex items-center justify-between">
            <p className="font-body text-[#374151]" style={{ fontSize: '10px' }}>Множитель XP</p>
            <p className="font-heading font-bold" style={{ color: meta.color, fontSize: '13px' }}>{multiplier}×</p>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(multiplier / 3) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: meta.color, boxShadow: `0 0 6px ${meta.glow}` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── GrantModal ─────────────────────────────────────────── */
function GrantModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState<UserHit[]>([]);
  const [selected, setSelected] = useState<UserHit | null>(null);
  const [amount,   setAmount]   = useState('');
  const [desc,     setDesc]     = useState('');
  const [searching, setSearching] = useState(false);
  const [granting,  setGranting]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (!query.trim() || selected) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}&page=1`);
        const d = await r.json();
        setResults((d.users ?? []).slice(0, 5));
      } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query, selected]);

  async function handleGrant() {
    if (!selected || !amount) return;
    setGranting(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${selected.id}/grant-coins`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: parseInt(amount), description: desc || undefined }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? 'Ошибка'); return; }
      onSuccess();
      onClose();
    } catch {
      setError('Ошибка сервера');
    } finally { setGranting(false); }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="rounded-2xl p-6 w-full max-w-md space-y-5"
        style={{ background: '#0D0D1A', border: '1px solid rgba(245,158,11,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <Gift style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
            </div>
            <div>
              <p className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>Выдать монеты</p>
              <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>ADMIN_GRANT транзакция</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: '#374151' }}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* User search */}
        <div>
          <p className="font-body text-[#6B7280] mb-2" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Пользователь
          </p>
          {selected ? (
            <div className="flex items-center justify-between rounded-xl px-3 py-2.5"
                 style={{ background: '#09090E', border: '1px solid rgba(245,158,11,0.3)' }}>
              <div>
                <p className="font-body text-white" style={{ fontSize: '13px' }}>{selected.username}</p>
                <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>{selected.email}</p>
              </div>
              <button onClick={() => { setSelected(null); setQuery(''); }} style={{ color: '#374151' }}>
                <X style={{ width: '12px', height: '12px' }} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                   style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.1)' }}>
                {searching
                  ? <Loader2 style={{ width: '13px', height: '13px', color: '#374151' }} className="animate-spin flex-shrink-0" />
                  : <Search style={{ width: '13px', height: '13px', color: '#374151', flexShrink: 0 }} />}
                <input
                  type="text"
                  placeholder="Имя или email..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="bg-transparent outline-none text-white font-body flex-1 placeholder:text-[#1F2937]"
                  style={{ fontSize: '13px' }}
                  autoFocus
                />
              </div>
              {results.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 rounded-xl overflow-hidden z-10"
                     style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {results.map(u => (
                    <button
                      key={u.id}
                      onClick={() => { setSelected(u); setResults([]); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.04] transition-colors text-left"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <div>
                        <p className="font-body text-white" style={{ fontSize: '12.5px' }}>{u.username}</p>
                        <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>{u.email}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap style={{ width: '10px', height: '10px', color: '#F59E0B' }} />
                        <span className="font-heading font-semibold text-[#FCD34D]" style={{ fontSize: '11px' }}>
                          {u.arcCoins.toLocaleString('ru')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <p className="font-body text-[#6B7280] mb-2" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Количество монет
          </p>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
               style={{ background: '#09090E', border: '1px solid rgba(245,158,11,0.25)' }}>
            <Zap style={{ width: '13px', height: '13px', color: '#F59E0B', flexShrink: 0 }} />
            <input
              type="number" min="1"
              placeholder="500"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="bg-transparent outline-none text-white font-heading font-bold flex-1 placeholder:text-[#1F2937]"
              style={{ fontSize: '18px' }}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="font-body text-[#6B7280] mb-2" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Причина (необязательно)
          </p>
          <input
            type="text"
            placeholder="Компенсация, бонус..."
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-white font-body outline-none placeholder:text-[#1F2937]"
            style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.08)', fontSize: '13px' }}
          />
        </div>

        {error && <p className="font-body text-[#EF4444]" style={{ fontSize: '12px' }}>{error}</p>}

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-2.5 font-heading font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280', fontSize: '13px' }}
          >
            Отмена
          </button>
          <button
            onClick={handleGrant}
            disabled={!selected || !amount || granting}
            className="flex-1 rounded-xl py-2.5 font-heading font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #D97706, #B45309)', fontSize: '13px' }}
          >
            {granting
              ? <><Loader2 style={{ width: '13px', height: '13px' }} className="animate-spin" /> Выдача...</>
              : <><Zap style={{ width: '13px', height: '13px' }} /> Выдать монеты</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main page ──────────────────────────────────────────── */
export default function AdminCoinsPage() {
  const [data,       setData]       = useState<CoinsData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [txFilter,   setTxFilter]   = useState<'all' | 'earn' | 'spend'>('all');
  const [showGrant,  setShowGrant]  = useState(false);
  const [config,     setConfig]     = useState({ ...COINS_CONFIG });
  const [editingLevel, setEditLevel]= useState<UserLevel | null>(null);
  const [editCashback, setEditCashback] = useState(0);
  const [seasonalOn, setSeasonalOn] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coins');
      const d   = await res.json();
      setData(d);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (l: UserLevel) => { setEditLevel(l); setEditCashback(config.cashbackByLevel[l]); };
  const saveEdit  = () => {
    if (!editingLevel) return;
    setConfig(c => ({ ...c, cashbackByLevel: { ...c.cashbackByLevel, [editingLevel]: editCashback } }));
    setEditLevel(null);
  };

  const SPEND_TYPES = new Set(['STORE_PURCHASE']);
  const filteredTx = (data?.recentTx ?? []).filter(t =>
    txFilter === 'all' ? true :
    txFilter === 'earn'  ? !SPEND_TYPES.has(t.type) :
    SPEND_TYPES.has(t.type)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#F59E0B', letterSpacing: '0.14em' }}>
          УПРАВЛЕНИЕ
        </p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>Arcane Coins</h1>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
              {loading ? 'Загрузка...' : `В обороте: ${(data?.totalCoins ?? 0).toLocaleString('ru')} монет`}
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
              onClick={() => setShowGrant(true)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 font-heading font-semibold text-sm transition-all"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}
            >
              <Plus style={{ width: '13px', height: '13px' }} />
              Выдать монеты
            </button>
          </div>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="В обороте"
          value={loading ? '...' : (data?.totalCoins ?? 0).toLocaleString('ru')}
          sub="у всех игроков"
          icon={Zap} color="#F59E0B" glow="#F59E0B30" delay={0}
        />
        <MetricCard
          title="Выдано сегодня"
          value={loading ? '...' : `+${(data?.earnedToday ?? 0).toLocaleString('ru')}`}
          sub="через ADMIN_GRANT"
          icon={ArrowUpRight} color="#22C55E" glow="#22C55E30" delay={0.08}
        />
        <MetricCard
          title="Потрачено сегодня"
          value={loading ? '...' : `${(data?.spentToday ?? 0).toLocaleString('ru')}`}
          sub="на покупки"
          icon={ArrowDownLeft} color="#EF4444" glow="#EF444430" delay={0.16}
        />
        <MetricCard
          title="Всего выдано"
          value={loading ? '...' : `${((data?.totalAllTime ?? 0) / 1000).toFixed(1)}K`}
          sub="за всё время"
          icon={TrendingUp} color="#7C3AED" glow="#7C3AED30" delay={0.24}
        />
      </div>

      {/* Level Cashback Cards */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>Кэшбэк по уровням</h2>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11.5px' }}>Нажмите для редактирования</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
               style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Zap style={{ width: '11px', height: '11px', color: '#F59E0B' }} />
            <span className="font-body text-[#F59E0B]" style={{ fontSize: '11px' }}>Coins = 1 сум ≈ 0.001 Coin</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {LEVELS.map(level => (
            <LevelCard
              key={level}
              level={level}
              cashback={config.cashbackByLevel[level]}
              multiplier={config.multiplierByLevel[level]}
              isEditing={editingLevel === level}
              onEdit={() => startEdit(level)}
              editVal={editCashback}
              onSave={saveEdit}
              onCancel={() => setEditLevel(null)}
              onChange={setEditCashback}
            />
          ))}
        </div>
      </motion.div>

      {/* Settings + Transactions */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Bonus Settings */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl p-5"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <Settings2 style={{ width: '14px', height: '14px', color: '#7C3AED' }} />
            </div>
            <h2 className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>Настройки бонусов</h2>
          </div>
          <p className="font-body text-[#4B5563] mb-4 -mt-2" style={{ fontSize: '10.5px', lineHeight: 1.5 }}>
            Только просмотр — текущие значения из кода. Сохранение настроек здесь пока не реализовано.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-[#9CA3AF]" style={{ fontSize: '13px' }}>Сезонный бонус</p>
                <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>x{config.seasonalMultiplier} к кэшбэку</p>
              </div>
              <button onClick={() => setSeasonalOn(v => !v)}>
                <motion.div
                  animate={{ background: seasonalOn ? 'linear-gradient(90deg, #7C3AED, #06B6D4)' : '#1A1A28' }}
                  transition={{ duration: 0.25 }}
                  style={{ width: '40px', height: '22px', borderRadius: '999px', position: 'relative' }}
                >
                  <motion.div
                    animate={{ x: seasonalOn ? '18px' : '2px' }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    style={{ position: 'absolute', top: '2px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff' }}
                  />
                </motion.div>
              </button>
            </div>
            {seasonalOn && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)' }}
              >
                <p className="font-body text-[#C4B5FD]" style={{ fontSize: '11px' }}>
                  Активен: все кэшбэки ×{config.seasonalMultiplier}
                </p>
              </motion.div>
            )}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }} />
            <div>
              <p className="font-body text-[#6B7280] mb-2" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Бонус за регистрацию
              </p>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1"
                   style={{ background: '#09090E', border: '1px solid rgba(245,158,11,0.25)' }}>
                <Gift style={{ width: '13px', height: '13px', color: '#F59E0B' }} />
                <input
                  type="number"
                  value={config.welcomeBonus}
                  onChange={e => setConfig(c => ({ ...c, welcomeBonus: +e.target.value }))}
                  className="bg-transparent outline-none text-white font-heading font-bold flex-1"
                  style={{ fontSize: '16px' }}
                />
                <span className="font-body text-[#4B5563]" style={{ fontSize: '10px' }}>coins</span>
              </div>
            </div>
            <button
              disabled
              title="Сохранение не реализовано — значения зашиты в коде"
              className="w-full rounded-xl py-2.5 font-heading font-semibold cursor-not-allowed mt-2"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#4B5563', fontSize: '13px', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              Сохранить настройки (недоступно)
            </button>
          </div>
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
               style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <RefreshCw style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
              <span className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>Транзакции</span>
            </div>
            <div className="flex gap-1">
              {(['all', 'earn', 'spend'] as const).map(f => (
                <button
                  key={f} onClick={() => setTxFilter(f)}
                  className="rounded-lg px-2.5 py-1 font-body transition-all duration-200"
                  style={{
                    fontSize: '10.5px',
                    background: txFilter === f
                      ? f === 'earn' ? 'rgba(34,197,94,0.12)' : f === 'spend' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.03)',
                    border: txFilter === f
                      ? `1px solid ${f === 'earn' ? 'rgba(34,197,94,0.3)' : f === 'spend' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)'}`
                      : '1px solid rgba(255,255,255,0.06)',
                    color: txFilter === f
                      ? f === 'earn' ? '#22C55E' : f === 'spend' ? '#F87171' : '#E2E8F0'
                      : '#4B5563',
                  }}
                >
                  {f === 'all' ? 'Все' : f === 'earn' ? 'Начислено' : 'Потрачено'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2 style={{ width: '18px', height: '18px', color: '#374151' }} className="animate-spin" />
                <p className="font-body text-[#374151]" style={{ fontSize: '12px' }}>Загрузка...</p>
              </div>
            ) : filteredTx.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Транзакций нет</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredTx.map((tx, i) => {
                  const lv   = numToLevel(tx.users.level);
                  const meta = LEVEL_META[lv];
                  const LvlIcon = meta.icon;
                  const isEarn = !SPEND_TYPES.has(tx.type);
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.015] transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                           style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                        <LvlIcon style={{ width: '13px', height: '13px', color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-[#D1D5DB]" style={{ fontSize: '12.5px' }}>{tx.users.username}</p>
                        <p className="font-body text-[#374151] truncate" style={{ fontSize: '10.5px' }}>
                          {tx.description ?? TX_TYPE_LABEL[tx.type] ?? tx.type}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-heading font-bold"
                           style={{
                             fontSize: '14px',
                             color: isEarn ? '#22C55E' : '#F87171',
                             textShadow: isEarn ? '0 0 10px rgba(34,197,94,0.4)' : '0 0 10px rgba(239,68,68,0.4)',
                           }}>
                          {isEarn ? '+' : '-'}{tx.amount.toLocaleString('ru')}
                          <Zap style={{ display: 'inline', width: '9px', height: '9px', marginLeft: '3px', opacity: 0.7 }} />
                        </p>
                        <p className="font-body text-[#1F2937]" style={{ fontSize: '10px' }}>
                          {new Date(tx.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>

      {/* Distribution panel */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="rounded-2xl p-5"
        style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Percent style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
          <h2 className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>
            Распределение монет по транзакциям
          </h2>
        </div>
        {loading ? (
          <p className="font-body text-[#374151]" style={{ fontSize: '12px' }}>Загрузка...</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(TX_TYPE_LABEL).map(([type, label], i) => {
              const total = (data?.recentTx ?? []).filter(t => t.type === type).reduce((s, t) => s + t.amount, 0);
              const maxV  = Math.max(...Object.keys(TX_TYPE_LABEL).map(k => (data?.recentTx ?? []).filter(t => t.type === k).reduce((s, t) => s + t.amount, 0)), 1);
              const colors = ['#F59E0B', '#22C55E', '#EF4444', '#7C3AED', '#06B6D4', '#9CA3AF'];
              const color  = colors[i % colors.length];
              return (
                <div key={type} className="flex items-center gap-4">
                  <span className="font-pixel w-32 flex-shrink-0" style={{ fontSize: '7.5px', color, letterSpacing: '0.05em' }}>
                    {label.toUpperCase()}
                  </span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(total / maxV) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + i * 0.08, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: color, boxShadow: `0 0 8px ${color}40` }}
                    />
                  </div>
                  <span className="font-heading font-semibold w-16 text-right flex-shrink-0"
                        style={{ fontSize: '12px', color }}>
                    {total.toLocaleString('ru')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Grant modal */}
      <AnimatePresence>
        {showGrant && (
          <GrantModal
            onClose={() => setShowGrant(false)}
            onSuccess={load}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
