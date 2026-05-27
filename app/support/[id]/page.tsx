'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Loader2, Clock, CheckCircle2, AlertTriangle,
  Shield, MessageCircle,
} from 'lucide-react';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

interface Author {
  username: string | null;
  avatar:   string | null;
}

interface Message {
  id:        string;
  isAdmin:   boolean;
  body:      string;
  createdAt: string;
  author:    Author;
}

interface Ticket {
  id:        string;
  subject:   string;
  category:  string;
  status:    TicketStatus;
  priority:  string;
  createdAt: string;
  messages:  Message[];
}

const CATEGORY_LABELS: Record<string, string> = {
  activation: 'Проблема с ключом',
  payment:    'Вопрос по оплате',
  delivery:   'Статус заказа',
  refund:     'Возврат средств',
  coins:      'Arcane Coins',
  other:      'Другое',
};

const STATUS_CFG: Record<TicketStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  OPEN:        { label: 'Открыт',   color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   icon: AlertTriangle },
  IN_PROGRESS: { label: 'В работе', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: Clock         },
  RESOLVED:    { label: 'Решён',    color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   icon: CheckCircle2  },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function TicketChatPage() {
  const { data: session, status: authStatus } = useSession();
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [ticket,  setTicket]  = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const [reply,     setReply]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [sendError, setSendError] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res  = await fetch(`/api/support/tickets/${params.id}`);
      if (res.status === 404) { router.push('/support'); return; }
      const data = await res.json() as { ticket?: Ticket };
      if (data.ticket) setTicket(data.ticket);
    } catch {
      setError('Не удалось загрузить тикет');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, params.id, router]);

  useEffect(() => { if (authStatus !== 'loading') load(); }, [authStatus, load]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSendError('');
    setSending(true);
    try {
      const res  = await fetch(`/api/support/tickets/${params.id}/messages`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: reply }),
      });
      const data = await res.json() as { message?: Message; error?: string };
      if (!res.ok) { setSendError(data.error ?? 'Ошибка'); return; }
      if (data.message && ticket) {
        setTicket(prev => prev
          ? { ...prev, messages: [...prev.messages, data.message!], status: 'IN_PROGRESS' }
          : prev);
        setReply('');
      }
    } catch {
      setSendError('Ошибка при отправке');
    } finally {
      setSending(false);
    }
  }

  /* ── Loading / auth states ── */
  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#05040B' }}>
        <Loader2 className="animate-spin w-6 h-6 text-[#7C3AED]" />
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#05040B' }}>
        <div className="text-center">
          <p className="font-body text-[#6B7280] mb-4">Войдите, чтобы просмотреть тикет</p>
          <Link href={`/login?next=/support/${params.id}`}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-heading font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: '13px' }}>
            Войти
          </Link>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#05040B' }}>
        <div className="text-center">
          <p className="font-body text-[#EF4444] mb-4">{error || 'Тикет не найден'}</p>
          <Link href="/support" className="font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors text-sm">
            ← Назад к поддержке
          </Link>
        </div>
      </div>
    );
  }

  const sc = STATUS_CFG[ticket.status];
  const StatusIcon = sc.icon;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#05040B', paddingTop: '64px' }}>

      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)',
             backgroundSize: '52px 52px', opacity: 0.012,
           }} />

      <div className="relative flex flex-col flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6">

        {/* Back link */}
        <Link href="/support"
          className="inline-flex items-center gap-1.5 font-body text-[#4B5563] hover:text-[#9CA3AF] transition-colors mb-5 w-fit"
          style={{ fontSize: '13px' }}>
          <ArrowLeft style={{ width: '14px', height: '14px' }} />
          К списку тикетов
        </Link>

        {/* Ticket header */}
        <div className="rounded-2xl p-5 mb-4"
             style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="font-heading font-bold text-white leading-snug" style={{ fontSize: '17px' }}>
              {ticket.subject}
            </h1>
            <div className="flex items-center gap-1.5 flex-shrink-0 rounded-lg px-2.5 py-1"
                 style={{ background: sc.bg }}>
              <StatusIcon style={{ width: '10px', height: '10px', color: sc.color }} />
              <span className="font-body" style={{ fontSize: '10.5px', color: sc.color }}>{sc.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-body rounded-lg px-2.5 py-0.5"
                  style={{ fontSize: '11px', background: 'rgba(124,58,237,0.1)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.2)' }}>
              {CATEGORY_LABELS[ticket.category] ?? ticket.category}
            </span>
            <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
              #{ticket.id.slice(-8).toUpperCase()}
            </span>
            <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
              {new Date(ticket.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px]">
          {ticket.messages.map((msg, i) => {
            const isUser = !msg.isAdmin;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Admin avatar placeholder */}
                {!isUser && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5"
                       style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.25)' }}>
                    <Shield style={{ width: '12px', height: '12px', color: '#06B6D4' }} />
                  </div>
                )}

                <div className="max-w-[80%]">
                  {/* Bubble */}
                  <div
                    className="rounded-2xl px-4 py-3 font-body"
                    style={{
                      fontSize: '13.5px',
                      lineHeight: '1.55',
                      background: isUser
                        ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(91,33,182,0.2))'
                        : '#0D0D16',
                      border: isUser
                        ? '1px solid rgba(124,58,237,0.3)'
                        : '1px solid rgba(255,255,255,0.07)',
                      color: isUser ? '#DDD6FE' : '#D1D5DB',
                      borderBottomRightRadius: isUser ? '4px' : undefined,
                      borderBottomLeftRadius:  !isUser ? '4px' : undefined,
                    }}
                  >
                    {!isUser && (
                      <p className="font-heading font-semibold mb-1" style={{ fontSize: '11px', color: '#06B6D4' }}>
                        Поддержка ARCANE
                      </p>
                    )}
                    <p style={{ whiteSpace: 'pre-wrap' }}>{msg.body}</p>
                  </div>
                  {/* Timestamp */}
                  <p className={`font-body mt-1 ${isUser ? 'text-right' : 'text-left'}`}
                     style={{ fontSize: '10px', color: '#374151' }}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>

                {/* User avatar placeholder */}
                {isUser && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center ml-2 flex-shrink-0 mt-0.5 font-heading font-bold text-white"
                       style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', fontSize: '11px' }}>
                    {(msg.author.username ?? 'U')[0].toUpperCase()}
                  </div>
                )}
              </motion.div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply form */}
        {ticket.status !== 'RESOLVED' ? (
          <div className="rounded-2xl p-4"
               style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
            <AnimatePresence>
              {sendError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="font-body text-[#EF4444] mb-2"
                  style={{ fontSize: '12px' }}
                >
                  {sendError}
                </motion.p>
              )}
            </AnimatePresence>
            <form onSubmit={handleSend} className="flex gap-3 items-end">
              <textarea
                value={reply}
                onChange={e => { setReply(e.target.value); setSendError(''); }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend(e as unknown as React.FormEvent);
                }}
                placeholder="Напишите сообщение... (Ctrl+Enter для отправки)"
                rows={3}
                disabled={sending}
                className="flex-1 rounded-xl px-3.5 py-2.5 text-white font-body outline-none placeholder:text-[#1F2937] resize-none disabled:opacity-50"
                style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' }}
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
              >
                {sending
                  ? <Loader2 className="animate-spin w-4 h-4 text-white" />
                  : <Send style={{ width: '15px', height: '15px', color: '#fff' }} />}
              </button>
            </form>
            <p className="font-body text-[#374151] mt-2" style={{ fontSize: '10.5px' }}>
              Среднее время ответа — менее 5 минут
            </p>
          </div>
        ) : (
          <div className="rounded-2xl p-4 text-center"
               style={{ background: '#0D0D16', border: '1px solid rgba(34,197,94,0.15)' }}>
            <CheckCircle2 className="w-5 h-5 mx-auto mb-2" style={{ color: '#22C55E' }} />
            <p className="font-body text-[#22C55E]" style={{ fontSize: '13px' }}>
              Тикет закрыт. Если проблема повторится — создайте новый.
            </p>
            <Link href="/support"
              className="inline-flex items-center gap-1.5 mt-3 font-body text-[#4B5563] hover:text-[#9CA3AF] transition-colors"
              style={{ fontSize: '12px' }}>
              <MessageCircle style={{ width: '12px', height: '12px' }} />
              Создать новый тикет
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
