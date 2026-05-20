'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, TrendingUp, Users, ArrowDownLeft, ArrowUpRight,
  Crown, Star, Shield, Sparkles, Settings2, Check, X,
  RefreshCw, Gift, Percent,
} from 'lucide-react';
import { COINS_CONFIG, ADMIN_USERS, ADMIN_STATS } from '@/lib/admin/mockAdminData';
import type { UserLevel } from '@/lib/admin/adminTypes';

/* ── Level config ───────────────────────────────────────── */
const LEVEL_META: Record<UserLevel, { color: string; glow: string; icon: React.ElementType; bg: string; border: string }> = {
  Rookie:  { color: '#9CA3AF', glow: '#9CA3AF40', icon: Shield,    bg: 'rgba(156,163,175,0.07)', border: 'rgba(156,163,175,0.18)' },
  Player:  { color: '#3B82F6', glow: '#3B82F640', icon: Star,      bg: 'rgba(59,130,246,0.07)',  border: 'rgba(59,130,246,0.18)'  },
  Elite:   { color: '#7C3AED', glow: '#7C3AED40', icon: Crown,     bg: 'rgba(124,58,237,0.07)', border: 'rgba(124,58,237,0.18)'  },
  Phantom: { color: '#06B6D4', glow: '#06B6D440', icon: Sparkles,  bg: 'rgba(6,182,212,0.07)',  border: 'rgba(6,182,212,0.18)'   },
  Arcane:  { color: '#F59E0B', glow: '#F59E0B40', icon: Zap,       bg: 'rgba(245,158,11,0.09)', border: 'rgba(245,158,11,0.22)'  },
};

const LEVELS: UserLevel[] = ['Rookie', 'Player', 'Elite', 'Phantom', 'Arcane'];

/* ── Mock transactions ──────────────────────────────────── */
const MOCK_TX = [
  { id: 'tx1', user: 'Бобур Хасанов',   type: 'earn',  amount: 249,  reason: 'Покупка Cyberpunk 2077',   time: '10 мая, 14:23', level: 'Elite'   as UserLevel },
  { id: 'tx2', user: 'Алишер Каримов',  type: 'spend', amount: 500,  reason: 'Скидка на заказ ARC-45228', time: '10 мая, 11:40', level: 'Phantom' as UserLevel },
  { id: 'tx3', user: 'Темур Абдуллаев', type: 'earn',  amount: 750,  reason: 'Сезонный бонус x2',         time: '09 мая, 20:15', level: 'Arcane'  as UserLevel },
  { id: 'tx4', user: 'Камила Юсупова',  type: 'earn',  amount: 299,  reason: 'Покупка Elden Ring',         time: '09 мая, 11:05', level: 'Player'  as UserLevel },
  { id: 'tx5', user: 'Малика Холматова',type: 'earn',  amount: 279,  reason: "Покупка Baldur's Gate 3",   time: '08 мая, 16:10', level: 'Elite'   as UserLevel },
  { id: 'tx6', user: 'Жавлон Мирзаев',  type: 'spend', amount: 200,  reason: 'Применена скидка',          time: '08 мая, 13:22', level: 'Elite'   as UserLevel },
  { id: 'tx7', user: 'Темур Абдуллаев', type: 'earn',  amount: 199,  reason: 'Покупка Resident Evil 4',   time: '07 мая, 10:30', level: 'Arcane'  as UserLevel },
  { id: 'tx8', user: 'Санжар Бекмуратов',type:'earn',  amount: 219,  reason: 'Покупка Red Dead 2',        time: '06 мая, 20:45', level: 'Player'  as UserLevel },
];

/* ── Animated count ─────────────────────────────────────── */
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

