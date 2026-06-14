'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, KeyRound, Upload, List, ArrowLeftRight,
  BarChart2, Package, ShoppingBag, Zap, Ban,
  CheckCircle2, Archive, Settings, User, RefreshCw,
} from 'lucide-react';
import StockHealthBadge   from '@/components/admin/keys/StockHealthBadge';
import ImportModal        from '@/components/admin/keys/ImportModal';
import AddKeyModal        from '@/components/admin/keys/AddKeyModal';
import MoveModal          from '@/components/admin/keys/MoveModal';
import KeysTable          from '@/components/admin/keys/KeysTable';
import type { ImportResult, GameStockInfo, GameKeyRecord } from '@/lib/admin/adminKeysTypes';

/* ── Types from API ─────────────────────────────────────────── */
interface TxRow {
  id: string; type: string; note: string | null; createdAt: string;
  users: { username: string } | null;
}
interface ApiResponse {
  game: {
    id: string; title: string; cover: string | null;
    isActive: boolean; stockStore: number; stockDrop: number; lowStockThreshold: number;
  };
  keys: { id: string; status: string; type: string; createdAt: string; usedAt: string | null; deliveredAt: string | null }[];
  txs:  TxRow[];
  stats:       { available: number; sold: number; disabled: number; reserved: number };
  stockByType: { STORE: number; DROP: number; BOTH: number };
}

/* ── StatPill ───────────────────────────────────────────────── */
function StatPill({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{label}</span>
      <span className="font-heading font-bold ml-auto" style={{ fontSize: '13px', color }}>{value}</span>
    </div>
  );
}

const TX_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  IMPORT:        { label: 'Импорт',    color: '#22C55E', icon: Upload        },
  BULK_IMPORT:   { label: 'Булк',      color: '#22C55E', icon: Upload        },
  PURCHASE:      { label: 'Покупка',   color: '#7C3AED', icon: ShoppingBag   },
  DROP_REWARD:   { label: 'Дроп',      color: '#F59E0B', icon: Zap           },
  MANUAL_ASSIGN: { label: 'Ручная',    color: '#06B6D4', icon: User          },
  DISABLE:       { label: 'Отключён',  color: '#EF4444', icon: Ban           },
  MOVE:          { label: 'Перемещён', color: '#9D60FA', icon: ArrowLeftRight },
};

type TabId = 'overview' | 'import' | 'keys' | 'move' | 'settings';

