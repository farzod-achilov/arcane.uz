'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, FileText, CheckCircle2, AlertCircle,
  ClipboardPaste, ChevronDown,
} from 'lucide-react';
import type { KeyType, ImportResult } from '@/lib/admin/adminKeysTypes';

const TYPE_OPTIONS: { value: KeyType; label: string; desc: string; color: string }[] = [
  { value: 'BOTH',  label: 'BOTH',  desc: 'Для магазина и дропов',    color: '#9D60FA' },
  { value: 'STORE', label: 'STORE', desc: 'Только для магазина',      color: '#06B6D4' },
  { value: 'DROP',  label: 'DROP',  desc: 'Только для дроп-машин',    color: '#F59E0B' },
];

const STEAM_KEY_RE = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/i;

function parseKeys(raw: string): { valid: string[]; invalid: string[] } {
  const lines = raw.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const normalized = line.toUpperCase();
    if (!STEAM_KEY_RE.test(normalized)) { invalid.push(line); continue; }
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    valid.push(normalized);
  }
  return { valid, invalid };
}

interface Props {
  gameId: string;
  gameTitle: string;
  onClose: () => void;
  onSuccess: (result: ImportResult) => void;
}

export default function ImportModal({ gameId, gameTitle, onClose, onSuccess }: Props) {
  const [rawText, setRawText]         = useState('');
  const [keyType, setKeyType]         = useState<KeyType>('BOTH');
  const [isDragging, setIsDragging]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<ImportResult | null>(null);
  const [error, setError]             = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const parsed = parseKeys(rawText);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.txt')) {
      setError('Только .txt файлы поддерживаются');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => setRawText(prev => prev + '\n' + (e.target?.result as string));
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    if (parsed.valid.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/keys/bulk-import', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ gameId, keys: parsed.valid, type: keyType }),
      });
      const data = await res.json() as ImportResult & { error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? 'Ошибка при импорте ключей');
        return;
      }
      setResult(data);
      onSuccess(data);
    } catch {
      setError('Ошибка при импорте ключей. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: '#0A0A14', border: '1px solid rgba(124,58,237,0.2)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}
            >
              <Upload style={{ width: '14px', height: '14px', color: '#7C3AED' }} />
            </div>
            <div>
              <p className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>
                Импорт Steam ключей
              </p>
              <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{gameTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          >
            <X style={{ width: '13px', height: '13px', color: '#6B7280' }} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Success state */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#22C55E' }} />
                  <span className="font-heading font-semibold text-[#22C55E]" style={{ fontSize: '13px' }}>
                    Импорт завершён
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Добавлено', value: result.imported, color: '#22C55E' },
                    { label: 'Дублей',    value: result.duplicates, color: '#F59E0B' },
                    { label: 'Неверных', value: result.invalid,    color: '#EF4444' },
                    { label: 'Всего',     value: result.total,      color: '#9CA3AF' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="font-heading font-bold" style={{ fontSize: '22px', color: s.color }}>{s.value}</p>
                      <p className="font-body text-[#4B5563]" style={{ fontSize: '10px' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Key type selector */}
          <div>
            <p className="font-body text-[#6B7280] mb-2" style={{ fontSize: '11px' }}>Тип ключей</p>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setKeyType(opt.value)}
                  className="flex-1 rounded-xl p-3 text-left transition-all duration-200"
                  style={{
                    background: keyType === opt.value ? `${opt.color}12` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${keyType === opt.value ? `${opt.color}30` : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <p className="font-pixel" style={{ fontSize: '9px', color: keyType === opt.value ? opt.color : '#4B5563', letterSpacing: '0.06em' }}>
                    {opt.label}
                  </p>
                  <p className="font-body mt-0.5" style={{ fontSize: '10px', color: keyType === opt.value ? '#9CA3AF' : '#374151' }}>
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Drag & drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className="rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer transition-all duration-200"
            style={{
              background: isDragging ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px dashed ${isDragging ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            <FileText style={{ width: '16px', height: '16px', color: isDragging ? '#7C3AED' : '#4B5563' }} />
            <div>
              <p className="font-body" style={{ fontSize: '12px', color: isDragging ? '#9D60FA' : '#6B7280' }}>
                Перетащите .txt файл или нажмите для выбора
              </p>
              <p className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
                Один ключ на строку · XXXXX-XXXXX-XXXXX
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".txt"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          {/* Textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <ClipboardPaste style={{ width: '12px', height: '12px', color: '#4B5563' }} />
                <p className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>Вставить ключи</p>
              </div>
              {rawText && (
                <div className="flex items-center gap-3">
                  {parsed.valid.length > 0 && (
                    <span className="font-pixel" style={{ fontSize: '9px', color: '#22C55E' }}>
                      ✓ {parsed.valid.length} валидных
                    </span>
                  )}
                  {parsed.invalid.length > 0 && (
                    <span className="font-pixel" style={{ fontSize: '9px', color: '#EF4444' }}>
                      ✗ {parsed.invalid.length} неверных
                    </span>
                  )}
                </div>
              )}
            </div>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder={'XXXXX-XXXXX-XXXXX\nXXXXX-XXXXX-XXXXX\n...'}
              rows={7}
              className="w-full rounded-xl font-pixel resize-none outline-none transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#E2E8F0',
                fontSize: '11px',
                letterSpacing: '0.04em',
                padding: '12px 14px',
                lineHeight: '1.7',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3"
                 style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle style={{ width: '13px', height: '13px', color: '#EF4444', flexShrink: 0 }} />
              <p className="font-body text-[#F87171]" style={{ fontSize: '12px' }}>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
            {parsed.valid.length > 0
              ? `${parsed.valid.length} ключей готово к импорту`
              : 'Вставьте ключи или загрузите файл'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-body transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#6B7280', fontSize: '12px' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            >
              Отмена
            </button>
            <button
              onClick={handleImport}
              disabled={parsed.valid.length === 0 || loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-body transition-all duration-200"
              style={{
                background: parsed.valid.length > 0 ? 'rgba(124,58,237,0.85)' : 'rgba(255,255,255,0.05)',
                color: parsed.valid.length > 0 ? '#fff' : '#374151',
                fontSize: '12px',
                boxShadow: parsed.valid.length > 0 ? '0 0 16px rgba(124,58,237,0.3)' : 'none',
                cursor: parsed.valid.length === 0 || loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Импорт...
                </>
              ) : (
                <>
                  <Upload style={{ width: '13px', height: '13px' }} />
                  Импортировать {parsed.valid.length > 0 ? `(${parsed.valid.length})` : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
