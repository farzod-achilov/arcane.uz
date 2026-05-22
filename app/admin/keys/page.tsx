'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound, Package, TrendingUp, AlertTriangle,
  ChevronRight, ShoppingBag, Zap, Archive,
  ArrowRight, BarChart2, RefreshCw, Plus,
} from 'lucide-react';
import StockHealthBadge from '@/components/admin/keys/StockHealthBadge';
import AddGameModal    from '@/components/admin/keys/AddGameModal';
import { MOCK_ANALYTICS } from '@/lib/admin/mockKeysData';
import type { GameStockInfo } from '@/lib/admin/adminKeysTypes';
import type { ArcaneGameListResponse } from '@/lib/arcaneApi';

// Convert arcane-api game into GameStockInfo shape for the inventory grid
function toStockInfo(g: ArcaneGameListResponse['data'][0]): GameStockInfo {
  const total = (g.stockStore ?? 0) + (g.stockDrop ?? 0);
  const threshold = 5;
  const health: GameStockInfo['health'] =
    total === 0                           ? 'EMPTY'    :
    total <= Math.floor(threshold * 0.5) ? 'CRITICAL' :
    total <= threshold                    ? 'LOW'      : 'OK';
  return {
    gameId:           g.id,
    title:            g.title,
    cover:            g.cover,
    stockStore:       g.stockStore ?? 0,
    stockDrop:        g.stockDrop  ?? 0,
    stockBoth:        0,
    sold:             0,
    disabled:         0,
    reserved:         0,
    lowStockThreshold: threshold,
    isActive:         g.isActive,
    health,
    lastDeliveredAt:  null,
  };
}

/* ── Mini stock bar ───────────────────────────────────────── */
function StockBar({ store, drop, both, total }: { store: number; drop: number; both: number; total: number }) {
  if (total === 0) return (
    <div className="h-1.5 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
  );
  const max = Math.max(total, 1);
  return (
    <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden w-full"
         style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${(store / max) * 100}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ background: '#06B6D4', borderRadius: '2px' }} />
      <motion.div initial={{ width: 0 }} animate={{ width: `${(drop / max) * 100}%` }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
        style={{ background: '#F59E0B', borderRadius: '2px' }} />
      <motion.div initial={{ width: 0 }} animate={{ width: `${(both / max) * 100}%` }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        style={{ background: '#9D60FA', borderRadius: '2px' }} />
    </div>
  );
}

