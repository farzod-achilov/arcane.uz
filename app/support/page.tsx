'use client';

import { useState, useEffect } from 'react';
import { useSession }          from 'next-auth/react';
import Link                    from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, MessageCircle, Clock, Shield,
  Plus, ChevronDown, CheckCircle2, AlertTriangle, Loader2, X,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'activation', label: 'Проблема с ключом'   },
  { value: 'payment',    label: 'Вопрос по оплате'    },
  { value: 'delivery',   label: 'Статус заказа'        },
  { value: 'refund',     label: 'Возврат средств'      },
  { value: 'coins',      label: 'Arcane Coins'          },
  { value: 'other',      label: 'Другое'               },
];

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

interface MyTicket {
  id:        string;
  subject:   string;
  category:  string;
  status:    TicketStatus;
  createdAt: string;
  _count:    { messages: number };
}

const STATUS_CFG: Record<TicketStatus, { label: string; color: string; icon: React.ElementType }> = {
  OPEN:        { label: 'Открыт',   color: '#EF4444', icon: AlertTriangle },
  IN_PROGRESS: { label: 'В работе', color: '#F59E0B', icon: Clock         },
  RESOLVED:    { label: 'Решён',    color: '#22C55E', icon: CheckCircle2  },
};

export default function SupportPage() {
  const { data: session, status: authStatus } = useSession();

  const [showForm,   setShowForm]   = useState(false);
  const [subject,    setSubject]    = useState('');
  const [category,   setCategory]  = useState('other');
  const [message,    setMessage]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState('');

  const [tickets,  setTickets]  = useState<MyTicket[]>([]);
  const [loadingT, setLoadingT] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    setLoadingT(true);
    fetch('/api/support/tickets')
      .then(r => r.json())
      .then(d => setTickets(d.tickets ?? []))
      .finally(() => setLoadingT(false));
  }, [session?.user?.id, success]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res  = await fetch('/api/support/tickets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subject, category, message }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Ошибка'); return; }
      setSuccess(true);
      setShowForm(false);
      setSubject('');
      setCategory('other');
      setMessage('');
      setTimeout(() => setSuccess(false), 4000);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)',
             backgroundSize: '52px 52px', opacity: 0.012,
           }} />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        {/* Title */}
        <div className="text-center mb-10">
          <p className="font-heading font-semibold text-[#06B6D4] mb-3"
             style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}>
            Поддержка
          </p>
          <h1 className="font-heading font-bold text-white mb-3"
              style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>
            Как мы можем помочь?
          </h1>
          <p className="font-body text-[#6B7280]" style={{ fontSize: '15px' }}>
            Напишите в Telegram или создайте тикет — мы ответим как можно быстрее
          </p>
        </div>

        {/* Success toast */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex items-center gap-3 rounded-2xl px-5 py-4 mb-6"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}
            >
              <CheckCircle2 style={{ width: '18px', height: '18px', color: '#22C55E', flexShrink: 0 }} />
              <p className="font-body text-[#22C55E]" style={{ fontSize: '14px' }}>
                Тикет создан! Мы ответим в ближайшее время.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Telegram CTA */}
        <a
          href="https://t.me/arcaneuz_support"
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-2xl p-7 text-center mb-5 transition-all duration-300 hover:scale-[1.01]"
          style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.22)' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.28)' }}>
            <Send style={{ width: '22px', height: '22px', color: '#06B6D4' }} />
          </div>
          <h2 className="font-heading font-bold text-white mb-1.5" style={{ fontSize: '18px' }}>
            Telegram поддержка
          </h2>
          <p className="font-body text-[#6B7280] mb-4" style={{ fontSize: '13px' }}>
            Самый быстрый способ получить помощь
          </p>
          <div className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-heading font-semibold text-white"
               style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)', fontSize: '13px' }}>
            <MessageCircle style={{ width: '14px', height: '14px' }} />
            @arcaneuz_support
          </div>
        </a>

        {/* Create ticket */}
        {authStatus === 'authenticated' ? (
          <div className="mb-8">
            <button
              onClick={() => setShowForm(v => !v)}
              className="w-full flex items-center justify-between rounded-2xl px-5 py-4 transition-all duration-200"
              style={{ background: '#0D0D16', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <Plus style={{ width: '14px', height: '14px', color: '#7C3AED' }} />
                </div>
                <span className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>
                  Создать тикет
                </span>
              </div>
              <ChevronDown
                style={{ width: '16px', height: '16px', color: '#6B7280', transform: showForm ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            </button>

            <AnimatePresence>
              {showForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSubmit}
                  className="overflow-hidden"
                >
                  <div className="rounded-b-2xl p-5 space-y-4"
                       style={{ background: '#0D0D16', border: '1px solid rgba(124,58,237,0.15)', borderTop: 'none' }}>
                    {/* Category */}
                    <div>
                      <label className="font-body text-[#6B7280] block mb-1.5" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        Категория
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(c => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setCategory(c.value)}
                            className="rounded-lg px-3 py-1.5 font-body transition-all"
                            style={{
                              fontSize:   '12px',
                              background: category === c.value ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                              border:     `1px solid ${category === c.value ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.07)'}`,
                              color:      category === c.value ? '#A78BFA' : '#6B7280',
                            }}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="font-body text-[#6B7280] block mb-1.5" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        Тема
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="Кратко опишите проблему"
                        maxLength={120}
                        required
                        className="w-full rounded-xl px-3 py-2.5 text-white font-body outline-none placeholder:text-[#1F2937]"
                        style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' }}
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="font-body text-[#6B7280] block mb-1.5" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        Сообщение
                      </label>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Подробно опишите ситуацию: заказ, платформа, что произошло..."
                        rows={4}
                        required
                        className="w-full rounded-xl px-3 py-2.5 text-white font-body outline-none placeholder:text-[#1F2937] resize-none"
                        style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' }}
                      />
                    </div>

                    {error && (
                      <p className="font-body text-[#EF4444]" style={{ fontSize: '12px' }}>{error}</p>
                    )}

                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="rounded-xl px-4 py-2.5 font-heading font-semibold text-[#6B7280] transition-all hover:text-white"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '13px' }}
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 font-heading font-semibold text-white transition-all disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: '13px' }}
                      >
                        {submitting
                          ? <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" />
                          : <Send style={{ width: '14px', height: '14px' }} />}
                        {submitting ? 'Отправка...' : 'Отправить тикет'}
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        ) : authStatus === 'unauthenticated' ? (
          <div className="rounded-2xl p-5 mb-8 text-center"
               style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="font-body text-[#6B7280] mb-3" style={{ fontSize: '13px' }}>
              Войдите, чтобы создать тикет и отслеживать ответы
            </p>
            <Link href="/login?next=/support"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2 font-heading font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: '13px' }}>
              Войти
            </Link>
          </div>
        ) : null}

        {/* My tickets */}
        {session?.user?.id && (
          <div className="mb-10">
            <h3 className="font-heading font-semibold text-[#9CA3AF] mb-3"
                style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Мои тикеты
            </h3>
            {loadingT ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 style={{ width: '20px', height: '20px', color: '#374151' }} className="animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <p className="font-body text-[#374151] text-center py-6" style={{ fontSize: '13px' }}>
                Тикетов пока нет
              </p>
            ) : (
              <div className="space-y-2">
                {tickets.map((t, i) => {
                  const sc = STATUS_CFG[t.status];
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 rounded-xl px-4 py-3.5"
                      style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-[#D1D5DB] truncate" style={{ fontSize: '13px' }}>{t.subject}</p>
                        <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
                          {new Date(t.createdAt).toLocaleDateString('ru-RU')} · {t._count.messages} сообщ.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 rounded-lg px-2.5 py-1"
                           style={{ background: `${sc.color}12` }}>
                        <sc.icon style={{ width: '10px', height: '10px', color: sc.color }} />
                        <span className="font-body" style={{ fontSize: '10.5px', color: sc.color }}>{sc.label}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Clock,         label: '< 5 минут', sub: 'Среднее время ответа' },
            { icon: Shield,        label: '24/7',       sub: 'Без выходных'         },
            { icon: MessageCircle, label: 'Русский',    sub: 'Язык поддержки'       },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center"
                 style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
              <s.icon style={{ width: '18px', height: '18px', color: '#06B6D4', margin: '0 auto 8px' }} />
              <p className="font-heading font-bold text-white mb-0.5" style={{ fontSize: '14px' }}>{s.label}</p>
              <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        <p className="font-body text-[#374151] text-center mt-8" style={{ fontSize: '12px' }}>
          Также см.{' '}
          <Link href="/faq" className="text-[#7C3AED] hover:text-[#9D60FA] transition-colors">FAQ</Link>
        </p>
      </div>
    </div>
  );
}
