'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  KeyRound, Package, TrendingUp, AlertTriangle,
  ChevronRight, ShoppingBag, Archive,
  BarChart2, RefreshCw, ExternalLink, FileSpreadsheet, Search, X,
} from 'lucide-react';
import StockHealthBadge from '@/components/admin/keys/StockHealthBadge';
import type { GameStockInfo } from '@/lib/admin/adminKeysTypes';

/* ── DB game → GameStockInfo ────────────────────────────────── */
interface DbGame {
  id: string; title: string; slug: string; cover: string | null;
  isActive: boolean; stockStore: number; stockDrop: number;
  deliveryType: 'AUTO' | 'MANUAL' | 'DROPSHIP';
  _count: { game_keys: number; order_items: number };
}

function toStockInfo(g: DbGame): GameStockInfo {
  const total     = g.stockStore + g.stockDrop;
  const threshold = 5;
  // DROPSHIP games with zero stock aren't a real problem — dropshipDeliver()
  // falls back to buying from the supplier at order time — so 0 stays 'OK'
  // there instead of a false "Нет ключей" alert. Any stock they DO carry
  // (an admin can add keys manually, e.g. a cheaper deal found elsewhere;
  // dropshipDeliver() now prefers that over paying the supplier again)
  // still follows the normal LOW/CRITICAL thresholds, since that's real,
  // depletable inventory once it exists.
  const health: GameStockInfo['health'] =
    total === 0
      ? (g.deliveryType === 'DROPSHIP' ? 'OK' : 'EMPTY')
      : total <= Math.floor(threshold * 0.5) ? 'CRITICAL'
      : total <= threshold                    ? 'LOW'
      :                                          'OK';

  return {
    gameId:            g.id,
    title:             g.title,
    cover:             g.cover,
    stockStore:        g.stockStore,
    stockDrop:         g.stockDrop,
    stockBoth:         0,
    sold:              g._count.order_items,
    disabled:          0,
    reserved:          0,
    lowStockThreshold: threshold,
    isActive:          g.isActive,
    health,
    lastDeliveredAt:   null,
  };
}

/* ── Mini stock bar ─────────────────────────────────────────── */
function StockBar({ store, drop, total }: { store: number; drop: number; total: number }) {
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
    </div>
  );
}

