'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Send, Crown, Zap, ShoppingBag, X,
  RefreshCw, Shield, Ban, Users,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface AdminUser {
  id:          string;
  email:       string;
  username:    string;
  avatar:      string | null;
  arcCoins:    number;
  level:       number;
  totalSpent:  number;
  isAdmin:     boolean;
  isBanned:    boolean;
  createdAt:   string;
  lastLoginAt: string | null;
  _count:      { orders: number; wishlists: number };
}

const LEVEL_COLORS: Record<number, string> = {
  1: '#9CA3AF',
  2: '#3B82F6',
  3: '#7C3AED',
  4: '#06B6D4',
  5: '#F59E0B',
};
function levelColor(l: number) { return LEVEL_COLORS[Math.min(l, 5)] ?? '#F59E0B'; }
function levelLabel(l: number) {
  if (l <= 1) return 'Rookie';
  if (l <= 2) return 'Player';
  if (l <= 3) return 'Elite';
  if (l <= 4) return 'Phantom';
  return 'Arcane';
}

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState<AdminUser[]>([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [totalCoins, setTotalCoins] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs  = new URLSearchParams({ page: String(page), ...(search.trim() ? { q: search } : {}) });
      const res = await fetch(`/api/admin/users?${qs}`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setTotalCoins(data.totalCoins ?? 0);
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const withTelegram = 0; // would need telegram_users join — skip for now

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#F59E0B', letterSpacing: '0.14em' }}>УПРАВЛЕНИЕ</p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>Пользователи</h1>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
              {loading ? 'Загрузка...' : `${total} зарегистрированных`}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl px-4 py-2 font-heading font-semibold text-sm transition-all disabled:opacity-50"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}
          >
            <RefreshCw style={{ width: '13px', height: '13px' }} className={loading ? 'animate-spin' : ''} />
            Обновить
          </button>
        </div>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Всего',           value: total,                          color: '#7C3AED', icon: Users     },
          { label: 'С Telegram',      value: withTelegram,                   color: '#06B6D4', icon: Send      },
          { label: 'Монеты (сумма)',  value: totalCoins.toLocaleString('ru'), color: '#F59E0B', icon: Zap, isStr: true },
          { label: 'Страница',        value: `${page}/${pages}`,             color: '#22C55E', icon: Crown, isStr: true },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-4"
            style={{ background: '#0D0D1A', border: `1px solid ${s.color}18` }}
          >
            <s.icon style={{ width: '14px', height: '14px', color: s.color, marginBottom: '8px' }} />
            <p className="font-pixel mb-0.5" style={{ fontSize: '15px', color: s.color }}>
              {s.isStr ? s.value : Number(s.value).toLocaleString('ru')}
            </p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
             style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)', maxWidth: '400px' }}>
          <Search style={{ width: '13px', height: '13px', color: '#374151', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Поиск по имени или email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent outline-none text-white font-body flex-1 placeholder:text-[#1F2937]"
            style={{ fontSize: '12px' }}
          />
          {search && <button onClick={() => setSearch('')}><X style={{ width: '12px', height: '12px', color: '#374151' }} /></button>}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['Пользователь', 'Уровень', 'Монеты', 'Заказы', 'Потрачено', 'Вишлист', 'Последний вход', 'Флаги'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-body text-[#374151] whitespace-nowrap"
                      style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <RefreshCw style={{ width: '16px', height: '16px', color: '#374151', margin: '0 auto 8px', animation: 'spin 1s linear infinite' }} />
                    <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Загрузка...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Пользователи не найдены</p>
                  </td>
                </tr>
              ) : users.map((user, i) => {
                const lc = levelColor(user.level);
                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-white/[0.015] transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-heading font-bold text-white"
                          style={{ background: `${lc}20`, border: `1.5px solid ${lc}40`, fontSize: '12px' }}
                        >
                          {user.username[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-body text-white"    style={{ fontSize: '13px' }}>{user.username}</p>
                          <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Level */}
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1"
                           style={{ background: `${lc}12`, border: `1px solid ${lc}25` }}>
                        <Crown style={{ width: '9px', height: '9px', color: lc }} />
                        <span className="font-pixel" style={{ fontSize: '7.5px', color: lc, letterSpacing: '0.04em' }}>
                          {levelLabel(user.level).toUpperCase()} {user.level}
                        </span>
                      </div>
                    </td>

                    {/* Coins */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Zap style={{ width: '11px', height: '11px', color: '#F59E0B' }} />
                        <span className="font-heading font-semibold text-[#FCD34D]" style={{ fontSize: '12px' }}>
                          {user.arcCoins.toLocaleString('ru')}
                        </span>
                      </div>
                    </td>

                    {/* Orders */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <ShoppingBag style={{ width: '11px', height: '11px', color: '#7C3AED' }} />
                        <span className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>
                          {user._count.orders}
                        </span>
                      </div>
                    </td>

                    {/* Spent */}
                    <td className="px-4 py-3">
                      <span className="font-heading font-semibold text-[#22C55E]" style={{ fontSize: '12px' }}>
                        {user.totalSpent > 0 ? formatPrice(user.totalSpent) : '—'}
                      </span>
                    </td>

                    {/* Wishlist */}
                    <td className="px-4 py-3">
                      <span className="font-body text-[#6B7280]" style={{ fontSize: '12px' }}>
                        {user._count.wishlists}
                      </span>
                    </td>

                    {/* Last login */}
                    <td className="px-4 py-3">
                      <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
                          : '—'}
                      </span>
                    </td>

                    {/* Flags */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {user.isAdmin && (
                          <span className="font-pixel rounded px-1.5 py-0.5 flex items-center gap-1"
                                style={{ fontSize: '7px', color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <Shield style={{ width: '8px', height: '8px' }} />
                            ADMIN
                          </span>
                        )}
                        {user.isBanned && (
                          <span className="font-pixel rounded px-1.5 py-0.5 flex items-center gap-1"
                                style={{ fontSize: '7px', color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <Ban style={{ width: '8px', height: '8px' }} />
                            БАН
                          </span>
                        )}
                        {!user.isAdmin && !user.isBanned && (
                          <span className="font-body text-[#1F2937]" style={{ fontSize: '11px' }}>—</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5"
               style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
              Страница {page} из {pages} · {total} пользователей
            </p>
            <div className="flex items-center gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg font-body text-[#4B5563] disabled:opacity-30 hover:text-white transition-colors"
                style={{ fontSize: '12px', background: 'rgba(255,255,255,0.04)' }}>
                ← Назад
              </button>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg font-body text-[#4B5563] disabled:opacity-30 hover:text-white transition-colors"
                style={{ fontSize: '12px', background: 'rgba(255,255,255,0.04)' }}>
                Вперёд →
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
