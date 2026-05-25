'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle,
  AlertTriangle, ChevronDown, ChevronUp, Loader2,
  Copy, ClipboardCheck, ArrowRight,
} from 'lucide-react';
import type { BulkImportResult } from '@/app/api/keys/bulk-import/route';

// ── CSV parser ────────────────────────────────────────────────────────────────

const STEAM_KEY_RE = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/i;

type RowStatus = 'valid' | 'invalid_key' | 'invalid_row' | 'duplicate_csv';

interface ParsedRow {
  lineNum:  number;
  gameId:   string;
  key:      string;
  status:   RowStatus;
  raw:      string;
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/);
  const rows: ParsedRow[] = [];
  const seenKeys = new Set<string>();

  let startIdx = 0;
  if (lines[0]?.toLowerCase().includes('game_id')) startIdx = 1;

  for (let i = startIdx; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    const parts = raw.split(',');
    if (parts.length < 2) {
      rows.push({ lineNum: i + 1, gameId: '', key: '', status: 'invalid_row', raw });
      continue;
    }

    const gameId = parts[0].trim();
    const key    = parts[1].trim().toUpperCase();

    if (!gameId || !key) {
      rows.push({ lineNum: i + 1, gameId, key, status: 'invalid_row', raw });
      continue;
    }

    if (!STEAM_KEY_RE.test(key)) {
      rows.push({ lineNum: i + 1, gameId, key, status: 'invalid_key', raw });
      continue;
    }

    const dedupKey = `${gameId}::${key}`;
    if (seenKeys.has(dedupKey)) {
      rows.push({ lineNum: i + 1, gameId, key, status: 'duplicate_csv', raw });
      continue;
    }
    seenKeys.add(dedupKey);
    rows.push({ lineNum: i + 1, gameId, key, status: 'valid', raw });
  }

  return rows;
}

interface GameGroup {
  gameId:    string;
  keys:      string[];
  total:     number;
}

function groupByGame(rows: ParsedRow[]): GameGroup[] {
  const map = new Map<string, string[]>();
  for (const r of rows) {
    if (r.status !== 'valid') continue;
    const arr = map.get(r.gameId) ?? [];
    arr.push(r.key);
    map.set(r.gameId, arr);
  }
  return Array.from(map.entries()).map(([gameId, keys]) => ({ gameId, keys, total: keys.length }));
}

// ── Types ─────────────────────────────────────────────────────────────────────

type KeyType = 'STORE' | 'DROP' | 'BOTH';
type Step    = 'upload' | 'preview' | 'import' | 'done';

interface GameProgress {
  gameId:  string;
  status:  'pending' | 'importing' | 'done' | 'error';
  result?: BulkImportResult;
  error?:  string;
}

interface TotalResult {
  imported:   number;
  duplicates: number;
  invalid:    number;
  total:      number;
}

const TYPE_OPTS: { value: KeyType; label: string; desc: string; color: string }[] = [
  { value: 'BOTH',  label: 'BOTH',  desc: 'Магазин + дропы',    color: '#9D60FA' },
  { value: 'STORE', label: 'STORE', desc: 'Только магазин',     color: '#06B6D4' },
  { value: 'DROP',  label: 'DROP',  desc: 'Только дроп-машины', color: '#F59E0B' },
];

const STATUS_CFG = {
  valid:        { label: 'Валидный',    color: '#22C55E', bg: 'rgba(34,197,94,0.08)'  },
  invalid_key:  { label: 'Неверный ключ', color: '#EF4444', bg: 'rgba(239,68,68,0.08)'  },
  invalid_row:  { label: 'Неверная строка', color: '#EF4444', bg: 'rgba(239,68,68,0.08)'  },
  duplicate_csv: { label: 'Дубль в файле', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
} as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function Pill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-3 rounded-xl"
         style={{ background: `${color}0D`, border: `1px solid ${color}25` }}>
      <span className="font-heading font-bold" style={{ fontSize: '22px', color }}>{value}</span>
      <span className="font-body text-[#4B5563]" style={{ fontSize: '10px', marginTop: '1px' }}>{label}</span>
    </div>
  );
}

function Spinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
      className="w-3.5 h-3.5 rounded-full border-2"
      style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#fff' }}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export default function CsvBulkImportModal({ onClose }: Props) {
  const [step,       setStep]       = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [rows,       setRows]       = useState<ParsedRow[]>([]);
  const [keyType,    setKeyType]    = useState<KeyType>('BOTH');
  const [progress,   setProgress]   = useState<GameProgress[]>([]);
  const [totalResult,setTotalResult]= useState<TotalResult | null>(null);
  const [showInvalid, setShowInvalid] = useState(false);
  const [copied,     setCopied]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const groups    = useMemo(() => groupByGame(rows), [rows]);
  const validCount = useMemo(() => rows.filter(r => r.status === 'valid').length, [rows]);
  const invalidRows = useMemo(() => rows.filter(r => r.status !== 'valid'), [rows]);

  // ── File loading ────────────────────────────────────────────────────────────

  const loadFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = (e.target?.result as string) ?? '';
      setRows(parseCsv(text));
      setStep('preview');
    };
    reader.readAsText(file, 'utf-8');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, [loadFile]);

  // ── Import flow ─────────────────────────────────────────────────────────────

  const startImport = async () => {
    if (groups.length === 0) return;
    setProgress(groups.map(g => ({ gameId: g.gameId, status: 'pending' })));
    setStep('import');

    const tot: TotalResult = { imported: 0, duplicates: 0, invalid: 0, total: 0 };

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      setProgress(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'importing' } : p));

      try {
        const res  = await fetch('/api/keys/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: group.gameId, keys: group.keys, type: keyType }),
        });
        const data = await res.json() as BulkImportResult & { error?: string };

        if (!res.ok || data.error) throw new Error(data.error ?? 'Server error');

        tot.imported   += data.imported;
        tot.duplicates += data.duplicates;
        tot.invalid    += data.invalid;
        tot.total      += data.total;

        setProgress(prev => prev.map((p, idx) =>
          idx === i ? { ...p, status: 'done', result: data } : p,
        ));
      } catch (err) {
        setProgress(prev => prev.map((p, idx) =>
          idx === i ? { ...p, status: 'error', error: String(err) } : p,
        ));
        tot.total += group.keys.length;
      }
    }

    // Also count CSV-level invalids
    tot.invalid += rows.filter(r => r.status === 'invalid_key' || r.status === 'invalid_row').length;
    tot.duplicates += rows.filter(r => r.status === 'duplicate_csv').length;
    tot.total += invalidRows.length;

    setTotalResult(tot);
    setStep('done');
  };

  // ── Copy invalid rows ────────────────────────────────────────────────────────

  const copyInvalid = () => {
    const text = invalidRows.map(r => r.raw).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-3xl rounded-2xl flex flex-col overflow-hidden"
        style={{ background: '#08080F', border: '1px solid rgba(124,58,237,0.22)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.28)' }}>
              <FileSpreadsheet style={{ width: '14px', height: '14px', color: '#7C3AED' }} />
            </div>
            <div>
              <p className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>
                Массовый импорт CSV
              </p>
              <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
                Формат: game_id,key · XXXXX-XXXXX-XXXXX
              </p>
            </div>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mr-4">
            {(['upload','preview','import','done'] as Step[]).map((s, i) => {
              const done    = ['upload','preview','import','done'].indexOf(step) > i;
              const current = step === s;
              return (
                <div key={s} className="flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                    style={{ background: done ? '#22C55E' : current ? '#7C3AED' : 'rgba(255,255,255,0.12)' }}
                  />
                  {i < 3 && <div className="w-4 h-px" style={{ background: done ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)' }} />}
                </div>
              );
            })}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          >
            <X style={{ width: '13px', height: '13px', color: '#6B7280' }} />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ════ STEP: UPLOAD ════ */}
            {step === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="p-6 space-y-4">
                {/* Drag zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className="rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300"
                  style={{
                    minHeight: '240px',
                    background: isDragging ? 'rgba(124,58,237,0.07)' : 'rgba(255,255,255,0.02)',
                    border: `2px dashed ${isDragging ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <motion.div
                    animate={{ scale: isDragging ? 1.12 : 1, y: isDragging ? -4 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: isDragging ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.04)',
                             border: `1px solid ${isDragging ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)'}` }}
                  >
                    <Upload style={{ width: '28px', height: '28px', color: isDragging ? '#9D60FA' : '#374151' }} />
                  </motion.div>

                  <div className="text-center">
                    <p className="font-heading font-semibold" style={{ fontSize: '15px', color: isDragging ? '#C4B5FD' : '#9CA3AF' }}>
                      {isDragging ? 'Отпустите файл' : 'Перетащите CSV файл сюда'}
                    </p>
                    <p className="font-body text-[#374151] mt-1" style={{ fontSize: '12px' }}>
                      или нажмите для выбора · .csv, .txt
                    </p>
                  </div>

                  <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
                         onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
                </div>

                {/* Format example */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="font-pixel text-[#4B5563] mb-2" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                    ПРИМЕР ФОРМАТА
                  </p>
                  <pre className="font-pixel text-[#22C55E]" style={{ fontSize: '11px', lineHeight: '1.8' }}>
{`game_id,key
cm_abc123,AAAAA-BBBBB-CCCCC
cm_abc123,DDDDD-EEEEE-FFFFF
cm_xyz789,GGGGG-HHHHH-IIIII`}
                  </pre>
                </div>
              </motion.div>
            )}

            {/* ════ STEP: PREVIEW ════ */}
            {step === 'preview' && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="p-6 space-y-5">
                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3">
                  <Pill label="Всего строк"  value={rows.length}   color="#9CA3AF" />
                  <Pill label="Валидных"     value={validCount}    color="#22C55E" />
                  <Pill label="Дублей"       value={rows.filter(r => r.status === 'duplicate_csv').length} color="#F59E0B" />
                  <Pill label="Неверных"     value={invalidRows.filter(r => r.status !== 'duplicate_csv').length} color="#EF4444" />
                </div>

                {/* Games summary */}
                {groups.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-pixel text-[#4B5563]" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                      ИГРЫ ДЛЯ ИМПОРТА ({groups.length})
                    </p>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      {groups.map(g => (
                        <div key={g.gameId}
                             className="flex items-center justify-between px-3 py-2 rounded-xl"
                             style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}>
                          <span className="font-pixel text-[#9CA3AF]" style={{ fontSize: '10px' }}>{g.gameId}</span>
                          <span className="font-pixel text-[#22C55E]" style={{ fontSize: '10px' }}>
                            {g.total} ключей
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key type */}
                <div>
                  <p className="font-body text-[#6B7280] mb-2" style={{ fontSize: '11px' }}>Тип ключей</p>
                  <div className="flex gap-2">
                    {TYPE_OPTS.map(opt => (
                      <button key={opt.value} onClick={() => setKeyType(opt.value)}
                              className="flex-1 rounded-xl p-3 text-left transition-all duration-200"
                              style={{
                                background: keyType === opt.value ? `${opt.color}12` : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${keyType === opt.value ? `${opt.color}35` : 'rgba(255,255,255,0.07)'}`,
                              }}>
                        <p className="font-pixel" style={{ fontSize: '9px', letterSpacing: '0.06em',
                          color: keyType === opt.value ? opt.color : '#4B5563' }}>{opt.label}</p>
                        <p className="font-body mt-0.5" style={{ fontSize: '10px',
                          color: keyType === opt.value ? '#9CA3AF' : '#374151' }}>{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview table */}
                <div>
                  <p className="font-pixel text-[#4B5563] mb-2" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                    ПРЕДПРОСМОТР (первые {Math.min(rows.length, 30)} строк)
                  </p>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="grid" style={{ gridTemplateColumns: '48px 1fr 1fr 100px' }}>
                      {/* Header */}
                      {['#', 'GAME ID', 'KEY', 'СТАТУС'].map(h => (
                        <div key={h} className="px-3 py-2 font-pixel text-[#374151]"
                             style={{ fontSize: '8px', letterSpacing: '0.08em',
                                      background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {h}
                        </div>
                      ))}
                      {/* Rows */}
                      {rows.slice(0, 30).map(row => {
                        const cfg = STATUS_CFG[row.status];
                        return [
                          <div key={`${row.lineNum}-n`} className="px-3 py-2 font-pixel text-[#374151]"
                               style={{ fontSize: '10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            {row.lineNum}
                          </div>,
                          <div key={`${row.lineNum}-g`} className="px-3 py-2 font-pixel text-[#9CA3AF] truncate"
                               style={{ fontSize: '10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            {row.gameId || '—'}
                          </div>,
                          <div key={`${row.lineNum}-k`} className="px-3 py-2 font-pixel truncate"
                               style={{ fontSize: '10px', color: row.status === 'valid' ? '#22C55E' : '#6B7280',
                                        borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            {row.key || row.raw}
                          </div>,
                          <div key={`${row.lineNum}-s`} className="px-3 py-2"
                               style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <span className="font-pixel rounded-md px-1.5 py-0.5"
                                  style={{ fontSize: '7px', color: cfg.color, background: cfg.bg,
                                           border: `1px solid ${cfg.color}25` }}>
                              {cfg.label}
                            </span>
                          </div>,
                        ];
                      })}
                    </div>
                    {rows.length > 30 && (
                      <div className="px-3 py-2 text-center font-body text-[#374151]"
                           style={{ fontSize: '10px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        ... ещё {rows.length - 30} строк
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════ STEP: IMPORTING ════ */}
            {step === 'import' && (
              <motion.div key="import" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="p-6 space-y-4">
                <div className="text-center py-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 rounded-full border-2 mx-auto mb-4"
                    style={{ borderColor: 'rgba(124,58,237,0.2)', borderTopColor: '#7C3AED' }}
                  />
                  <p className="font-heading font-semibold text-white" style={{ fontSize: '15px' }}>
                    Импортируем ключи...
                  </p>
                  <p className="font-body text-[#4B5563] mt-1" style={{ fontSize: '12px' }}>
                    {progress.filter(p => p.status === 'done').length} из {progress.length} игр завершено
                  </p>
                </div>

                {/* Progress per game */}
                <div className="space-y-2">
                  {progress.map(p => (
                    <div key={p.gameId}
                         className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300"
                         style={{
                           background: p.status === 'done'      ? 'rgba(34,197,94,0.06)'    :
                                       p.status === 'importing'  ? 'rgba(124,58,237,0.07)'   :
                                       p.status === 'error'      ? 'rgba(239,68,68,0.07)'    :
                                                                   'rgba(255,255,255,0.03)',
                           border:     p.status === 'done'      ? '1px solid rgba(34,197,94,0.15)'   :
                                       p.status === 'importing'  ? '1px solid rgba(124,58,237,0.2)'  :
                                       p.status === 'error'      ? '1px solid rgba(239,68,68,0.15)'  :
                                                                   '1px solid rgba(255,255,255,0.06)',
                         }}>
                      <div className="flex-shrink-0">
                        {p.status === 'done'      && <CheckCircle2 style={{ width: '14px', height: '14px', color: '#22C55E' }} />}
                        {p.status === 'importing' && <Spinner />}
                        {p.status === 'error'     && <AlertCircle  style={{ width: '14px', height: '14px', color: '#EF4444' }} />}
                        {p.status === 'pending'   && <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />}
                      </div>
                      <span className="font-pixel text-[#9CA3AF] flex-1 truncate" style={{ fontSize: '10px' }}>
                        {p.gameId}
                      </span>
                      {p.result && (
                        <div className="flex gap-3 text-right flex-shrink-0">
                          <span className="font-pixel text-[#22C55E]" style={{ fontSize: '10px' }}>
                            +{p.result.imported}
                          </span>
                          {p.result.duplicates > 0 && (
                            <span className="font-pixel text-[#F59E0B]" style={{ fontSize: '10px' }}>
                              ~{p.result.duplicates} дубль
                            </span>
                          )}
                        </div>
                      )}
                      {p.error && (
                        <span className="font-body text-[#F87171] flex-shrink-0" style={{ fontSize: '10px' }}>{p.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ════ STEP: DONE ════ */}
            {step === 'done' && totalResult && (
              <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }} className="p-6 space-y-5">
                {/* Success header */}
                <div className="flex items-center gap-3 rounded-xl px-4 py-4"
                     style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)' }}>
                  <CheckCircle2 style={{ width: '20px', height: '20px', color: '#22C55E', flexShrink: 0 }} />
                  <div>
                    <p className="font-heading font-semibold text-[#22C55E]" style={{ fontSize: '14px' }}>
                      Импорт завершён
                    </p>
                    <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
                      Ключи сохранены и зашифрованы в базе данных
                    </p>
                  </div>
                </div>

                {/* Result pillars */}
                <div className="grid grid-cols-4 gap-3">
                  <Pill label="Добавлено"  value={totalResult.imported}   color="#22C55E" />
                  <Pill label="Дублей"     value={totalResult.duplicates} color="#F59E0B" />
                  <Pill label="Неверных"   value={totalResult.invalid}    color="#EF4444" />
                  <Pill label="Обработано" value={totalResult.total}      color="#9CA3AF" />
                </div>

                {/* Per-game summary */}
                <div className="space-y-2">
                  <p className="font-pixel text-[#4B5563]" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                    РЕЗУЛЬТАТ ПО ИГРАМ
                  </p>
                  {progress.map(p => (
                    <div key={p.gameId}
                         className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                         style={{ background: p.status === 'error' ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${p.status === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)'}` }}>
                      <div className="flex items-center gap-2">
                        {p.status === 'done'
                          ? <CheckCircle2 style={{ width: '12px', height: '12px', color: '#22C55E' }} />
                          : <AlertCircle  style={{ width: '12px', height: '12px', color: '#EF4444' }} />}
                        <span className="font-pixel text-[#9CA3AF]" style={{ fontSize: '10px' }}>{p.gameId}</span>
                      </div>
                      {p.result && (
                        <div className="flex gap-4">
                          <span className="font-pixel text-[#22C55E]" style={{ fontSize: '10px' }}>
                            +{p.result.imported} добавлено
                          </span>
                          {p.result.duplicates > 0 && (
                            <span className="font-pixel text-[#F59E0B]" style={{ fontSize: '10px' }}>
                              {p.result.duplicates} дубль
                            </span>
                          )}
                        </div>
                      )}
                      {p.error && <span className="font-body text-[#F87171]" style={{ fontSize: '10px' }}>{p.error}</span>}
                    </div>
                  ))}
                </div>

                {/* Invalid rows collapsible */}
                {invalidRows.length > 0 && (
                  <div className="rounded-xl overflow-hidden"
                       style={{ border: '1px solid rgba(239,68,68,0.18)' }}>
                    <button
                      onClick={() => setShowInvalid(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 transition-colors"
                      style={{ background: 'rgba(239,68,68,0.07)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.07)')}
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle style={{ width: '13px', height: '13px', color: '#EF4444' }} />
                        <span className="font-heading font-semibold text-[#F87171]" style={{ fontSize: '12px' }}>
                          {invalidRows.length} строк пропущено
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); copyInvalid(); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg font-body transition-all"
                          style={{ background: 'rgba(239,68,68,0.1)', fontSize: '10px',
                                   color: copied ? '#22C55E' : '#F87171',
                                   border: `1px solid ${copied ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}
                        >
                          {copied
                            ? <><ClipboardCheck style={{ width: '10px', height: '10px' }} /> Скопировано</>
                            : <><Copy style={{ width: '10px', height: '10px' }} /> Копировать</>}
                        </button>
                        {showInvalid
                          ? <ChevronUp  style={{ width: '14px', height: '14px', color: '#EF4444' }} />
                          : <ChevronDown style={{ width: '14px', height: '14px', color: '#EF4444' }} />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {showInvalid && (
                        <motion.div
                          initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="max-h-48 overflow-y-auto">
                            {invalidRows.map(r => {
                              const cfg = STATUS_CFG[r.status];
                              return (
                                <div key={`${r.lineNum}-invalid`}
                                     className="flex items-center gap-3 px-4 py-2"
                                     style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                  <span className="font-pixel text-[#4B5563] w-8 flex-shrink-0" style={{ fontSize: '9px' }}>
                                    #{r.lineNum}
                                  </span>
                                  <span className="font-pixel text-[#6B7280] flex-1 truncate" style={{ fontSize: '10px' }}>
                                    {r.raw}
                                  </span>
                                  <span className="font-pixel rounded px-1.5 py-0.5 flex-shrink-0"
                                        style={{ fontSize: '7px', color: cfg.color,
                                                 background: cfg.bg, border: `1px solid ${cfg.color}25` }}>
                                    {cfg.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
             style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            {step === 'preview' && (
              <button
                onClick={() => { setStep('upload'); setRows([]); }}
                className="px-4 py-2 rounded-xl font-body transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#6B7280', fontSize: '12px' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              >
                ← Другой файл
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {step !== 'import' && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl font-body transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#6B7280', fontSize: '12px' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              >
                {step === 'done' ? 'Закрыть' : 'Отмена'}
              </button>
            )}

            {step === 'preview' && validCount > 0 && (
              <button
                onClick={startImport}
                className="flex items-center gap-2 px-5 py-2 rounded-xl font-body transition-all"
                style={{ background: 'rgba(124,58,237,0.9)', color: '#fff', fontSize: '12px',
                         boxShadow: '0 0 20px rgba(124,58,237,0.35)' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 28px rgba(124,58,237,0.5)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(124,58,237,0.35)')}
              >
                <Upload style={{ width: '13px', height: '13px' }} />
                Импортировать {validCount} ключей
                <ArrowRight style={{ width: '13px', height: '13px' }} />
              </button>
            )}

            {step === 'preview' && validCount === 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl font-body"
                   style={{ background: 'rgba(239,68,68,0.08)', color: '#F87171',
                            border: '1px solid rgba(239,68,68,0.2)', fontSize: '12px' }}>
                <AlertCircle style={{ width: '13px', height: '13px' }} />
                Нет валидных ключей
              </div>
            )}

            {step === 'done' && (
              <button
                onClick={() => { setStep('upload'); setRows([]); setProgress([]); setTotalResult(null); }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl font-body transition-all"
                style={{ background: 'rgba(124,58,237,0.9)', color: '#fff', fontSize: '12px',
                         boxShadow: '0 0 20px rgba(124,58,237,0.35)' }}
              >
                <Upload style={{ width: '13px', height: '13px' }} />
                Ещё один импорт
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