/* ── Game card ──────────────────────────────────────────────── */
function GameStockCard({ game, index }: { game: GameStockInfo; index: number }) {
  const totalAvail = game.stockStore + game.stockDrop;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.04, duration: 0.3 }}
      whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}
    >
      <Link href={`/admin/keys/${game.gameId}`}>
        <div
          className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 group"
          style={{
            background: '#0D0D1A',
            border: `1px solid ${
              game.health === 'EMPTY'    ? 'rgba(107,114,128,0.15)' :
              game.health === 'CRITICAL' ? 'rgba(239,68,68,0.18)'   :
                                          'rgba(255,255,255,0.06)'
            }`,
          }}
        >
          <div className="relative h-28 overflow-hidden">
            {game.cover ? (
              <Image src={game.cover} alt={game.title} fill unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                   style={{ background: 'rgba(124,58,237,0.08)' }}>
                <Package style={{ width: '28px', height: '28px', color: '#374151' }} />
              </div>
            )}
            <div className="absolute inset-0"
                 style={{ background: 'linear-gradient(to bottom, rgba(13,13,26,0) 40%, rgba(13,13,26,0.95) 100%)' }} />
            <div className="absolute top-2.5 right-2.5">
              <StockHealthBadge health={game.health} size="sm" />
            </div>
            {!game.isActive && (
              <div className="absolute top-2.5 left-2.5 rounded-md px-1.5 py-0.5 font-pixel"
                   style={{ background: 'rgba(0,0,0,0.7)', fontSize: '7px', color: '#6B7280',
                            letterSpacing: '0.06em', border: '1px solid rgba(255,255,255,0.08)' }}>
                ОТКЛЮЧЁН
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="font-heading font-semibold text-white line-clamp-1 flex-1" style={{ fontSize: '13px' }}>
                {game.title}
              </p>
              <ChevronRight style={{ width: '14px', height: '14px', color: '#374151', flexShrink: 0 }}
                className="group-hover:text-[#7C3AED] transition-colors mt-0.5" />
            </div>

            <StockBar store={game.stockStore} drop={game.stockDrop} total={totalAvail} />

            <div className="flex gap-3 mt-2.5">
              {[
                { label: 'STORE', value: game.stockStore, color: '#06B6D4' },
                { label: 'DROP',  value: game.stockDrop,  color: '#F59E0B' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="font-pixel" style={{ fontSize: '8px', color: '#4B5563', letterSpacing: '0.04em' }}>{s.label}</span>
                  <span className="font-heading font-bold" style={{ fontSize: '12px', color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3"
                 style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-1">
                <ShoppingBag style={{ width: '10px', height: '10px', color: '#374151' }} />
                <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
                  {game.sold} продано
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Alert banner ───────────────────────────────────────────── */
function AlertBanner({ games, type }: { games: GameStockInfo[]; type: 'LOW' | 'CRITICAL' | 'EMPTY' }) {
  if (games.length === 0) return null;
  const cfg = {
    LOW:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.07)',  border: 'rgba(245,158,11,0.2)',  icon: AlertTriangle, text: 'Низкий запас' },
    CRITICAL: { color: '#EF4444', bg: 'rgba(239,68,68,0.07)',   border: 'rgba(239,68,68,0.2)',   icon: AlertTriangle, text: 'Критический запас' },
    EMPTY:    { color: '#6B7280', bg: 'rgba(107,114,128,0.07)', border: 'rgba(107,114,128,0.2)', icon: Archive,       text: 'Нет ключей' },
  }[type];
  const Icon = cfg.icon;
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
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

/* ── Page ───────────────────────────────────────────────────── */
export default function KeysAdminPage() {
  const [filter,  setFilter]  = useState<'ALL' | 'OK' | 'LOW' | 'CRITICAL' | 'EMPTY'>('ALL');
  const [search,  setSearch]  = useState('');
  const [games,   setGames]   = useState<GameStockInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/games?limit=200');
      const data = await res.json();
      if (data.games?.length) {
        // DROPSHIP games are included (searchable, addable-to) — an admin
        // can manually stock a cheaper key found elsewhere and
        // dropshipDeliver() now prefers it over paying the supplier again.
        // toStockInfo() keeps their 0-stock state out of the EMPTY alert,
        // since dropshipDeliver() still falls back to the supplier fine.
        setGames((data.games as DbGame[]).map(toStockInfo));
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalAvailable = games.reduce((s, g) => s + g.stockStore + g.stockDrop, 0);
  const totalSold      = games.reduce((s, g) => s + g.sold, 0);
  const alertCount     = games.filter(g => g.health === 'CRITICAL' || g.health === 'EMPTY').length;

  const emptyGames    = games.filter(g => g.health === 'EMPTY');
  const criticalGames = games.filter(g => g.health === 'CRITICAL');
  const lowGames      = games.filter(g => g.health === 'LOW');

  const bySearch = search.trim()
    ? games.filter(g => g.title.toLowerCase().includes(search.trim().toLowerCase()))
    : games;
  const filtered = filter === 'ALL' ? bySearch : bySearch.filter(g => g.health === filter);

  const topStats = [
    { title: 'Доступно',  value: totalAvailable, icon: KeyRound,      color: '#22C55E', desc: 'активных ключей'   },
    { title: 'Продано',   value: totalSold,       icon: ShoppingBag,   color: '#7C3AED', desc: 'за всё время'      },
    { title: 'Игр всего', value: games.length,    icon: TrendingUp,    color: '#06B6D4', desc: 'в системе'         },
    { title: 'Алерты',    value: alertCount,      icon: AlertTriangle, color: '#EF4444', desc: 'требуют внимания'  },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#7C3AED', letterSpacing: '0.14em' }}>KEY INVENTORY</p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-white" style={{ fontSize: '24px' }}>Управление ключами</h1>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '13px' }}>
              {loading ? 'Загрузка из базы данных...' : `${games.length} игр · ${totalAvailable} доступных ключей`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-body transition-all disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12px', color: '#6B7280' }}
            >
              <RefreshCw style={{ width: '13px', height: '13px' }} className={loading ? 'animate-spin' : ''} />
              Обновить
            </button>
            <Link
              href="/admin/keys/bulk-import"
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-body transition-all"
              style={{ background: 'rgba(34,197,94,0.1)', fontSize: '12px', color: '#22C55E', border: '1px solid rgba(34,197,94,0.22)' }}
            >
              <FileSpreadsheet style={{ width: '13px', height: '13px' }} />
              CSV Импорт
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-body transition-all"
              style={{ background: 'rgba(124,58,237,0.9)', fontSize: '12px', color: '#fff', boxShadow: '0 0 16px rgba(124,58,237,0.28)' }}
            >
              <BarChart2 style={{ width: '13px', height: '13px' }} />
              Продукты
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topStats.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -3 }}
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: '#0D0D1A', border: `1px solid ${s.color}18` }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
                 style={{ background: `radial-gradient(circle at top right, ${s.color}0E, transparent 70%)` }} />
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                 style={{ background: `${s.color}12`, border: `1px solid ${s.color}22` }}>
              <s.icon style={{ width: '15px', height: '15px', color: s.color }} />
            </div>
            <p className="font-pixel text-white mb-0.5" style={{ fontSize: '22px' }}>
              {s.value.toLocaleString('ru')}
            </p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{s.title}</p>
            <p className="font-body text-[#374151]" style={{ fontSize: '10px', marginTop: '2px' }}>{s.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        <AlertBanner games={emptyGames}    type="EMPTY"    />
        <AlertBanner games={criticalGames} type="CRITICAL" />
        <AlertBanner games={lowGames}      type="LOW"      />
      </div>

      {/* Search */}
      <div className="relative">
        <Search style={{ width: '14px', height: '14px', color: '#374151', position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Найти игру по названию…"
          className="w-full rounded-xl pl-9 pr-9 py-2.5 font-body text-white text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        {search && (
          <button onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#374151' }}>
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        )}
      </div>

      {/* Filter */}
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
                  fontSize: '9px', color: active ? c : '#374151', letterSpacing: '0.06em',
                }}>
                {f === 'ALL' ? 'ВСЕ' : f}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4">
          {[{ label: 'STORE', color: '#06B6D4' }, { label: 'DROP', color: '#F59E0B' }].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
              <span className="font-pixel text-[#374151]" style={{ fontSize: '8px' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Game grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw style={{ width: '24px', height: '24px', color: '#374151', margin: '0 auto 8px', animation: 'spin 1s linear infinite' }} />
            <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Загрузка игр...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((game, i) => (
            <GameStockCard key={game.gameId} game={game} index={i} />
          ))}

          {filtered.length === 0 && filter === 'ALL' && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                   style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)' }}>
                <KeyRound style={{ width: '28px', height: '28px', color: '#374151' }} />
              </div>
              <div className="text-center">
                <p className="font-heading font-semibold text-white mb-1" style={{ fontSize: '15px' }}>Нет активных продуктов</p>
                <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>Сначала добавьте игры в раздел «Продукты»</p>
              </div>
              <Link href="/admin/products"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: '13px', boxShadow: '0 0 16px rgba(124,58,237,0.3)' }}>
                <ExternalLink style={{ width: '13px', height: '13px' }} />
                Перейти к продуктам
              </Link>
            </div>
          )}

          {filtered.length === 0 && filter !== 'ALL' && (
            <div className="col-span-full text-center py-16">
              <KeyRound style={{ width: '32px', height: '32px', color: '#1F2937', margin: '0 auto 12px' }} />
              <p className="font-body text-[#374151]" style={{ fontSize: '14px' }}>Нет игр с выбранным статусом</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