/* ── Level cashback card ────────────────────────────────── */
function LevelCard({
  level, cashback, multiplier, userCount, isEditing, onEdit, editVal, onSave, onCancel, onChange,
}: {
  level: UserLevel;
  cashback: number;
  multiplier: number;
  userCount: number;
  isEditing: boolean;
  onEdit: () => void;
  editVal: number;
  onSave: () => void;
  onCancel: () => void;
  onChange: (v: number) => void;
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
          <p className="font-body text-[#374151]" style={{ fontSize: '10px' }}>{userCount} игроков</p>
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
                type="number"
                value={editVal}
                onChange={e => onChange(parseFloat(e.target.value) || 0)}
                step="0.5"
                min="0"
                max="10"
                className="rounded-lg px-2 py-1.5 text-white font-heading font-bold outline-none w-20"
                style={{
                  background: '#09090E',
                  border: `1px solid ${meta.color}40`,
                  fontSize: '16px',
                }}
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

/* ── Main page ──────────────────────────────────────────── */
export default function AdminCoinsPage() {
  const totalCoins = ADMIN_USERS.reduce((s, u) => s + u.coins, 0);
  const earnedToday = MOCK_TX.filter(t => t.type === 'earn' && t.time.startsWith('10 мая')).reduce((s, t) => s + t.amount, 0);
  const spentToday  = MOCK_TX.filter(t => t.type === 'spend' && t.time.startsWith('10 мая')).reduce((s, t) => s + t.amount, 0);

  const [config, setConfig]           = useState({ ...COINS_CONFIG });
  const [editingLevel, setEditLevel]  = useState<UserLevel | null>(null);
  const [editCashback, setEditCashback] = useState(0);
  const [txFilter, setTxFilter]       = useState<'all' | 'earn' | 'spend'>('all');
  const [seasonalOn, setSeasonalOn]   = useState(config.seasonalBonus);

  const levelUserCount = (l: UserLevel) => ADMIN_USERS.filter(u => u.level === l).length;

  const startEdit = (l: UserLevel) => {
    setEditLevel(l);
    setEditCashback(config.cashbackByLevel[l]);
  };
  const saveEdit = () => {
    if (!editingLevel) return;
    setConfig(c => ({
      ...c,
      cashbackByLevel: { ...c.cashbackByLevel, [editingLevel]: editCashback },
    }));
    setEditLevel(null);
  };

  const filteredTx = MOCK_TX.filter(t => txFilter === 'all' || t.type === txFilter);

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#F59E0B', letterSpacing: '0.14em' }}>
          УПРАВЛЕНИЕ
        </p>
        <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>
          Arcane Coins
        </h1>
        <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
          Монеты в обороте: {totalCoins.toLocaleString('ru')} · Кэшбэк & бонусы
        </p>
      </motion.div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="В обороте"
          value={totalCoins.toLocaleString('ru')}
          sub="у всех игроков"
          icon={Zap}
          color="#F59E0B"
          glow="#F59E0B30"
          delay={0}
        />
        <MetricCard
          title="Заработано сегодня"
          value={`+${earnedToday}`}
          sub="+18.4% к вчера"
          icon={ArrowUpRight}
          color="#22C55E"
          glow="#22C55E30"
          delay={0.08}
        />
        <MetricCard
          title="Потрачено сегодня"
          value={`-${spentToday}`}
          sub="применено скидок"
          icon={ArrowDownLeft}
          color="#EF4444"
          glow="#EF444430"
          delay={0.16}
        />
        <MetricCard
          title="Всего выдано"
          value={`${(ADMIN_STATS.totalCoinsEarned / 1000).toFixed(1)}K`}
          sub="за всё время"
          icon={TrendingUp}
          color="#7C3AED"
          glow="#7C3AED30"
          delay={0.24}
        />
      </div>

      {/* ── Level Cashback Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>
              Кэшбэк по уровням
            </h2>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11.5px' }}>
              Нажмите на карточку для редактирования процента
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <Zap style={{ width: '11px', height: '11px', color: '#F59E0B' }} />
            <span className="font-body text-[#F59E0B]" style={{ fontSize: '11px' }}>
              Coins = 1 сум ≈ 0.001 Coin
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {LEVELS.map(level => (
            <LevelCard
              key={level}
              level={level}
              cashback={config.cashbackByLevel[level]}
              multiplier={config.multiplierByLevel[level]}
              userCount={levelUserCount(level)}
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

      {/* ── Bonus Settings + Transactions ── */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Bonus settings */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-5"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <Settings2 style={{ width: '14px', height: '14px', color: '#7C3AED' }} />
            </div>
            <h2 className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>
              Настройки бонусов
            </h2>
          </div>

          <div className="space-y-4">
            {/* Seasonal bonus toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-[#9CA3AF]" style={{ fontSize: '13px' }}>Сезонный бонус</p>
                <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>
                  x{config.seasonalMultiplier} к кэшбэку
                </p>
              </div>
              <button onClick={() => setSeasonalOn(v => !v)}>
                <motion.div
                  animate={{ background: seasonalOn ? 'linear-gradient(90deg, #7C3AED, #06B6D4)' : '#1A1A28' }}
                  transition={{ duration: 0.25 }}
                  className="w-10 h-5.5 rounded-full relative"
                  style={{ width: '40px', height: '22px' }}
                >
                  <motion.div
                    animate={{ x: seasonalOn ? '18px' : '2px' }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white"
                    style={{ width: '18px', height: '18px', top: '2px' }}
                  />
                </motion.div>
              </button>
            </div>

            {seasonalOn && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)' }}
              >
                <p className="font-body text-[#C4B5FD]" style={{ fontSize: '11px' }}>
                  🎮 Активен: все кэшбэки ×{config.seasonalMultiplier}
                </p>
              </motion.div>
            )}

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }} />

            {/* Welcome bonus */}
            <div>
              <p className="font-body text-[#6B7280] mb-2" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Бонус за регистрацию
              </p>
              <div className="flex items-center gap-2">
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
            </div>

            {/* Referral bonus */}
            <div>
              <p className="font-body text-[#6B7280] mb-2" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Бонус за реферал
              </p>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                   style={{ background: '#09090E', border: '1px solid rgba(6,182,212,0.25)' }}>
                <Users style={{ width: '13px', height: '13px', color: '#06B6D4' }} />
                <input
                  type="number"
                  value={config.referralBonus}
                  onChange={e => setConfig(c => ({ ...c, referralBonus: +e.target.value }))}
                  className="bg-transparent outline-none text-white font-heading font-bold flex-1"
                  style={{ fontSize: '16px' }}
                />
                <span className="font-body text-[#4B5563]" style={{ fontSize: '10px' }}>coins</span>
              </div>
            </div>

            <button
              className="w-full rounded-xl py-2.5 font-heading font-semibold text-white transition-all mt-2"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                fontSize: '13px',
                boxShadow: '0 0 16px rgba(124,58,237,0.3)',
              }}
            >
              Сохранить настройки
            </button>
          </div>
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-2">
              <RefreshCw style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
              <span className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>
                Транзакции монет
              </span>
            </div>
            <div className="flex gap-1">
              {(['all', 'earn', 'spend'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTxFilter(f)}
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
            <AnimatePresence>
              {filteredTx.map((tx, i) => {
                const meta = LEVEL_META[tx.level];
                const LvlIcon = meta.icon;
                const isEarn = tx.type === 'earn';
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.015] transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    {/* Level badge */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
                    >
                      <LvlIcon style={{ width: '13px', height: '13px', color: meta.color }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[#D1D5DB]" style={{ fontSize: '12.5px' }}>{tx.user}</p>
                      <p className="font-body text-[#374151] truncate" style={{ fontSize: '10.5px' }}>{tx.reason}</p>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p
                        className="font-heading font-bold"
                        style={{
                          fontSize: '14px',
                          color: isEarn ? '#22C55E' : '#F87171',
                          textShadow: isEarn ? '0 0 10px rgba(34,197,94,0.4)' : '0 0 10px rgba(239,68,68,0.4)',
                        }}
                      >
                        {isEarn ? '+' : '-'}{tx.amount}
                        <span style={{ fontSize: '10px', marginLeft: '3px', opacity: 0.7 }}>
                          <Zap style={{ display: 'inline', width: '9px', height: '9px' }} />
                        </span>
                      </p>
                      <p className="font-body text-[#1F2937]" style={{ fontSize: '10px' }}>{tx.time}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ── Distribution panel ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl p-5"
        style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Percent style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
          <h2 className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>
            Распределение монет по уровням
          </h2>
        </div>
        <div className="space-y-3">
          {LEVELS.map((level, i) => {
            const meta   = LEVEL_META[level];
            const users  = ADMIN_USERS.filter(u => u.level === level);
            const coins  = users.reduce((s, u) => s + u.coins, 0);
            const maxC   = Math.max(...LEVELS.map(l => ADMIN_USERS.filter(u => u.level === l).reduce((s, u) => s + u.coins, 0)));
            return (
              <div key={level} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-28 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full" style={{ background: meta.color, boxShadow: `0 0 4px ${meta.glow}` }} />
                  <span className="font-pixel" style={{ fontSize: '8px', color: meta.color, letterSpacing: '0.06em' }}>
                    {level.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${maxC > 0 ? (coins / maxC) * 100 : 0}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.08, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: meta.color, boxShadow: `0 0 8px ${meta.glow}` }}
                  />
                </div>
                <span className="font-heading font-semibold w-16 text-right flex-shrink-0"
                      style={{ fontSize: '12px', color: meta.color }}>
                  {coins.toLocaleString('ru')}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