/* ── Page ───────────────────────────────────────────────────── */
export default function GameKeyManagerPage({ params }: { params: { gameId: string } }) {
  const [data,         setData]         = useState<ApiResponse | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState<TabId>('overview');
  const [showImport,   setShowImport]   = useState(false);
  const [showAddKey,   setShowAddKey]   = useState(false);
  const [showMove,     setShowMove]     = useState(false);
  const [lowThreshold, setLowThreshold] = useState('5');
  const [autoDisable,  setAutoDisable]  = useState(true);
  const [lastImport,   setLastImport]   = useState<ImportResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/keys/${params.gameId}`);
      if (!res.ok) return;
      const json: ApiResponse = await res.json();
      setData(json);
      setLowThreshold(String(json.game.lowStockThreshold));
    } finally { setLoading(false); }
  }, [params.gameId]);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center">
          <RefreshCw style={{ width: '20px', height: '20px', color: '#374151', margin: '0 auto 8px', animation: 'spin 1s linear infinite' }} />
          <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  const { game, keys: rawKeys, txs, stats, stockByType } = data;

  const totalAvail = stats.available;
  const health: GameStockInfo['health'] =
    totalAvail === 0                                           ? 'EMPTY'    :
    totalAvail <= Math.floor(game.lowStockThreshold * 0.5)   ? 'CRITICAL' :
    totalAvail <= game.lowStockThreshold                      ? 'LOW'      : 'OK';

  /* Convert rawKeys to GameKeyRecord for KeysTable */
  const keysForTable: GameKeyRecord[] = rawKeys.map(k => ({
    id:             k.id,
    gameId:         game.id,
    type:           k.type as 'STORE' | 'DROP' | 'BOTH',
    status:         k.status as GameKeyRecord['status'],
    reservedFor:    null,
    soldToUserId:   null,
    soldToUsername: null,
    deliveredAt:    k.deliveredAt ?? null,
    createdAt:      k.createdAt,
  }));

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'Обзор',      icon: BarChart2                                              },
    { id: 'import',   label: 'Импорт',     icon: Upload                                                 },
    { id: 'keys',     label: 'Ключи',      icon: List,          badge: stats.available                  },
    { id: 'move',     label: 'Перемест.',  icon: ArrowLeftRight                                         },
    { id: 'settings', label: 'Настройки',  icon: Settings,      badge: health === 'EMPTY' ? 1 : 0      },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Back */}
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <Link href="/admin/keys"
          className="inline-flex items-center gap-1.5 font-body transition-colors"
          style={{ fontSize: '12px', color: '#4B5563' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#7C3AED')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}>
          <ChevronLeft style={{ width: '14px', height: '14px' }} />
          Key Inventory
        </Link>
      </motion.div>

      {/* Game header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-stretch">
          <div className="relative w-24 flex-shrink-0" style={{ minHeight: '130px' }}>
            {game.cover
              ? <Image src={game.cover} alt={game.title} fill unoptimized className="object-cover" />
              : <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.08)' }}>
                  <Package style={{ width: '20px', height: '20px', color: '#374151' }} />
                </div>
            }
            <div className="absolute inset-0"
                 style={{ background: 'linear-gradient(90deg, transparent 60%, rgba(13,13,26,0.9) 100%)' }} />
          </div>

          <div className="flex-1 p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                  <h1 className="font-heading font-bold text-white" style={{ fontSize: '20px' }}>{game.title}</h1>
                  <StockHealthBadge health={health} />
                  {!game.isActive && (
                    <span className="font-pixel rounded px-1.5 py-0.5"
                      style={{ fontSize: '7px', color: '#6B7280', background: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.2)' }}>
                      ОТКЛЮЧЁН
                    </span>
                  )}
                </div>
                <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
                  ID: <span className="font-pixel text-[#4B5563]" style={{ fontSize: '10px' }}>{game.id}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowAddKey(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-body transition-all"
                  style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', fontSize: '12px', color: '#06B6D4' }}>
                  <KeyRound style={{ width: '12px', height: '12px' }} />
                  Добавить
                </button>
                <button onClick={() => setShowImport(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-body transition-all"
                  style={{ background: 'rgba(124,58,237,0.85)', fontSize: '12px', color: '#fff', boxShadow: '0 0 14px rgba(124,58,237,0.25)' }}>
                  <Upload style={{ width: '12px', height: '12px' }} />
                  Импорт ключей
                </button>
                <button onClick={load}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-body transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12px', color: '#6B7280' }}>
                  <RefreshCw style={{ width: '12px', height: '12px' }} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'STORE',     value: stockByType.STORE, color: '#06B6D4' },
                { label: 'DROP',      value: stockByType.DROP,  color: '#F59E0B' },
                { label: 'BOTH',      value: stockByType.BOTH,  color: '#9D60FA' },
                { label: 'ПРОДАНО',   value: stats.sold,        color: '#7C3AED' },
              ].map(s => (
                <div key={s.label}>
                  <p className="font-pixel mb-0.5" style={{ fontSize: '8px', color: '#374151', letterSpacing: '0.08em' }}>{s.label}</p>
                  <p className="font-heading font-bold" style={{ fontSize: '22px', color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex gap-1.5 overflow-x-auto">
        {tabs.map(t => {
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-body transition-all duration-200 flex-shrink-0"
              style={{
                background: active ? 'rgba(124,58,237,0.12)' : 'transparent',
                border: `1px solid ${active ? 'rgba(124,58,237,0.25)' : 'transparent'}`,
                fontSize: '12px', color: active ? '#C4B5FD' : '#4B5563',
              }}>
              <t.icon style={{ width: '13px', height: '13px' }} />
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="font-pixel rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0"
                  style={{ background: '#EF4444', fontSize: '7px', color: '#fff' }}>
                  {t.badge > 9 ? '9+' : t.badge}
                </span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="rounded-2xl p-5 space-y-2.5"
                   style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-heading font-semibold text-white mb-3" style={{ fontSize: '13px' }}>Запасы</p>
                <StatPill label="STORE ключей"  value={stockByType.STORE} color="#06B6D4" />
                <StatPill label="DROP ключей"   value={stockByType.DROP}  color="#F59E0B" />
                <StatPill label="BOTH ключей"   value={stockByType.BOTH}  color="#9D60FA" />
                <div className="my-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} />
                <StatPill label="Продано"   value={stats.sold}     color="#7C3AED" />
                <StatPill label="Резерв"    value={stats.reserved} color="#F59E0B" />
                <StatPill label="Отключено" value={stats.disabled} color="#4B5563" />
                <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <p className="font-body text-[#374151] mb-1.5" style={{ fontSize: '10px' }}>
                    Запас: {stats.available} / порог {game.lowStockThreshold}
                  </p>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (stats.available / Math.max(game.lowStockThreshold * 3, 1)) * 100)}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      style={{
                        height: '100%', borderRadius: '4px',
                        background: health === 'OK' ? '#22C55E' : health === 'LOW' ? '#F59E0B' : health === 'CRITICAL' ? '#EF4444' : '#4B5563',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* TX history */}
              <div className="lg:col-span-2 rounded-2xl overflow-hidden"
                   style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between px-5 py-4"
                     style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>История транзакций</p>
                  <button onClick={() => setActiveTab('keys')}
                    className="font-body transition-colors"
                    style={{ fontSize: '12px', color: '#7C3AED' }}>
                    Список ключей →
                  </button>
                </div>
                {txs.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Транзакций нет</p>
                  </div>
                ) : txs.map((tx, i) => {
                  const cfg  = TX_CFG[tx.type] ?? TX_CFG.IMPORT;
                  const Icon = cfg.icon;
                  return (
                    <motion.div key={tx.id}
                      initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.015] transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                           style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}20` }}>
                        <Icon style={{ width: '11px', height: '11px', color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-pixel rounded px-1.5 py-0.5"
                            style={{ fontSize: '7px', color: cfg.color, background: `${cfg.color}10`, letterSpacing: '0.04em' }}>
                            {cfg.label.toUpperCase()}
                          </span>
                          <p className="font-body text-[#6B7280] truncate" style={{ fontSize: '11px' }}>{tx.note}</p>
                        </div>
                        {tx.users && (
                          <p className="font-body text-[#374151] mt-0.5" style={{ fontSize: '10px' }}>{tx.users.username}</p>
                        )}
                      </div>
                      <p className="font-body text-[#374151] flex-shrink-0" style={{ fontSize: '10px' }}>
                        {new Date(tx.createdAt).toLocaleDateString('ru', { day: '2-digit', month: '2-digit' })}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* IMPORT */}
          {activeTab === 'import' && (
            <div className="rounded-2xl p-6 space-y-5"
                 style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="font-heading font-semibold text-white mb-1" style={{ fontSize: '14px' }}>Импорт Steam ключей</p>
                <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
                  Вставьте ключи или загрузите .txt файл. Формат:{' '}
                  <span className="font-pixel text-[#6B7280]" style={{ fontSize: '10px' }}>XXXXX-XXXXX-XXXXX</span>
                </p>
              </div>

              {lastImport && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 style={{ width: '14px', height: '14px', color: '#22C55E' }} />
                    <span className="font-heading font-semibold text-[#22C55E]" style={{ fontSize: '13px' }}>Последний импорт</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    {[
                      { l: 'Добавлено', v: lastImport.imported,   c: '#22C55E' },
                      { l: 'Дублей',    v: lastImport.duplicates, c: '#F59E0B' },
                      { l: 'Неверных',  v: lastImport.invalid,    c: '#EF4444' },
                      { l: 'Всего',     v: lastImport.total,      c: '#9CA3AF' },
                    ].map(s => (
                      <div key={s.l}>
                        <p className="font-heading font-bold" style={{ fontSize: '20px', color: s.c }}>{s.v}</p>
                        <p className="font-body text-[#4B5563]" style={{ fontSize: '10px' }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <button onClick={() => setShowImport(true)}
                className="w-full flex items-center justify-center gap-3 py-8 rounded-2xl font-body transition-all duration-200"
                style={{ background: 'rgba(124,58,237,0.05)', border: '2px dashed rgba(124,58,237,0.25)', fontSize: '14px', color: '#9D60FA' }}>
                <Upload style={{ width: '20px', height: '20px' }} />
                Открыть импорт ключей
              </button>
            </div>
          )}

          {/* KEY LIST */}
          {activeTab === 'keys' && (
            <KeysTable keys={keysForTable} onDisable={() => {}} />
          )}

          {/* MOVE */}
          {activeTab === 'move' && (
            <div className="rounded-2xl p-6"
                 style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="font-heading font-semibold text-white mb-1" style={{ fontSize: '14px' }}>Перемещение ключей</p>
              <p className="font-body text-[#4B5563] mb-5" style={{ fontSize: '12px' }}>
                Переместите ключи между пулами без повторного импорта.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'STORE', value: stockByType.STORE, color: '#06B6D4', desc: 'Магазин' },
                  { label: 'BOTH',  value: stockByType.BOTH,  color: '#9D60FA', desc: 'Магазин + Дропы' },
                  { label: 'DROP',  value: stockByType.DROP,  color: '#F59E0B', desc: 'Дропы' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4"
                       style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                    <p className="font-pixel mb-1" style={{ fontSize: '8px', color: s.color, letterSpacing: '0.08em' }}>{s.label}</p>
                    <p className="font-heading font-bold" style={{ fontSize: '28px', color: s.color }}>{s.value}</p>
                    <p className="font-body text-[#374151]" style={{ fontSize: '10px' }}>{s.desc}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowMove(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-body transition-all"
                style={{ background: 'rgba(157,96,250,0.85)', fontSize: '13px', color: '#fff', boxShadow: '0 0 14px rgba(157,96,250,0.2)' }}>
                <ArrowLeftRight style={{ width: '14px', height: '14px' }} />
                Переместить ключи
              </button>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="rounded-2xl p-5"
                   style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-heading font-semibold text-white mb-1" style={{ fontSize: '13px' }}>Порог низкого запаса</p>
                <p className="font-body text-[#4B5563] mb-4" style={{ fontSize: '12px' }}>
                  При достижении этого количества система покажет предупреждение LOW STOCK.
                </p>
                <div className="flex items-center gap-3">
                  <input type="number" value={lowThreshold} onChange={e => setLowThreshold(e.target.value)}
                    min={1} className="w-24 rounded-xl font-heading font-bold outline-none text-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0', fontSize: '18px', padding: '8px' }} />
                  <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>ключей</p>
                  <button
                    onClick={async () => {
                      await fetch(`/api/admin/games/${game.id}`, {
                        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lowStockThreshold: parseInt(lowThreshold) }),
                      });
                    }}
                    className="px-4 py-2 rounded-xl font-body ml-auto transition-all"
                    style={{ background: 'rgba(124,58,237,0.85)', fontSize: '12px', color: '#fff' }}>
                    Сохранить
                  </button>
                </div>
              </div>

              <div className="rounded-2xl p-5"
                   style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-heading font-semibold text-white mb-1" style={{ fontSize: '13px' }}>Авто-отключение</p>
                    <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
                      Деактивировать игру когда все ключи закончились (stock = 0).
                    </p>
                  </div>
                  <button onClick={() => setAutoDisable(!autoDisable)}
                    className="flex-shrink-0 w-11 h-6 rounded-full relative transition-all duration-300"
                    style={{ background: autoDisable ? 'rgba(124,58,237,0.8)' : 'rgba(255,255,255,0.08)' }}>
                    <motion.div animate={{ x: autoDisable ? 20 : 2 }} transition={{ duration: 0.2 }}
                      className="absolute top-1 w-4 h-4 rounded-full"
                      style={{ background: '#fff', boxShadow: autoDisable ? '0 0 6px rgba(124,58,237,0.5)' : 'none' }} />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl p-5"
                   style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <p className="font-heading font-semibold mb-1" style={{ fontSize: '13px', color: '#EF4444' }}>Опасная зона</p>
                <p className="font-body text-[#4B5563] mb-4" style={{ fontSize: '12px' }}>Эти действия необратимы.</p>
                <div className="flex gap-2 flex-wrap">
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-body transition-all"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '12px', color: '#EF4444' }}>
                    <Ban style={{ width: '12px', height: '12px' }} />
                    Отключить все AVAILABLE
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-body transition-all"
                    style={{ background: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.15)', fontSize: '12px', color: '#6B7280' }}>
                    <Archive style={{ width: '12px', height: '12px' }} />
                    Экспорт статистики
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showImport && (
          <ImportModal gameId={game.id} gameTitle={game.title}
            onClose={() => setShowImport(false)}
            onSuccess={r => { setLastImport(r); setShowImport(false); load(); }} />
        )}
        {showAddKey && (
          <AddKeyModal gameId={game.id} gameTitle={game.title}
            onClose={() => setShowAddKey(false)}
            onSuccess={() => { setShowAddKey(false); load(); }} />
        )}
        {showMove && (
          <MoveModal gameId={game.id} gameTitle={game.title}
            stockByType={{ STORE: stockByType.STORE, DROP: stockByType.DROP, BOTH: stockByType.BOTH }}
            onClose={() => setShowMove(false)}
            onSuccess={() => { setShowMove(false); load(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
