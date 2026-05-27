'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MessageSquare, Send, CheckCircle2,
  Clock, AlertTriangle, X, RefreshCw, Loader2, Shield,
} from 'lucide-react';

type TicketStatus   = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface TicketMessage {
  id:        string;
  isAdmin:   boolean;
  body:      string;
  createdAt: string;
  author:    { username: string };
}

interface Ticket {
  id:        string;
  subject:   string;
  category:  string;
  status:    TicketStatus;
  priority:  TicketPriority;
  createdAt: string;
  user:      { id: string; username: string; email: string };
  messages:  TicketMessage[];
}

const STATUS_CFG: Record<TicketStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  OPEN:        { label: 'Открыт',   color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   icon: AlertTriangle },
  IN_PROGRESS: { label: 'В работе', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  icon: Clock         },
  RESOLVED:    { label: 'Решён',    color: '#22C55E', bg: 'rgba(34,197,94,0.08)',   icon: CheckCircle2  },
};

const PRIORITY_CFG: Record<TicketPriority, { label: string; color: string; bg: string }> = {
  LOW:    { label: 'Низкий',  color: '#4B5563', bg: 'rgba(75,85,99,0.08)'    },
  MEDIUM: { label: 'Средний', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  HIGH:   { label: 'Высокий', color: '#EF4444', bg: 'rgba(239,68,68,0.08)'  },
  URGENT: { label: 'Срочный', color: '#F87171', bg: 'rgba(239,68,68,0.12)'  },
};

const CATEGORY_LABELS: Record<string, string> = {
  activation: 'Активация',
  payment:    'Оплата',
  delivery:   'Доставка',
  refund:     'Возврат',
  coins:      'Монеты',
  other:      'Другое',
};

export default function AdminSupportPage() {
  const [tickets,      setTickets]      = useState<Ticket[]>([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [selected,     setSelected]     = useState<Ticket | null>(null);
  const [replyText,    setReplyText]    = useState('');
  const [sending,      setSending]      = useState(false);
  const [updating,     setUpdating]     = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs  = new URLSearchParams({ status: statusFilter, ...(search.trim() ? { q: search } : {}) });
      const res = await fetch(`/api/admin/support?${qs}`);
      const d   = await res.json();
      setTickets(d.tickets ?? []);
      setTotal(d.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.messages]);

  const openCount = tickets.filter(t => t.status === 'OPEN').length;

  async function updateStatus(id: string, status: TicketStatus) {
    setUpdating(true);
    try {
      const res  = await fetch(`/api/admin/support/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.ok) {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
        if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
      }
    } finally {
      setUpdating(false);
    }
  }

  async function sendReply() {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      const res  = await fetch(`/api/admin/support/${selected.id}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ body: replyText.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        const newMsg: TicketMessage = data.message;
        setSelected(prev => prev ? { ...prev, status: 'IN_PROGRESS', messages: [...prev.messages, newMsg] } : null);
        setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status: 'IN_PROGRESS' } : t));
        setReplyText('');
      }
    } finally {
      setSending(false);
    }
  }

  const filtered = tickets.filter(t => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return t.subject.toLowerCase().includes(q) || t.user.username.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex-shrink-0 flex items-start justify-between">
        <div>
          <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#06B6D4', letterSpacing: '0.14em' }}>ПОДДЕРЖКА</p>
          <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>Тикеты</h1>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
            {loading ? 'Загрузка...' : `${openCount} открытых из ${total}`}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl px-3 py-2 font-body text-xs transition-all disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#6B7280' }}
        >
          <RefreshCw style={{ width: '12px', height: '12px' }} className={loading ? 'animate-spin' : ''} />
          Обновить
        </button>
      </motion.div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: Ticket List */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-shrink-0"
               style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Search style={{ width: '13px', height: '13px', color: '#374151' }} />
            <input
              placeholder="Поиск..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none text-white font-body flex-1 placeholder:text-[#1F2937]"
              style={{ fontSize: '12px' }}
            />
            {search && <button onClick={() => setSearch('')}><X style={{ width: '12px', height: '12px', color: '#374151' }} /></button>}
          </div>

          {/* Status filter */}
          <div className="flex gap-1 flex-shrink-0">
            {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map(s => {
              const cfg = s !== 'ALL' ? STATUS_CFG[s] : null;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="flex-1 rounded-lg py-1.5 font-body transition-all text-center"
                  style={{
                    fontSize:   '10px',
                    background: statusFilter === s ? (cfg?.bg ?? 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.03)',
                    border:     `1px solid ${statusFilter === s ? (cfg?.color ?? '#fff') + '40' : 'rgba(255,255,255,0.06)'}`,
                    color:      statusFilter === s ? (cfg?.color ?? '#E2E8F0') : '#4B5563',
                  }}
                >
                  {s === 'ALL' ? 'Все' : STATUS_CFG[s].label}
                </button>
              );
            })}
          </div>

          {/* Ticket list */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 style={{ width: '20px', height: '20px', color: '#374151' }} className="animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare style={{ width: '28px', height: '28px', color: '#1F2937', margin: '0 auto 8px' }} />
                <p className="font-body text-[#374151]" style={{ fontSize: '12px' }}>Тикетов нет</p>
              </div>
            ) : (
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
                      transition={{ delay: i * 0.04 }}
                      onClick={() => { setSelected(ticket); setReplyText(''); }}
                      className="w-full text-left rounded-xl p-3 transition-all duration-200"
                      style={{
                        background: isSelected ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
                        border:     `1px solid ${isSelected ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)'}`,
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
                        <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>{ticket.user.username}</p>
                        <div className="flex items-center gap-1">
                          <span className="font-pixel rounded px-1.5 py-0.5"
                                style={{ fontSize: '6px', color: pc.color, background: pc.bg, letterSpacing: '0.06em' }}>
                            {pc.label.toUpperCase()}
                          </span>
                          <span className="font-body text-[#1F2937]" style={{ fontSize: '10px' }}>
                            {new Date(ticket.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            )}
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
              transition={{ duration: 0.2 }}
              className="flex-1 rounded-2xl overflow-hidden flex flex-col min-w-0"
              style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {/* Header */}
              <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-pixel text-[#374151]" style={{ fontSize: '8px' }}>{selected.id.slice(0, 8)}</span>
                      <div className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5"
                           style={{ background: STATUS_CFG[selected.status].bg }}>
                        <span className="font-body" style={{ fontSize: '10px', color: STATUS_CFG[selected.status].color }}>
                          {STATUS_CFG[selected.status].label}
                        </span>
                      </div>
                      <div className="inline-flex rounded px-1.5 py-0.5"
                           style={{ background: PRIORITY_CFG[selected.priority].bg }}>
                        <span className="font-pixel" style={{ fontSize: '6.5px', color: PRIORITY_CFG[selected.priority].color, letterSpacing: '0.04em' }}>
                          {PRIORITY_CFG[selected.priority].label.toUpperCase()}
                        </span>
                      </div>
                      {selected.category && (
                        <span className="font-body rounded px-2 py-0.5"
                              style={{ fontSize: '10px', color: '#06B6D4', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}>
                          {CATEGORY_LABELS[selected.category] ?? selected.category}
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>{selected.subject}</h3>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-[#374151] hover:text-[#9CA3AF] transition-colors flex-shrink-0">
                    <X style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>

                {/* User info */}
                <div className="flex flex-wrap gap-4 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <p className="font-body text-[#374151] mb-0.5" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Пользователь</p>
                    <p className="font-body text-[#9CA3AF]" style={{ fontSize: '13px' }}>{selected.user.username}</p>
                    <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>{selected.user.email}</p>
                  </div>
                  <div>
                    <p className="font-body text-[#374151] mb-0.5" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Создан</p>
                    <span className="font-body text-[#6B7280]" style={{ fontSize: '12px' }}>
                      {new Date(selected.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages thread */}
              <div className="flex-1 px-5 py-4 overflow-y-auto space-y-3 min-h-0">
                {selected.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[80%]">
                      <div className="flex items-center gap-1.5 mb-1" style={{ flexDirection: msg.isAdmin ? 'row-reverse' : 'row' }}>
                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                             style={{ background: msg.isAdmin ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.07)' }}>
                          {msg.isAdmin
                            ? <Shield style={{ width: '9px', height: '9px', color: '#7C3AED' }} />
                            : <span style={{ fontSize: '9px', color: '#9CA3AF', fontFamily: 'monospace' }}>
                                {msg.author.username[0]?.toUpperCase()}
                              </span>}
                        </div>
                        <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
                          {msg.isAdmin ? 'Поддержка' : msg.author.username} ·{' '}
                          {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="rounded-2xl px-4 py-3"
                           style={{
                             background:   msg.isAdmin ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)',
                             border:       `1px solid ${msg.isAdmin ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.07)'}`,
                             borderRadius: msg.isAdmin ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                           }}>
                        <p className="font-body text-[#D1D5DB] leading-relaxed whitespace-pre-wrap" style={{ fontSize: '13px' }}>
                          {msg.body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Status buttons */}
              <div className="px-5 py-3 flex-shrink-0 flex items-center gap-2 flex-wrap"
                   style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="font-body text-[#374151] mr-1" style={{ fontSize: '11px' }}>Статус:</span>
                {(['OPEN', 'IN_PROGRESS', 'RESOLVED'] as TicketStatus[]).map(s => {
                  const sc = STATUS_CFG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      disabled={updating || selected.status === s}
                      className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-body transition-all duration-200 disabled:opacity-50"
                      style={{
                        background: selected.status === s ? sc.bg : 'rgba(255,255,255,0.03)',
                        border:     `1px solid ${selected.status === s ? sc.color + '40' : 'rgba(255,255,255,0.07)'}`,
                        fontSize:   '11px',
                        color:      selected.status === s ? sc.color : '#4B5563',
                      }}
                    >
                      <sc.icon style={{ width: '10px', height: '10px' }} />
                      {sc.label}
                    </button>
                  );
                })}
              </div>

              {/* Reply input */}
              {selected.status !== 'RESOLVED' && (
                <div className="px-5 pb-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendReply(); }}
                      placeholder="Ответить пользователю... (Ctrl+Enter для отправки)"
                      rows={2}
                      className="flex-1 rounded-xl px-3 py-2.5 text-white font-body outline-none placeholder:text-[#1F2937] resize-none"
                      style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' }}
                    />
                    <button
                      onClick={sendReply}
                      disabled={!replyText.trim() || sending}
                      className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-semibold text-white transition-all disabled:opacity-40 flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: '13px' }}
                    >
                      {sending
                        ? <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" />
                        : <Send style={{ width: '14px', height: '14px' }} />}
                      {sending ? '...' : 'Отправить'}
                    </button>
                  </div>
                </div>
              )}
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
