'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import type { KeyType } from '@/lib/admin/adminKeysTypes';

const TYPES: { value: KeyType; label: string; color: string; desc: string }[] = [
  { value: 'STORE', label: 'STORE', color: '#06B6D4', desc: 'Магазин' },
  { value: 'DROP',  label: 'DROP',  color: '#F59E0B', desc: 'Дропы'   },
  { value: 'BOTH',  label: 'BOTH',  color: '#9D60FA', desc: 'Оба'     },
];

interface Props {
  gameId: string;
  gameTitle: string;
  stockByType: Record<KeyType, number>;
  onClose: () => void;
  onSuccess: (moved: number) => void;
}

export default function MoveModal({ gameId, gameTitle, stockByType, onClose, onSuccess }: Props) {
  const [fromType, setFromType] = useState<KeyType>('STORE');
  const [toType, setToType]     = useState<KeyType>('DROP');
  const [count, setCount]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const available = stockByType[fromType] ?? 0;
  const parsedCount = parseInt(count, 10);
  const isValid = parsedCount > 0 && parsedCount <= available && fromType !== toType;

  const handleMove = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 900));
      setDone(true);
      setTimeout(() => { onSuccess(parsedCount); onClose(); }, 1400);
    } finally {
      setLoading(false);
    }
  };

  const fromCfg = TYPES.find(t => t.value === fromType)!;
  const toCfg   = TYPES.find(t => t.value === toType)!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0A0A14', border: '1px solid rgba(157,96,250,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(157,96,250,0.12)', border: '1px solid rgba(157,96,250,0.2)' }}>
              <ArrowLeftRight style={{ width: '14px', height: '14px', color: '#9D60FA' }} />
            </div>
            <div>
              <p className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>Переместить ключи</p>
              <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{gameTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
            <X style={{ width: '13px', height: '13px', color: '#6B7280' }} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {done && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 rounded-xl px-4 py-3"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <CheckCircle2 style={{ width: '14px', height: '14px', color: '#22C55E' }} />
              <p className="font-body text-[#22C55E]" style={{ fontSize: '12px' }}>
                {parsedCount} ключей перемещено: {fromCfg.label} → {toCfg.label}
              </p>
            </motion.div>
          )}

          {/* From / To visual */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-body text-[#4B5563] mb-1.5" style={{ fontSize: '10px' }}>ИЗ</p>
              <div className="flex gap-1.5">
                {TYPES.map(t => (
                  <button key={t.value} onClick={() => setFromType(t.value)}
                    className="flex-1 py-2 rounded-xl font-pixel transition-all duration-200"
                    style={{
                      background: fromType === t.value ? `${t.color}15` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${fromType === t.value ? `${t.color}30` : 'rgba(255,255,255,0.07)'}`,
                      fontSize: '8px', color: fromType === t.value ? t.color : '#374151',
                      letterSpacing: '0.06em',
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <ArrowLeftRight style={{ width: '18px', height: '18px', color: '#374151' }} />
            </div>
            <div className="flex-1">
              <p className="font-body text-[#4B5563] mb-1.5" style={{ fontSize: '10px' }}>В</p>
              <div className="flex gap-1.5">
                {TYPES.map(t => (
                  <button key={t.value} onClick={() => setToType(t.value)}
                    className="flex-1 py-2 rounded-xl font-pixel transition-all duration-200"
                    style={{
                      background: toType === t.value ? `${t.color}15` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${toType === t.value ? `${t.color}30` : 'rgba(255,255,255,0.07)'}`,
                      fontSize: '8px', color: toType === t.value ? t.color : '#374151',
                      letterSpacing: '0.06em',
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Same-type warning */}
          {fromType === toType && (
            <p className="font-body" style={{ fontSize: '11px', color: '#EF4444' }}>
              Тип «откуда» и «куда» не может быть одинаковым
            </p>
          )}

          {/* Count input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>Количество ключей</p>
              <p className="font-pixel" style={{ fontSize: '9px', color: fromCfg.color }}>
                Доступно: {available}
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={count}
                onChange={e => setCount(e.target.value)}
                placeholder="0"
                min={1}
                max={available}
                className="flex-1 rounded-xl font-heading font-bold outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${count && !isValid && fromType !== toType ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  color: '#E2E8F0',
                  fontSize: '18px',
                  padding: '10px 14px',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(157,96,250,0.3)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
              <button onClick={() => setCount(String(available))}
                className="px-3 py-2 rounded-xl font-pixel transition-all"
                style={{ background: 'rgba(157,96,250,0.1)', border: '1px solid rgba(157,96,250,0.2)', fontSize: '9px', color: '#9D60FA' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(157,96,250,0.18)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(157,96,250,0.1)')}>
                ВСЕ
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4"
             style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            {isValid && (
              <p className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>
                <span style={{ color: fromCfg.color }}>{parsedCount} ключей</span>
                {' '}→{' '}
                <span style={{ color: toCfg.color }}>{toCfg.label}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 rounded-xl font-body"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#6B7280', fontSize: '12px' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
              Отмена
            </button>
            <button onClick={handleMove} disabled={!isValid || loading || done}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-body transition-all"
              style={{
                background: isValid ? 'rgba(157,96,250,0.85)' : 'rgba(255,255,255,0.05)',
                color: isValid ? '#fff' : '#374151',
                fontSize: '12px',
                boxShadow: isValid ? '0 0 14px rgba(157,96,250,0.25)' : 'none',
                cursor: !isValid || loading ? 'not-allowed' : 'pointer',
              }}>
              {loading
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white" />
                : <ArrowLeftRight style={{ width: '13px', height: '13px' }} />}
              {loading ? 'Перемещение...' : 'Переместить'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