/* ── Game stock card ──────────────────────────────────────── */
function GameStockCard({ game, index }: { game: GameStockInfo; index: number }) {
  const totalAvail = game.stockStore + game.stockDrop + game.stockBoth;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.05, duration: 0.35 }}
      whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}
    >
      <Link href={`/admin/keys/${game.gameId}`}>
        <div
          className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 group"
          style={{
            background: '#0D0D1A',
            border: `1px solid ${game.health === 'EMPTY' ? 'rgba(107,114,128,0.15)' : game.health === 'CRITICAL' ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.06)'}`,
          }}
        >
          {/* Cover */}
          <div className="relative h-28 overflow-hidden">
            {game.cover ? (
              <Image src={game.cover} alt={game.title} fill unoptimized className="object-cover transition-transform duration-300 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.08)' }}>
                <Package style={{ width: '28px', height: '28px', color: '#374151' }} />
              </div>
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(13,13,26,0) 40%, rgba(13,13,26,0.95) 100%)' }} />
            <div className="absolute top-2.5 right-2.5">
              <StockHealthBadge health={game.health} size="sm" />
            </div>
            {!game.isActive && (
              <div className="absolute top-2.5 left-2.5 rounded-md px-1.5 py-0.5 font-pixel"
                   style={{ background: 'rgba(0,0,0,0.7)', fontSize: '7px', color: '#6B7280', letterSpacing: '0.06em', border: '1px solid rgba(255,255,255,0.08)' }}>
                ОТКЛЮЧЁН
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="font-heading font-semibold text-white line-clamp-1 flex-1" style={{ fontSize: '13px' }}>
                {game.title}
              </p>
              <ChevronRight style={{ width: '14px', height: '14px', color: '#374151', flexShrink: 0 }}
                className="group-hover:text-[#7C3AED] transition-colors mt-0.5" />
            </div>

            {/* Stock bar */}
            <StockBar store={game.stockStore} drop={game.stockDrop} both={game.stockBoth} total={totalAvail} />

            {/* Stock numbers */}
            <div className="flex gap-3 mt-2.5">
              {[
                { label: 'STORE', value: game.stockStore, color: '#06B6D4' },
                { label: 'DROP',  value: game.stockDrop,  color: '#F59E0B' },
                { label: 'BOTH',  value: game.stockBoth,  color: '#9D60FA' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="font-pixel" style={{ fontSize: '8px', color: '#4B5563', letterSpacing: '0.04em' }}>{s.label}</span>
                  <span className="font-heading font-bold" style={{ fontSize: '12px', color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Bottom stats */}
            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-1">
                <ShoppingBag style={{ width: '10px', height: '10px', color: '#374151' }} />
                <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
                  {game.sold} продано
                </span>
              </div>
              {game.reserved > 0 && (
                <span className="font-pixel rounded px-1.5 py-0.5"
                  style={{ fontSize: '7px', color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  {game.reserved} резерв
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Alert banner ─────────────────────────────────────────── */
function AlertBanner({ games, type }: {
  games: GameStockInfo[];
  type: 'LOW' | 'CRITICAL' | 'EMPTY';
}) {
  if (games.length === 0) return null;
  const cfg = {
    LOW:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)', icon: AlertTriangle, text: 'Низкий запас' },
    CRITICAL: { color: '#EF4444', bg: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.2)',  icon: AlertTriangle, text: 'Критический запас' },
    EMPTY:    { color: '#6B7280', bg: 'rgba(107,114,128,0.07)',border: 'rgba(107,114,128,0.2)',icon: Archive,       text: 'Нет ключей' },
  }[type];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <Icon style={{ width: '14px', height: '14px', color: cfg.color, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <span className="font-body" style={{ fontSize: '12px', color: cfg.color }}>{cfg.text}: </span>
        <span className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>
          {games.map(g => g.title).join(', ')}
        </span>
      </div>
      <span className="font-pixel rounded-md px-1.5 py-0.5 flex-shrink-0"
        style={{ fontSize: '8px', color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}>
        {games.length} {games.length === 1 ? 'игра' : 'игр'}
      </span>
    </motion.div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function KeysAdminPage() {
  const [filter,      setFilter]      = useState<'ALL' | 'OK' | 'LOW' | 'CRITICAL' | 'EMPTY'>('ALL');
  const [showAddGame, setShowAddGame] = useState(false);
  const [extraGames,  setExtraGames]  = useState<GameStockInfo[]>([]);
  const [apiGames,    setApiGames]    = useState<GameStockInfo[]>([]);
  const [apiLoading,  setApiLoading]  = useState(true);

  // Fetch real games from arcane-api on mount
  useEffect(() => {
    fetch('/api/arcane/games?limit=200')
      .then(r => r.json())
      .then((res: ArcaneGameListResponse) => {
        if (res.success && res.data?.length) {
          setApiGames(res.data.map(toStockInfo));
        }
      })
      .catch(() => {/* backend offline — fall through to MOCK_ANALYTICS */})
      .finally(() => setApiLoading(false));
  }, []);

  // Merge: extra (just-added) → api → mock (fallback)
  const data = MOCK_ANALYTICS;

  const handleGameAdded = (game: Partial<GameStockInfo>) => {
    setExtraGames(prev => [game as GameStockInfo, ...prev]);
  };

  // Prefer API data; fall back to mock if API is offline
  const baseGames = apiGames.length > 0 ? apiGames : data.games;
  const allGames  = [...extraGames, ...baseGames];

  // Re-derive top stats from live data
  const liveStats = {
    totalAvailable: allGames.reduce((s, g) => s + g.stockStore + g.stockDrop + g.stockBoth, 0),
    totalSold:      allGames.reduce((s, g) => s + g.sold, 0),
    deliveredToday: data.deliveredToday,
    alertCount:     allGames.filter(g => g.health === 'CRITICAL' || g.health === 'EMPTY').length,
  };

  const filteredGames = filter === 'ALL'
    ? allGames
    : allGames.filter(g => g.health === filter);

  const topStats = [
    { title: 'Доступно',            value: liveStats.totalAvailable, icon: KeyRound,      color: '#22C55E', desc: 'активных ключей' },
    { title: 'Продано',             value: liveStats.totalSold,      icon: ShoppingBag,   color: '#7C3AED', desc: 'за всё время'   },
    { title: 'Доставлено сегодня',  value: liveStats.deliveredToday, icon: TrendingUp,    color: '#06B6D4', desc: 'ключей выдано'  },
    { title: 'Алерты',              value: liveStats.alertCount,     icon: AlertTriangle, color: '#EF4444', desc: 'требуют внимания' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#7C3AED', letterSpacing: '0.14em' }}>
          KEY INVENTORY SYSTEM
        </p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-white" style={{ fontSize: '24px' }}>
              Управление ключами
            </h1>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '13px' }}>
              {apiLoading
                ? 'Загрузка из базы данных...'
                : `${allGames.length} игр · ${liveStats.totalAvailable} доступных ключей · ${apiGames.length > 0 ? 'arcane-api' : 'mock данные'}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-body transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12px', color: '#6B7280' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
              <RefreshCw style={{ width: '13px', height: '13px' }} />
              Синхронизировать
            </button>
            <button
              onClick={() => setShowAddGame(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-body transition-all"
              style={{ background: 'rgba(124,58,237,0.9)', fontSize: '12px', color: '#fff', boxShadow: '0 0 16px rgba(124,58,237,0.28)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.9)')}>
              <Plus style={{ width: '13px', height: '13px' }} />
              Добавить игру
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topStats.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -3 }}
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: '#0D0D1A',
              border: `1px solid ${s.color}18`,
              boxShadow: `0 0 0 0 ${s.color}00`,
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${s.color}14`)}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}
          >
            <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
                 style={{ background: `radial-gradient(circle at top right, ${s.color}0E, transparent 70%)` }} />
            <div className="absolute top-0 left-0 right-0 h-px"
                 style={{ background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)` }} />
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                 style={{ background: `${s.color}12`, border: `1px solid ${s.color}22`, boxShadow: `0 0 10px ${s.color}10` }}>
              <s.icon style={{ width: '15px', height: '15px', color: s.color }} />
            </div>
            <p className="font-pixel text-white mb-0.5"
               style={{ fontSize: '22px', letterSpacing: '0.02em', textShadow: `0 0 14px ${s.color}40` }}>
              {s.value.toLocaleString('ru')}
            </p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{s.title}</p>
            <p className="font-body text-[#374151]" style={{ fontSize: '10px', marginTop: '2px' }}>{s.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Alerts ── */}
      <div className="space-y-2">
        <AlertBanner games={data.emptyGames}    type="EMPTY"    />
        <AlertBanner games={data.criticalGames} type="CRITICAL" />
        <AlertBanner games={data.lowStockGames} type="LOW"      />
      </div>

      {/* ── Legend + Filter ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {(['ALL', 'OK', 'LOW', 'CRITICAL', 'EMPTY'] as const).map(f => {
            const colors: Record<string, string> = { ALL: '#9CA3AF', OK: '#22C55E', LOW: '#F59E0B', CRITICAL: '#EF4444', EMPTY: '#4B5563' };
            const c = colors[f];
            const active = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-xl font-pixel transition-all"
                style={{
                  background: active ? `${c}15` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? `${c}30` : 'rgba(255,255,255,0.07)'}`,
                  fontSize: '9px', color: active ? c : '#374151',
                  letterSpacing: '0.06em',
                }}>
                {f === 'ALL' ? 'ВСЕ' : f}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4">
          {[
            { label: 'STORE', color: '#06B6D4' },
            { label: 'DROP',  color: '#F59E0B' },
            { label: 'BOTH',  color: '#9D60FA' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
              <span className="font-pixel text-[#374151]" style={{ fontSize: '8px' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Game grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredGames.map((game, i) => (
          <GameStockCard key={game.gameId} game={game} index={i} />
        ))}

        {/* Add game tile */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 + filteredGames.length * 0.05, duration: 0.35 }}
        >
          <button
            onClick={() => setShowAddGame(true)}
            className="w-full h-full rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-200 group"
            style={{
              minHeight: '220px',
              background: 'rgba(124,58,237,0.04)',
              border: '2px dashed rgba(124,58,237,0.18)',
            }}
            onMouseEnter={e => {
              (e.currentTarget.style.background = 'rgba(124,58,237,0.08)');
              (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)');
            }}
            onMouseLeave={e => {
              (e.currentTarget.style.background = 'rgba(124,58,237,0.04)');
              (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.18)');
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              <Plus style={{ width: '20px', height: '20px', color: '#7C3AED' }}
                className="group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-center">
              <p className="font-heading font-semibold" style={{ fontSize: '13px', color: '#7C3AED' }}>
                Добавить игру
              </p>
              <p className="font-body text-[#374151] mt-0.5" style={{ fontSize: '11px' }}>
                Поиск в API или вручную
              </p>
            </div>
          </button>
        </motion.div>

        {filteredGames.length === 0 && filter !== 'ALL' && (
          <div className="col-span-full text-center py-16">
            <KeyRound style={{ width: '32px', height: '32px', color: '#1F2937', margin: '0 auto 12px' }} />
            <p className="font-body text-[#374151]" style={{ fontSize: '14px' }}>Нет игр с выбранным статусом</p>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showAddGame && (
          <AddGameModal
            onClose={() => setShowAddGame(false)}
            onSuccess={handleGameAdded}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
