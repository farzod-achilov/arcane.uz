'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Plus, Trash2, Power, RefreshCw, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Card {
  id:            string;
  cardNumber:    string;
  holderName:    string;
  bank:          string | null;
  isActive:      boolean;
  priority:      number;
  pendingCount:  number;
  approvedToday: number;
  createdAt:     string;
}

export default function AdminCardsPage() {
  const [cards,      setCards]      = useState<Card[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error,      setError]      = useState('');

  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [bank,   setBank]   = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cards');
      const d   = await res.json();
      setCards(d.cards ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addCard = async () => {
    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/admin/cards', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ cardNumber: number, holderName: holder, bank }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? 'Ошибка'); return; }
      setNumber(''); setHolder(''); setBank('');
      load();
    } finally {
      setAdding(false);
    }
  };

  const toggle = async (card: Card) => {
    setProcessing(card.id);
    try {
      await fetch(`/api/admin/cards/${card.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ isActive: !card.isActive }),
      });
      load();
    } finally {
      setProcessing(null);
    }
  };

  const remove = async (card: Card) => {
    if (!confirm(`Удалить карту ${card.cardNumber}? Если по ней были заявки — она будет деактивирована.`)) return;
    setProcessing(card.id);
    try {
      await fetch(`/api/admin/cards/${card.id}`, { method: 'DELETE' });
      load();
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>
            Карты для P2P-пополнений
          </h1>
          <p className="font-body text-[#6B7280] mt-1" style={{ fontSize: '13px' }}>
            Пул карт, на которые пользователи переводят уникальные суммы
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 rounded-xl px-4 py-2 font-body text-sm text-[#9CA3AF] transition-all hover:text-white"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <RefreshCw style={{ width: '13px', height: '13px' }} className={loading ? 'animate-spin' : ''} />
          Обновить
        </button>
      </div>

      {/* Add form */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="font-body text-[#9CA3AF] mb-3" style={{ fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Добавить карту
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={number} onChange={e => setNumber(e.target.value)}
            placeholder="8600 1234 5678 9012"
            className="rounded-xl px-4 py-2.5 font-body text-white text-sm outline-none md:col-span-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <input value={holder} onChange={e => setHolder(e.target.value)}
            placeholder="FARZOD A."
            className="rounded-xl px-4 py-2.5 font-body text-white text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <input value={bank} onChange={e => setBank(e.target.value)}
            placeholder="Банк (необязательно)"
            className="rounded-xl px-4 py-2.5 font-body text-white text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        {error && <p className="font-body mt-3" style={{ fontSize: '12px', color: '#FCA5A5' }}>{error}</p>}
        <button onClick={addCard} disabled={adding || !number || !holder}
          className="mt-4 flex items-center gap-2 rounded-xl px-5 py-2.5 font-heading font-semibold text-white text-sm transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
          <Plus style={{ width: '14px', height: '14px' }} />
          {adding ? 'Добавление...' : 'Добавить'}
        </button>
      </div>

      {/* Cards list */}
      {loading && cards.length === 0 ? (
        <p className="font-body text-[#6B7280] text-sm">Загрузка...</p>
      ) : cards.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
          <CreditCard style={{ width: '28px', height: '28px', color: '#374151', margin: '0 auto 12px' }} />
          <p className="font-body text-[#6B7280] text-sm">
            Карт пока нет. Добавьте первую — без неё P2P-пополнение недоступно.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map(card => (
            <motion.div key={card.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-4 flex flex-wrap items-center gap-4"
              style={{
                background: '#0D0D16',
                border: `1px solid ${card.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)'}`,
                opacity: card.isActive ? 1 : 0.55,
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <CreditCard style={{ width: '16px', height: '16px', color: '#7C3AED' }} />
              </div>

              <div className="flex-1 min-w-[200px]">
                <p className="font-heading font-semibold text-white" style={{ fontSize: '15px', letterSpacing: '0.04em' }}>
                  {card.cardNumber}
                </p>
                <p className="font-body text-[#6B7280]" style={{ fontSize: '12px' }}>
                  {card.holderName}{card.bank ? ` · ${card.bank}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-1.5" title="Активные заявки">
                <Clock style={{ width: '12px', height: '12px', color: '#F59E0B' }} />
                <span className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{card.pendingCount}</span>
              </div>

              <div className="text-right min-w-[110px]">
                <p className="font-body text-[#4B5563]" style={{ fontSize: '10px' }}>Сегодня зачислено</p>
                <p className="font-heading font-semibold" style={{ fontSize: '13px', color: '#22C55E' }}>
                  {formatPrice(card.approvedToday)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => toggle(card)} disabled={processing === card.id}
                  title={card.isActive ? 'Отключить' : 'Включить'}
                  className="rounded-lg p-2 transition-all"
                  style={{
                    background: card.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${card.isActive ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.1)'}`,
                    color: card.isActive ? '#22C55E' : '#6B7280',
                  }}>
                  <Power style={{ width: '14px', height: '14px' }} />
                </button>
                <button onClick={() => remove(card)} disabled={processing === card.id}
                  title="Удалить"
                  className="rounded-lg p-2 transition-all"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
                  <Trash2 style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
