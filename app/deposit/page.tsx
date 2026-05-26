'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, CreditCard, CheckCircle, Copy, ArrowRight, Info, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const PRESETS = [50_000, 100_000, 200_000, 500_000, 1_000_000];

const METHODS: Record<string, {
  label: string;
  color: string;
  icon: string;
  fields: { label: string; value: string }[];
  note: string;
}> = {
  click: {
    label: 'Click',
    color: '#0075FF',
    icon:  '💳',
    fields: [
      { label: 'Номер карты',   value: '8600 1234 5678 9012' },
      { label: 'Получатель',    value: 'ARCANE STORE FARZOD A.' },
    ],
    note: 'Отправьте точную сумму, укажите в комментарии ваш никнейм',
  },
  payme: {
    label: 'Payme',
    color: '#1AC8B1',
    icon:  '🟢',
    fields: [
      { label: 'Номер телефона', value: '+998 90 123 45 67' },
      { label: 'Получатель',     value: 'Farzod A.' },
    ],
    note: 'Переведите через Payme, укажите никнейм в комментарии',
  },
  card: {
    label: 'Банковская карта',
    color: '#7C3AED',
    icon:  '🏦',
    fields: [
      { label: 'Uzcard',      value: '8600 5678 9012 3456' },
      { label: 'Humo',        value: '9860 1234 5678 9012' },
      { label: 'Получатель',  value: 'ARCANE STORE' },
    ],
    note: 'Переведите с любой карты, в назначении укажите ваш никнейм',
  },
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-body transition-all"
      style={{
        background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
        color:      copied ? '#22C55E' : '#6B7280',
        border:     `1px solid ${copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {copied ? <CheckCircle style={{ width: '11px', height: '11px' }} /> : <Copy style={{ width: '11px', height: '11px' }} />}
      {copied ? 'Скопировано' : 'Копировать'}
    </button>
  );
}

export default function DepositPage() {
  const [amount,    setAmount]    = useState<number | ''>('');
  const [method,    setMethod]    = useState<string>('click');
  const [custom,    setCustom]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState('');

  const finalAmount = typeof amount === 'number' ? amount : parseInt(custom.replace(/\s/g, '')) || 0;
  const cfg = METHODS[method];

  const handleSubmit = async () => {
    if (!finalAmount || finalAmount < 10_000) {
      setError('Минимальная сумма — 10 000 сум');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/deposit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: finalAmount, method }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Ошибка запроса');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0A0A0F', paddingTop: '96px' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl p-10 text-center max-w-md w-full"
          style={{ background: '#0D0D16', border: '1px solid rgba(34,197,94,0.25)' }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
               style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <CheckCircle style={{ width: '28px', height: '28px', color: '#22C55E' }} />
          </div>
          <h2 className="font-heading font-bold text-white mb-2" style={{ fontSize: '22px' }}>
            Заявка отправлена!
          </h2>
          <p className="font-body text-[#6B7280] mb-1" style={{ fontSize: '14px' }}>
            Сумма: <span style={{ color: '#22C55E' }}>{formatPrice(finalAmount)}</span>
          </p>
          <p className="font-body text-[#6B7280] mb-6" style={{ fontSize: '13px' }}>
            Метод: {cfg.label}
          </p>
          <div className="rounded-xl p-4 mb-6 flex items-start gap-3"
               style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <Clock style={{ width: '15px', height: '15px', color: '#F59E0B', flexShrink: 0, marginTop: '1px' }} />
            <p className="font-body text-[#9CA3AF]" style={{ fontSize: '12px', textAlign: 'left' }}>
              Среднее время обработки — до 30 минут в рабочее время.
              После подтверждения оплаты баланс будет пополнен автоматически.
            </p>
          </div>
          <a
            href="/profile?tab=deposits"
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-heading font-semibold text-white text-sm transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
          >
            Смотреть статус <ArrowRight style={{ width: '14px', height: '14px' }} />
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '96px', paddingBottom: '80px' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: '30%', width: '500px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Wallet style={{ width: '22px', height: '22px', color: '#7C3AED' }} />
          </div>
          <h1 className="font-heading font-bold text-white mb-2" style={{ fontSize: '26px' }}>
            Пополнение баланса
          </h1>
          <p className="font-body text-[#6B7280]" style={{ fontSize: '14px' }}>
            Выберите сумму и способ оплаты
          </p>
        </div>

        {/* Amount selection */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="font-body text-[#9CA3AF] mb-3" style={{ fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Сумма
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => { setAmount(p); setCustom(''); setError(''); }}
                className="rounded-xl py-2.5 font-heading font-semibold text-sm transition-all"
                style={{
                  background: amount === p ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                  border:     `1px solid ${amount === p ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  color:      amount === p ? '#A78BFA' : '#6B7280',
                }}
              >
                {p >= 1_000_000 ? `${p / 1_000_000} млн` : `${p / 1_000}к`}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Своя сумма (мин. 10 000)"
            value={custom}
            onChange={e => { setCustom(e.target.value); setAmount(''); setError(''); }}
            className="w-full rounded-xl px-4 py-3 font-body text-white text-sm outline-none transition-all"
            style={{
              background:  'rgba(255,255,255,0.04)',
              border:      `1px solid ${custom ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color:       '#E2E8F0',
            }}
          />
          {finalAmount > 0 && (
            <p className="mt-2 font-body text-[#6B7280]" style={{ fontSize: '12px' }}>
              К зачислению: <span style={{ color: '#22C55E' }}>{formatPrice(finalAmount)}</span>
            </p>
          )}
        </div>

        {/* Method selection */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="font-body text-[#9CA3AF] mb-3" style={{ fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Способ оплаты
          </p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {Object.entries(METHODS).map(([key, m]) => (
              <button
                key={key}
                onClick={() => setMethod(key)}
                className="rounded-xl py-3 flex flex-col items-center gap-1.5 font-heading font-semibold text-xs transition-all"
                style={{
                  background: method === key ? `${m.color}15` : 'rgba(255,255,255,0.04)',
                  border:     `1px solid ${method === key ? `${m.color}40` : 'rgba(255,255,255,0.07)'}`,
                  color:      method === key ? m.color : '#6B7280',
                }}
              >
                <span style={{ fontSize: '18px' }}>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          {/* Requisites */}
          <AnimatePresence mode="wait">
            <motion.div
              key={method}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <div className="rounded-xl p-4 mb-3"
                   style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}20` }}>
                <p className="font-body mb-3" style={{ fontSize: '11px', color: cfg.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Реквизиты для перевода
                </p>
                <div className="space-y-2.5">
                  {cfg.fields.map(f => (
                    <div key={f.label} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-body text-[#4B5563]" style={{ fontSize: '10.5px' }}>{f.label}</p>
                        <p className="font-heading font-semibold text-white" style={{ fontSize: '14px', letterSpacing: '0.03em' }}>
                          {f.value}
                        </p>
                      </div>
                      <CopyButton value={f.value} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl p-3"
                   style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                <Info style={{ width: '13px', height: '13px', color: '#F59E0B', flexShrink: 0, marginTop: '1px' }} />
                <p className="font-body text-[#9CA3AF]" style={{ fontSize: '11.5px' }}>
                  {cfg.note}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl px-4 py-3 mb-4 font-body text-sm"
               style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !finalAmount}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-heading font-bold text-white text-base transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 0 30px rgba(124,58,237,0.3)' }}
        >
          <CreditCard style={{ width: '16px', height: '16px' }} />
          {loading ? 'Отправка...' : `Я оплатил${finalAmount ? ` ${formatPrice(finalAmount)}` : ''}`}
        </button>

        <p className="text-center font-body text-[#374151] mt-4" style={{ fontSize: '11px' }}>
          После нажатия создаётся заявка. Баланс пополняется после проверки оплаты администратором.
        </p>
      </div>
    </div>
  );
}
