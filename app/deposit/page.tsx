'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, CreditCard, CheckCircle, Copy, ArrowRight, Info, Clock, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const PRESETS = [50_000, 100_000, 200_000, 500_000, 1_000_000];
const POLL_INTERVAL_MS = 5_000;

interface ActiveDeposit {
  id:           string;
  uniqueAmount: number;
  expiresAt:    string;
  card: {
    cardNumber: string;
    holderName: string;
    bank:       string | null;
  };
}

function CopyButton({ value, big }: { value: string; big?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-body transition-all flex-shrink-0"
      style={{
        background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
        color:      copied ? '#22C55E' : big ? '#9CA3AF' : '#6B7280',
        border:     `1px solid ${copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {copied ? <CheckCircle style={{ width: '11px', height: '11px' }} /> : <Copy style={{ width: '11px', height: '11px' }} />}
      {copied ? 'Скопировано' : 'Копировать'}
    </button>
  );
}

function Countdown({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(expiresAt).getTime() - Date.now()));

  useEffect(() => {
    const t = setInterval(() => {
      const ms = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setLeft(ms);
      if (ms === 0) { clearInterval(t); onExpire(); }
    }, 1000);
    return () => clearInterval(t);
  }, [expiresAt, onExpire]);

  const mm = Math.floor(left / 60_000);
  const ss = Math.floor((left % 60_000) / 1000);
  const urgent = left < 120_000;

  return (
    <span className="font-heading font-bold" style={{ fontSize: '20px', color: urgent ? '#EF4444' : '#F59E0B', fontVariantNumeric: 'tabular-nums' }}>
      {mm}:{String(ss).padStart(2, '0')}
    </span>
  );
}

export default function DepositPage() {
  const [step,     setStep]     = useState<'amount' | 'pay' | 'success' | 'expired'>('amount');
  const [amount,   setAmount]   = useState<number | ''>('');
  const [custom,   setCustom]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [deposit,  setDeposit]  = useState<ActiveDeposit | null>(null);
  const [credited, setCredited] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finalAmount = typeof amount === 'number' ? amount : parseInt(custom.replace(/\s/g, '')) || 0;

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const startPolling = useCallback((id: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/deposit/${id}/status`);
        if (!res.ok) return;
        const d = await res.json();
        if (d.status === 'APPROVED') {
          setCredited(d.credited);
          setStep('success');
          stopPolling();
        } else if (d.status === 'EXPIRED' || d.status === 'REJECTED') {
          setStep('expired');
          stopPolling();
        }
      } catch { /* сеть моргнула — следующий тик */ }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  const createDeposit = async () => {
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
        body:    JSON.stringify({ amount: finalAmount }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? 'Ошибка запроса');
      } else {
        setDeposit({ id: d.id, uniqueAmount: d.uniqueAmount, expiresAt: d.expiresAt, card: d.card });
        setStep('pay');
        startPolling(d.id);
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const reset = (cancelActive = false) => {
    stopPolling();
    if (cancelActive && deposit) {
      fetch(`/api/deposit/${deposit.id}`, { method: 'DELETE' }).catch(() => {});
    }
    setDeposit(null);
    setCredited(null);
    setStep('amount');
    setError('');
  };

  /* ── SUCCESS ─────────────────────────────────────────── */
  if (step === 'success') {
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
            Баланс пополнен!
          </h2>
          <p className="font-body text-[#6B7280] mb-6" style={{ fontSize: '14px' }}>
            Зачислено: <span style={{ color: '#22C55E', fontWeight: 600 }}>{credited != null ? formatPrice(credited) : '—'}</span>
          </p>
          <a
            href="/catalog"
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-heading font-semibold text-white text-sm transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
          >
            В каталог <ArrowRight style={{ width: '14px', height: '14px' }} />
          </a>
        </motion.div>
      </div>
    );
  }

  /* ── EXPIRED ─────────────────────────────────────────── */
  if (step === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0A0A0F', paddingTop: '96px' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl p-10 text-center max-w-md w-full"
          style={{ background: '#0D0D16', border: '1px solid rgba(245,158,11,0.25)' }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
               style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Clock style={{ width: '28px', height: '28px', color: '#F59E0B' }} />
          </div>
          <h2 className="font-heading font-bold text-white mb-2" style={{ fontSize: '22px' }}>
            Время заявки истекло
          </h2>
          <p className="font-body text-[#6B7280] mb-6" style={{ fontSize: '13px' }}>
            Если вы уже перевели деньги — не волнуйтесь, платёж зачислится
            автоматически или после проверки оператором.
          </p>
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-heading font-semibold text-white text-sm transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
          >
            <RefreshCw style={{ width: '14px', height: '14px' }} /> Создать новую заявку
          </button>
        </motion.div>
      </div>
    );
  }

  /* ── PAY ─────────────────────────────────────────────── */
  if (step === 'pay' && deposit) {
    return (
      <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '96px', paddingBottom: '80px' }}>
        <div className="relative z-10 max-w-lg mx-auto px-4">
          <div className="text-center mb-6">
            <h1 className="font-heading font-bold text-white mb-2" style={{ fontSize: '24px' }}>
              Переведите точную сумму
            </h1>
            <div className="flex items-center justify-center gap-2">
              <Clock style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
              <Countdown expiresAt={deposit.expiresAt} onExpire={() => setStep('expired')} />
            </div>
          </div>

          {/* Unique amount — главный элемент */}
          <div className="rounded-2xl p-6 mb-4 text-center"
               style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <p className="font-body text-[#9CA3AF] mb-2" style={{ fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Сумма перевода
            </p>
            <p className="font-heading font-bold text-white mb-3" style={{ fontSize: '34px', letterSpacing: '0.02em' }}>
              {formatPrice(deposit.uniqueAmount)}
            </p>
            <div className="flex justify-center">
              <CopyButton value={String(deposit.uniqueAmount)} big />
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-5 mb-4" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="font-body text-[#9CA3AF] mb-3" style={{ fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Реквизиты
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-body text-[#4B5563]" style={{ fontSize: '10.5px' }}>Номер карты{deposit.card.bank ? ` · ${deposit.card.bank}` : ''}</p>
                  <p className="font-heading font-semibold text-white whitespace-nowrap"
                     style={{ fontSize: 'clamp(14px, 4.3vw, 17px)', letterSpacing: '0.04em' }}>
                    {deposit.card.cardNumber}
                  </p>
                </div>
                <CopyButton value={deposit.card.cardNumber.replace(/\s/g, '')} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-body text-[#4B5563]" style={{ fontSize: '10.5px' }}>Получатель</p>
                  <p className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>
                    {deposit.card.holderName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2.5 rounded-xl p-4 mb-4"
               style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <AlertTriangle style={{ width: '15px', height: '15px', color: '#F59E0B', flexShrink: 0, marginTop: '1px' }} />
            <div className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>
              Переведите <span style={{ color: '#F59E0B', fontWeight: 600 }}>ровно {formatPrice(deposit.uniqueAmount)}</span> одним
              платежом с любого приложения (Click, Payme, банк). Именно по этой сумме
              платёж распознаётся автоматически — при другой сумме зачисление задержится.
            </div>
          </div>

          {/* Waiting indicator */}
          <div className="flex items-center justify-center gap-3 rounded-2xl p-4"
               style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-4 h-4 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
            <p className="font-body text-[#9CA3AF]" style={{ fontSize: '13px' }}>
              Ждём ваш перевод — баланс пополнится автоматически
            </p>
          </div>

          <button onClick={() => reset(true)} className="w-full text-center font-body text-[#4B5563] mt-4 hover:text-[#9CA3AF] transition-colors" style={{ fontSize: '12px' }}>
            Отменить и выбрать другую сумму
          </button>
        </div>
      </div>
    );
  }

  /* ── AMOUNT ──────────────────────────────────────────── */
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
            Перевод на карту — зачисление автоматическое
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
        </div>

        {/* How it works */}
        <div className="flex items-start gap-2.5 rounded-xl p-4 mb-4"
             style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.12)' }}>
          <Info style={{ width: '13px', height: '13px', color: '#06B6D4', flexShrink: 0, marginTop: '2px' }} />
          <p className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>
            Мы выдадим номер карты и точную сумму (например, {finalAmount >= 10_000 ? formatPrice(finalAmount + 347) : '100 347 сум'}).
            Переведите её с любого приложения — система распознает платёж по сумме
            и пополнит баланс автоматически, обычно за 1–2 минуты.
          </p>
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
          onClick={createDeposit}
          disabled={loading || !finalAmount}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-heading font-bold text-white text-base transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 0 30px rgba(124,58,237,0.3)' }}
        >
          <CreditCard style={{ width: '16px', height: '16px' }} />
          {loading ? 'Создание заявки...' : 'Получить реквизиты'}
        </button>
      </div>
    </div>
  );
}
