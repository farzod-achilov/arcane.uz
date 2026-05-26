'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import type { KeyType } from '@/lib/admin/adminKeysTypes';

const STEAM_KEY_RE = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/i;

const TYPE_OPTIONS: { value: KeyType; label: string; color: string }[] = [
  { value: 'BOTH',  label: 'BOTH',  color: '#9D60FA' },
  { value: 'STORE', label: 'STORE', color: '#06B6D4' },
  { value: 'DROP',  label: 'DROP',  color: '#F59E0B' },
];

interface Props {
  gameId: string;
  gameTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddKeyModal({ gameId, gameTitle, onClose, onSuccess }: Props) {
  const [key, setKey]           = useState('');
  const [keyType, setKeyType]   = useState<KeyType>('BOTH');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  const normalized  = key.trim().toUpperCase();
  const isValid     = STEAM_KEY_RE.test(normalized);

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`/api/admin/keys/${gameId}/add`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ key: normalized, type: keyType }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Ошибка при добавлении ключа');
        return;
      }
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch {
      setError('Ошибка при добавлении ключа');
    } finally {
      setLoading(false);
    }
  };

  // Auto-format: insert dashes
  const handleKeyInput = (val: string) => {
    const clean = val.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 15);
    const parts = [clean.slice(0, 5), clean.slice(5, 10), clean.slice(10, 15)];
    setKey(parts.filter(Boolean).join('-'));
  };

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
        style={{ background: '#0A0A14', border: '1px solid rgba(124,58,237,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <KeyRound style={{ width: '14px', height: '14px', color: '#06B6D4' }} />
            </div>
            <div>
              <p className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>Добавить ключ</p>
              <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{gameTitle}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
            <X style={{ width: '13px', height: '13px', color: '#6B7280' }} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Success */}
          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 rounded-xl px-4 py-3"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <CheckCircle2 style={{ width: '14px', height: '14px', color: '#22C55E' }} />
              <p className="font-body text-[#22C55E]" style={{ fontSize: '12px' }}>Ключ успешно добавлен!</p>
            </motion.div>
          )}

          {/* Key input */}
          <div>
            <p className="font-body text-[#6B7280] mb-2" style={{ fontSize: '11px' }}>Steam ключ</p>
            <div className="relative">
              <input
                value={key}
                onChange={e => handleKeyInput(e.target.value)}
                placeholder="XXXXX-XXXXX-XXXXX"
                maxLength={17}
                className="w-full rounded-xl font-pixel outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${key && !isValid ? 'rgba(239,68,68,0.4)' : key && isValid ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  color: '#E2E8F0',
                  fontSize: '14px',
                  letterSpacing: '0.12em',
                  padding: '12px 40px 12px 14px',
                }}
              />
              {key && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValid
                    ? <CheckCircle2 style={{ width: '14px', height: '14px', color: '#22C55E' }} />
                    : <AlertCircle  style={{ width: '14px', height: '14px', color: '#EF4444' }} />}
                </div>
              )}
            </div>
            {key && !isValid && (
              <p className="font-body mt-1.5" style={{ fontSize: '10px', color: '#EF4444' }}>
                Формат: XXXXX-XXXXX-XXXXX (буквы и цифры)
              </p>
            )}
          </div>

          {/* Type selector */}
          <div>
            <p className="font-body text-[#6B7280] mb-2" style={{ fontSize: '11px' }}>Тип ключа</p>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setKeyType(opt.value)}
                  className="flex-1 py-2 rounded-xl font-pixel transition-all duration-200"
                  style={{
                    background: keyType === opt.value ? `${opt.color}15` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${keyType === opt.value ? `${opt.color}30` : 'rgba(255,255,255,0.08)'}`,
                    fontSize: '9px',
                    color: keyType === opt.value ? opt.color : '#4B5563',
                    letterSpacing: '0.06em',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3"
                 style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle style={{ width: '13px', height: '13px', color: '#EF4444' }} />
              <p className="font-body text-[#F87171]" style={{ fontSize: '12px' }}>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4"
             style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl font-body"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#6B7280', fontSize: '12px' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading || success}
            className="flex items-center gap-2 px-5 py-2 rounded-xl font-body transition-all duration-200"
            style={{
              background: isValid ? 'rgba(6,182,212,0.85)' : 'rgba(255,255,255,0.05)',
              color: isValid ? '#fff' : '#374151',
              fontSize: '12px',
              boxShadow: isValid ? '0 0 14px rgba(6,182,212,0.25)' : 'none',
              cursor: !isValid || loading ? 'not-allowed' : 'pointer',
            }}>
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white" />
            ) : <KeyRound style={{ width: '13px', height: '13px' }} />}
            {loading ? 'Добавление...' : 'Добавить'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
