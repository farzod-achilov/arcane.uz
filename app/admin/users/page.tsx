'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Search, Send, Gamepad2, Crown, Zap, ShoppingBag, X } from 'lucide-react';
import { ADMIN_USERS } from '@/lib/admin/mockAdminData';
import { formatPrice } from '@/lib/utils';
import type { UserLevel } from '@/lib/admin/adminTypes';

const LEVEL_CFG: Record<UserLevel, { color: string; bg: string; border: string }> = {
  Rookie:  { color: '#9CA3AF', bg: 'rgba(156,163,175,0.08)', border: 'rgba(156,163,175,0.2)'  },
  Player:  { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)'   },
  Elite:   { color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',  border: 'rgba(124,58,237,0.2)'   },
  Phantom: { color: '#06B6D4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.2)'    },
  Arcane:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)'  },
};

export default function AdminUsersPage() {
  const [search, setSearch]     = useState('');
  const [levelFilter, setLevel] = useState<UserLevel | 'all'>('all');

  const filtered = useMemo(() => {
    let list = ADMIN_USERS;
    if (levelFilter !== 'all') list = list.filter(u => u.level === levelFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.telegram?.toLowerCase().includes(q) || false
      );
    }
    return list;
  }, [search, levelFilter]);

  const totalUsers = ADMIN_USERS.length;
  const withTelegram = ADMIN_USERS.filter(u => u.telegram).length;
  const withSteam    = ADMIN_USERS.filter(u => u.steamUsername).length;
  const totalCoins   = ADMIN_USERS.reduce((s, u) => s + u.coins, 0);

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#F59E0B', letterSpacing: '0.14em' }}>УПРАВЛЕНИЕ</p>
        <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>Пользователи</h1>
        <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>{totalUsers} зарегистрированных</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Всего',             value: totalUsers,                     color: '#7C3AED', icon: Crown       },
          { label: 'С Telegram',        value: withTelegram,                   color: '#06B6D4', icon: Send        },
          { label: 'С Steam',           value: withSteam,                      color: '#66C0F4', icon: Gamepad2    },
          { label: 'Coins в обороте',   value: totalCoins.toLocaleString('ru'), color: '#F59E0B', icon: Zap, isStr: true },
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
            <p className="font-pixel text-white mb-0.5" style={{ fontSize: '15px', color: s.color }}>
              {s.isStr ? s.value : s.value}
            </p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-3 mb-5"
      >
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 flex-1 min-w-48"
             style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Search style={{ width: '13px', height: '13px', color: '#374151', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Поиск пользователей..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none text-white font-body flex-1 placeholder:text-[#1F2937]"
            style={{ fontSize: '12px' }}
          />
          {search && <button onClick={() => setSearch('')}><X style={{ width: '12px', height: '12px', color: '#374151' }} /></button>}
        </div>

        {/* Level filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'Rookie', 'Player', 'Elite', 'Phantom', 'Arcane'] as const).map(l => {
            const cfg = l !== 'all' ? LEVEL_CFG[l] : null;
            return (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className="font-body rounded-lg px-3 py-1.5 transition-all duration-200"
                style={{
                  fontSize: '12px',
                  background: levelFilter === l ? (cfg?.bg ?? 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${levelFilter === l ? (cfg?.border ?? 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.06)'}`,
                  color: levelFilter === l ? (cfg?.color ?? '#E2E8F0') : '#4B5563',
                }}
              >
                {l === 'all' ? 'Все уровни' : l}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['Пользователь', 'Уровень', 'Монеты', 'Заказы', 'Потрачено', 'Telegram', 'Steam', 'Последний вход'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-body text-[#374151] whitespace-nowrap" style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => {
                const lc = LEVEL_CFG[user.level];
                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-white/[0.015] transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-xl overflow-hidden flex-shrink-0"
                             style={{ border: `1.5px solid ${lc.color}40` }}>
                          <Image src={user.avatar} alt="" fill unoptimized className="object-cover" />
                        </div>
                        <div>
                          <p className="font-body text-white" style={{ fontSize: '13px' }}>{user.name}</p>
                          <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1"
                           style={{ background: lc.bg, border: `1px solid ${lc.border}` }}>
                        <Crown style={{ width: '9px', height: '9px', color: lc.color }} />
                        <span className="font-pixel" style={{ fontSize: '7.5px', color: lc.color, letterSpacing: '0.04em' }}>
                          {user.level.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Zap style={{ width: '11px', height: '11px', color: '#F59E0B' }} />
                        <span className="font-heading font-semibold text-[#FCD34D]" style={{ fontSize: '12px' }}>
                          {user.coins.toLocaleString('ru')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <ShoppingBag style={{ width: '11px', height: '11px', color: '#7C3AED' }} />
                        <span className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{user.totalOrders}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-heading font-semibold text-[#22C55E]" style={{ fontSize: '12px' }}>
                        {(user.totalSpent / 1000000).toFixed(1)}M
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.telegram ? (
                        <a href={`https://t.me/${user.telegram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-1 transition-colors"
                           style={{ color: '#06B6D4', fontSize: '11.5px' }}>
                          <Send style={{ width: '10px', height: '10px' }} />
                          {user.telegram}
                        </a>
                      ) : (
                        <span className="font-body text-[#1F2937]" style={{ fontSize: '11px' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.steamUsername ? (
                        <div className="flex items-center gap-1">
                          <Gamepad2 style={{ width: '11px', height: '11px', color: '#66C0F4' }} />
                          <span className="font-body text-[#66C0F4]" style={{ fontSize: '11.5px' }}>{user.steamUsername}</span>
                        </div>
                      ) : (
                        <span className="font-body text-[#1F2937]" style={{ fontSize: '11px' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>{user.lastActive}</span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
