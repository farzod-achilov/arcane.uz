'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MessageSquare, Send, CheckCircle2,
  Clock, AlertTriangle, ChevronDown, X,
} from 'lucide-react';
import { ADMIN_TICKETS } from '@/lib/admin/mockAdminData';
import type { TicketStatus, TicketPriority, SupportTicket } from '@/lib/admin/adminTypes';

const STATUS_CFG: Record<TicketStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  open:    { label: 'Открыт',   color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   icon: AlertTriangle },
  pending: { label: 'В работе', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  icon: Clock         },
  resolved:{ label: 'Решён',    color: '#22C55E', bg: 'rgba(34,197,94,0.08)',   icon: CheckCircle2  },
};

const PRIORITY_CFG: Record<TicketPriority, { label: string; color: string; bg: string }> = {
  low:    { label: 'Низкий',   color: '#4B5563', bg: 'rgba(75,85,99,0.08)'     },
  medium: { label: 'Средний',  color: '#F59E0B', bg: 'rgba(245,158,11,0.08)'   },
  high:   { label: 'Высокий',  color: '#EF4444', bg: 'rgba(239,68,68,0.08)'    },
  urgent: { label: 'Срочный',  color: '#F87171', bg: 'rgba(239,68,68,0.12)'    },
};

export default function AdminSupportPage() {
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatus] = useState<TicketStatus | 'all'>('all');
  const [selected, setSelected] = useState<SupportTicket | null>(ADMIN_TICKETS[0]);
  const [tickets, setTickets]   = useState(ADMIN_TICKETS);

  const filtered = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return t.subject.toLowerCase().includes(q) || t.userName.toLowerCase().includes(q);
    }
    return true;
  });

  const updateStatus = (id: string, status: TicketStatus) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  const openCount = tickets.filter(t => t.status === 'open').length;

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex-shrink-0">
        <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#06B6D4', letterSpacing: '0.14em' }}>ПОДДЕРЖКА</p>
        <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>Тикеты</h1>
        <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
          {openCount} открытых из {tickets.length}
        </p>
      </motion.div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: Ticket List */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-3">
          {/* Search + filter */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                 style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Search style={{ width: '13px', height: '13px', color: '#374151' }} />
              <input
                placeholder="Поиск..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent outline-none text-white font-body flex-1 placeholder:text-[#1F2937]"
                style={{ fontSize: '12px' }}
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'open', 'pending', 'resolved'] as const).map(s => {
                const cfg = s !== 'all' ? STATUS_CFG[s] : null;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className="flex-1 rounded-lg py-1.5 font-body transition-all text-center"
                    style={{
                      fontSize: '10.5px',
                      background: statusFilter === s ? (cfg?.bg ?? 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${statusFilter === s ? (cfg?.color ?? 'rgba(255,255,255,0.15)') + '40' : 'rgba(255,255,255,0.06)'}`,
                      color: statusFilter === s ? (cfg?.color ?? '#E2E8F0') : '#4B5563',
                    }}
                  >
                    {s === 'all' ? 'Все' : STATUS_CFG[s].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ticket list */}
          <div className="flex-1 overflow-y-auto space-y-2">
            <AnimatePresence>
              {filtered.map((ticket, i) => {
                const sc = STATUS_CFG[ticket.status];
                const pc = PRIORITY_CFG[ticket.priority];
                const isSelected = selected?.id === ticket.id;
                return (
                  <motion.button
                    key={ticket.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelected(ticket)}
                    className="w-full text-left rounded-xl p-3 transition-all duration-200"
                    style={{
                      background: isSelected ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="font-body text-[#9CA3AF] line-clamp-1 text-left" style={{ fontSize: '12px' }}>
                        {ticket.subject}
                      </p>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
                           style={{ background: sc.color, boxShadow: `0 0 4px ${sc.color}` }} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>{ticket.userName}</p>
                      <div className="flex items-center gap-1">
                        <span className="font-pixel rounded px-1.5 py-0.5"
                              style={{ fontSize: '6px', color: pc.color, background: pc.bg, letterSpacing: '0.06em' }}>
                          {ticket.priority.toUpperCase()}
                        </span>
                        <span className="font-body text-[#1F2937]" style={{ fontSize: '10px' }}>
                          {ticket.createdAt.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                    {ticket.userTelegram && (
                      <div className="flex items-center gap-1 mt-1">
                        <Send style={{ width: '9px', height: '9px', color: '#06B6D4' }} />
                        <span className="font-body text-[#06B6D4]" style={{ fontSize: '10px' }}>{ticket.userTelegram}</span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Ticket Detail */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="flex-1 rounded-2xl overflow-hidden flex flex-col"
              style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {/* Detail Header */}
              <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-pixel text-[#374151]" style={{ fontSize: '8px' }}>{selected.id}</span>
                      <div className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5"
                           style={{ background: STATUS_CFG[selected.status].bg }}>
                        <span className="font-body" style={{ fontSize: '10px', color: STATUS_CFG[selected.status].color }}>
                          {STATUS_CFG[selected.status].label}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1 rounded px-1.5 py-0.5"
                           style={{ background: PRIORITY_CFG[selected.priority].bg }}>
                        <span className="font-pixel" style={{ fontSize: '6.5px', color: PRIORITY_CFG[selected.priority].color, letterSpacing: '0.04em' }}>
                          {selected.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>{selected.subject}</h3>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-[#374151] hover:text-[#9CA3AF] transition-colors flex-shrink-0">
                    <X style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>

              {/* User info */}
              <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <p className="font-body text-[#374151] mb-0.5" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Пользователь</p>
                    <p className="font-body text-[#9CA3AF]" style={{ fontSize: '13px' }}>{selected.userName}</p>
                    <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>{selected.userEmail}</p>
                  </div>
                  {selected.userTelegram && (
                    <div>
                      <p className="font-body text-[#374151] mb-0.5" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Telegram</p>
                      <a href={`https://t.me/${selected.userTelegram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-1.5 font-body text-[#06B6D4] hover:text-[#22D3EE] transition-colors"
                         style={{ fontSize: '13px' }}>
                        <Send style={{ width: '12px', height: '12px' }} />
                        {selected.userTelegram}
                      </a>
                    </div>
                  )}
                  {selected.orderNumber && (
                    <div>
                      <p className="font-body text-[#374151] mb-0.5" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Заказ</p>
                      <span className="font-pixel text-[#9D60FA]" style={{ fontSize: '9px' }}>{selected.orderNumber}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-body text-[#374151] mb-0.5" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Создан</p>
                    <span className="font-body text-[#6B7280]" style={{ fontSize: '12px' }}>{selected.createdAt}</span>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="flex-1 px-5 py-5 overflow-y-auto">
                <div className="rounded-2xl p-4 mb-4"
                     style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare style={{ width: '13px', height: '13px', color: '#374151' }} />
                    <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>Сообщение от клиента</span>
                  </div>
                  <p className="font-body text-[#9CA3AF] leading-relaxed" style={{ fontSize: '13.5px', lineHeight: '1.65' }}>
                    {selected.message}
                  </p>
                </div>
              </div>

              {/* Actions footer */}
              <div className="px-5 py-4 flex-shrink-0 flex items-center gap-3 flex-wrap"
                   style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="font-body text-[#374151] mr-2" style={{ fontSize: '12px' }}>Статус:</p>
                {(['open', 'pending', 'resolved'] as TicketStatus[]).map(s => {
                  const sc = STATUS_CFG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-body transition-all duration-200"
                      style={{
                        background: selected.status === s ? sc.bg : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selected.status === s ? sc.color + '40' : 'rgba(255,255,255,0.07)'}`,
                        fontSize: '12px',
                        color: selected.status === s ? sc.color : '#4B5563',
                      }}
                    >
                      <sc.icon style={{ width: '11px', height: '11px' }} />
                      {sc.label}
                    </button>
                  );
                })}

                {selected.userTelegram && (
                  <a
                    href={`https://t.me/${selected.userTelegram.replace('@','')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl px-3.5 py-2 font-heading font-semibold text-white transition-all ml-auto"
                    style={{
                      background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
                      fontSize: '12px',
                      boxShadow: '0 0 14px rgba(6,182,212,0.3)',
                    }}
                  >
                    <Send style={{ width: '12px', height: '12px' }} />
                    Ответить в Telegram
                  </a>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center rounded-2xl"
              style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="text-center">
                <MessageSquare className="mx-auto mb-3 text-[#1F2937]" style={{ width: '32px', height: '32px' }} />
                <p className="font-body text-[#374151]" style={{ fontSize: '14px' }}>Выберите тикет</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
