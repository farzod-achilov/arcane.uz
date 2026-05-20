'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Search, Clock, Check, RefreshCw, Truck,
  TrendingDown, X, ChevronDown, Send,
} from 'lucide-react';
import { ADMIN_ORDERS } from '@/lib/admin/mockAdminData';
import { formatPrice } from '@/lib/utils';
import type { OrderStatus } from '@/lib/admin/adminTypes';

const STATUS_CFG: Record<OrderStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  pending:    { label: 'Ожидание',  color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.22)',  icon: Clock        },
  paid:       { label: 'Оплачен',   color: '#06B6D4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.22)',   icon: Check        },
  processing: { label: 'Обработка', color: '#9D60FA', bg: 'rgba(157,96,250,0.08)',  border: 'rgba(157,96,250,0.22)',  icon: RefreshCw    },
  delivered:  { label: 'Доставлен', color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',  border: 'rgba(124,58,237,0.22)',  icon: Truck        },
  completed:  { label: 'Выполнен',  color: '#22C55E', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',    icon: Check        },
  refunded:   { label: 'Возврат',   color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',    icon: TrendingDown },
};

const ALL_STATUSES: OrderStatus[] = ['pending', 'paid', 'processing', 'delivered', 'completed', 'refunded'];

export default function AdminOrdersPage() {
  const [search, setSearch]   = useState('');
  const [tab, setTab]         = useState<OrderStatus | 'all'>('all');
  const [orders, setOrders]   = useState(ADMIN_ORDERS);

  const filtered = useMemo(() => {
    let list = orders;
    if (tab !== 'all') list = list.filter(o => o.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.userName.toLowerCase().includes(q) ||
        o.productTitle.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, tab, search]);

  const updateStatus = (id: string, status: OrderStatus) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));

  const counts = useMemo(() =>
    ALL_STATUSES.reduce((acc, s) => ({
      ...acc,
      [s]: orders.filter(o => o.status === s).length,
    }), {} as Record<OrderStatus, number>),
  [orders]);

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#22C55E', letterSpacing: '0.14em' }}>УПРАВЛЕНИЕ</p>
        <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>Заказы</h1>
        <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>{orders.length} заказов всего</p>
      </motion.div>

      {/* Status Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-5"
      >
        <button
          onClick={() => setTab('all')}
          className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-body transition-all duration-200"
          style={{
            background: tab === 'all' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${tab === 'all' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
            fontSize: '12px',
            color: tab === 'all' ? '#E2E8F0' : '#4B5563',
          }}
        >
          Все <span className="font-pixel" style={{ fontSize: '8px' }}>({orders.length})</span>
        </button>
        {ALL_STATUSES.map(s => {
          const sc = STATUS_CFG[s];
          const cnt = counts[s];
          if (!cnt) return null;
          return (
            <button
              key={s}
              onClick={() => setTab(s)}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-body transition-all duration-200"
              style={{
                background: tab === s ? sc.bg : 'rgba(255,255,255,0.03)',
                border: `1px solid ${tab === s ? sc.border : 'rgba(255,255,255,0.06)'}`,
                fontSize: '12px',
                color: tab === s ? sc.color : '#4B5563',
              }}
            >
              <sc.icon style={{ width: '11px', height: '11px', flexShrink: 0 }} />
              {sc.label} <span className="font-pixel" style={{ fontSize: '8px' }}>({cnt})</span>
            </button>
          );
        })}

        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 ml-auto min-w-52"
             style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Search style={{ width: '13px', height: '13px', color: '#374151', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Поиск заказов..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none text-white font-body flex-1 placeholder:text-[#1F2937]"
            style={{ fontSize: '12px' }}
          />
          {search && <button onClick={() => setSearch('')}><X style={{ width: '12px', height: '12px', color: '#374151' }} /></button>}
        </div>
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['#', 'Продукт', 'Покупатель', 'Платформа', 'Оплата', 'Сумма', 'Монеты', 'Статус', 'Дата', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-body text-[#374151] whitespace-nowrap" style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((order, i) => {
                  const sc = STATUS_CFG[order.status];
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group hover:bg-white/[0.015] transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <td className="px-4 py-3">
                        <span className="font-pixel text-[#4B5563]" style={{ fontSize: '8px' }}>{order.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-8 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            <Image src={order.productImage} alt="" fill unoptimized className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-body text-white line-clamp-1" style={{ fontSize: '12px' }}>{order.productTitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{order.userName}</p>
                          {order.userTelegram && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Send style={{ width: '9px', height: '9px', color: '#06B6D4' }} />
                              <span className="font-body text-[#06B6D4]" style={{ fontSize: '10px' }}>{order.userTelegram}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-pixel rounded px-1.5 py-0.5"
                              style={{ fontSize: '7px', background: 'rgba(124,58,237,0.08)', color: '#9D60FA', border: '1px solid rgba(124,58,237,0.18)' }}>
                          {order.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-body text-[#6B7280]" style={{ fontSize: '12px' }}>{order.paymentMethod}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>
                          {formatPrice(order.price)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {order.coinsEarned > 0 ? (
                          <span className="font-body text-[#F59E0B]" style={{ fontSize: '11px' }}>+{order.coinsEarned}</span>
                        ) : (
                          <span className="font-body text-[#1F2937]" style={{ fontSize: '11px' }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative group/status">
                          <div className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 cursor-pointer"
                               style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
                            <sc.icon style={{ width: '9px', height: '9px', color: sc.color }} />
                            <span className="font-body" style={{ fontSize: '10.5px', color: sc.color }}>{sc.label}</span>
                            <ChevronDown style={{ width: '9px', height: '9px', color: sc.color }} />
                          </div>
                          {/* Status dropdown */}
                          <div
                            className="absolute top-full left-0 mt-1 w-36 rounded-xl overflow-hidden z-10 opacity-0 pointer-events-none group-hover/status:opacity-100 group-hover/status:pointer-events-auto transition-opacity"
                            style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                          >
                            {ALL_STATUSES.map(s => {
                              const cfg = STATUS_CFG[s];
                              return (
                                <button
                                  key={s}
                                  onClick={() => updateStatus(order.id, s)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors"
                                  style={{ color: s === order.status ? cfg.color : '#6B7280', fontSize: '12px' }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${cfg.color}08`; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                >
                                  <cfg.icon style={{ width: '10px', height: '10px', color: cfg.color }} />
                                  <span className="font-body">{cfg.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-body text-[#374151] whitespace-nowrap" style={{ fontSize: '11px' }}>{order.createdAt}</p>
                      </td>
                      <td className="px-4 py-3">
                        {order.deliveryType === 'steam_gift' && order.status === 'paid' && (
                          <button
                            className="font-body text-[#66C0F4] hover:text-[#7DD3FC] transition-colors whitespace-nowrap"
                            style={{ fontSize: '11px' }}
                          >
                            Send Gift →
                          </button>
                        )}
                        {order.deliveryType === 'telegram_activation' && order.status === 'paid' && (
                          <a
                            href={`https://t.me/${order.userTelegram?.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-body text-[#06B6D4] hover:text-[#22D3EE] transition-colors whitespace-nowrap"
                            style={{ fontSize: '11px' }}
                          >
                            <Send style={{ width: '10px', height: '10px' }} />
                            Открыть TG
                          </a>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-body text-[#374151]" style={{ fontSize: '14px' }}>Заказы не найдены</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
