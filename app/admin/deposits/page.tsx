'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, CheckCircle, XCircle, Clock, RefreshCw,
  User, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

type DepositStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

interface Deposit {
  id:           string;
  amount:       number;
  uniqueAmount: number | null;
  method:       string;
  status:       DepositStatus;
  comment:      string | null;
  confirmedVia: string | null;
  createdAt:    string;
  card: {
    cardNumber: string;
    bank:       string | null;
  } | null;
  users: {
    id:         string;
    username:   string;
    email:      string;
    balanceUzs: number;
  };
}

const STATUS_COLORS: Record<DepositStatus, { color: string; bg: string; label: string }> = {
  PENDING:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  label: 'Ожидает' },
  APPROVED: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   label: 'Одобрено' },
  REJECTED: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   label: 'Отклонено' },
  EXPIRED:  { color: '#6B7280', bg: 'rgba(107,114,128,0.1)', label: 'Истекло' },
};

const METHOD_LABELS: Record<string, string> = {
  click: 'Click',
  payme: 'Payme',
  card:  'Карта',
};

export default function AdminDepositsPage() {
  const [deposits,    setDeposits]    = useState<Deposit[]>([]);
  const [total,       setTotal]       = useState(0);
  const [pages,       setPages]       = useState(1);
  const [page,        setPage]        = useState(1);
  const [filter,      setFilter]      = useState<'PENDING' | 'ALL' | 'APPROVED' | 'REJECTED' | 'EXPIRED'>('PENDING');
  const [loading,     setLoading]     = useState(true);
  const [processing,  setProcessing]  = useState<string | null>(null);
  const [confirmId,   setConfirmId]   = useState<string | null>(null);
  const [confirmType, setConfirmType] = useState<'approve' | 'reject'>('approve');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/deposits?status=${filter}&page=${page}`);
      const d   = await res.json();
      setDeposits(d.deposits ?? []);
      setTotal(d.total ?? 0);
      setPages(d.pages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const pendingCount = filter === 'PENDING' ? total : undefined;

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/deposits/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Не удалось выполнить действие');
      }
      setConfirmId(null);
      load();
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Wallet style={{ width: '16px', height: '16px', color: '#7C3AED' }} />
          </div>
          <div>
            <h1 className="font-heading font-bold text-white" style={{ fontSize: '18px' }}>
              Заявки на пополнение
            </h1>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
              {pendingCount !== undefined ? `${pendingCount} ожидают подтверждения` : `${total} записей`}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 font-body text-[#6B7280] text-xs transition-all hover:text-white"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <RefreshCw style={{ width: '12px', height: '12px' }} />
          Обновить
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'ALL'] as const).map(s => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(1); }}
            className="rounded-xl px-4 py-2 font-heading font-semibold text-xs transition-all"
            style={{
              background: filter === s ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
              border:     `1px solid ${filter === s ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.07)'}`,
              color:      filter === s ? '#A78BFA' : '#6B7280',
            }}
          >
            {s === 'ALL' ? 'Все' : STATUS_COLORS[s as DepositStatus].label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Head */}
        <div className="grid gap-4 px-5 py-3"
             style={{ gridTemplateColumns: '1fr 120px 90px 90px 130px 120px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['Пользователь', 'Сумма', 'Метод', 'Статус', 'Дата', 'Действия'].map(h => (
            <span key={h} className="font-body text-[#374151]" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : deposits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Clock style={{ width: '32px', height: '32px', color: '#1F2937' }} />
            <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Заявок нет</p>
          </div>
        ) : (
          deposits.map(dep => {
            const st = STATUS_COLORS[dep.status];
            return (
              <div
                key={dep.id}
                className="grid gap-4 px-5 py-3.5 items-center hover:bg-white/[0.015] transition-colors"
                style={{ gridTemplateColumns: '1fr 120px 90px 90px 130px 120px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                {/* User */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-heading font-bold text-white"
                       style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', fontSize: '11px' }}>
                    <User style={{ width: '12px', height: '12px' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-[#D1D5DB] truncate" style={{ fontSize: '13px' }}>{dep.users.username}</p>
                    <p className="font-body text-[#374151] truncate" style={{ fontSize: '10.5px' }}>{dep.users.email}</p>
                  </div>
                </div>

                {/* Amount: уникальная сумма перевода — главное для сверки */}
                <div>
                  <p className="font-heading font-bold text-white" style={{ fontSize: '13px' }}>
                    {formatPrice(dep.uniqueAmount ?? dep.amount)}
                  </p>
                  {dep.uniqueAmount != null && dep.uniqueAmount !== dep.amount && (
                    <p className="font-body text-[#4B5563]" style={{ fontSize: '10px' }}>
                      запрос: {formatPrice(dep.amount)}
                    </p>
                  )}
                </div>

                {/* Method / card */}
                <span className="font-body rounded-lg px-2.5 py-1 text-center"
                      title={dep.card?.cardNumber ?? undefined}
                      style={{ fontSize: '11px', color: '#9CA3AF', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {dep.card ? `*${dep.card.cardNumber.replace(/\s/g, '').slice(-4)}` : (METHOD_LABELS[dep.method] ?? dep.method)}
                </span>

                {/* Status */}
                <span className="font-body rounded-lg px-2.5 py-1 text-center"
                      style={{ fontSize: '11px', color: st.color, background: st.bg, border: `1px solid ${st.color}25` }}>
                  {st.label}{dep.status === 'APPROVED' && dep.confirmedVia === 'sms' ? ' · авто' : dep.confirmedVia === 'telegram' ? ' · TG' : ''}
                </span>

                {/* Date */}
                <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
                  {new Date(dep.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>

                {/* Actions: EXPIRED тоже можно одобрить — перевод мог опоздать */}
                {dep.status === 'PENDING' || dep.status === 'EXPIRED' ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { setConfirmId(dep.id); setConfirmType('approve'); }}
                      disabled={processing === dep.id}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-heading font-semibold text-xs transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}
                    >
                      <CheckCircle style={{ width: '11px', height: '11px' }} />
                    </button>
                    <button
                      onClick={() => { setConfirmId(dep.id); setConfirmType('reject'); }}
                      disabled={processing === dep.id}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-heading font-semibold text-xs transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
                    >
                      <XCircle style={{ width: '11px', height: '11px' }} />
                    </button>
                  </div>
                ) : (
                  <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>—</span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
            Страница {page} из {pages} · {total} записей
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 rounded-lg px-3 py-2 font-body text-xs transition-all disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#9CA3AF' }}>
              <ChevronLeft style={{ width: '13px', height: '13px' }} /> Назад
            </button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="flex items-center gap-1 rounded-lg px-3 py-2 font-body text-xs transition-all disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#9CA3AF' }}>
              Вперёд <ChevronRight style={{ width: '13px', height: '13px' }} />
            </button>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="rounded-2xl p-6 max-w-sm w-full"
              style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                   style={{
                     background: confirmType === 'approve' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)',
                     border:     `1px solid ${confirmType === 'approve' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                   }}>
                {confirmType === 'approve'
                  ? <CheckCircle style={{ width: '20px', height: '20px', color: '#22C55E' }} />
                  : <XCircle    style={{ width: '20px', height: '20px', color: '#EF4444' }} />}
              </div>
              <h3 className="font-heading font-bold text-white text-center mb-1.5" style={{ fontSize: '16px' }}>
                {confirmType === 'approve' ? 'Одобрить пополнение?' : 'Отклонить заявку?'}
              </h3>
              <p className="font-body text-[#6B7280] text-center mb-5" style={{ fontSize: '13px' }}>
                {confirmType === 'approve'
                  ? 'Баланс пользователя будет пополнен'
                  : 'Заявка будет отмечена как отклонённая'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmId(null)}
                  className="flex-1 rounded-xl py-2.5 font-heading font-semibold text-sm text-[#6B7280] transition-all hover:text-white"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Отмена
                </button>
                <button
                  onClick={() => handleAction(confirmId, confirmType)}
                  disabled={!!processing}
                  className="flex-1 rounded-xl py-2.5 font-heading font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: confirmType === 'approve'
                      ? 'linear-gradient(135deg, #16A34A, #15803D)'
                      : 'linear-gradient(135deg, #DC2626, #B91C1C)',
                  }}
                >
                  {processing ? '...' : confirmType === 'approve' ? 'Одобрить' : 'Отклонить'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
