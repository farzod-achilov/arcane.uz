'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, FileSpreadsheet, Upload, CheckCircle2,
  AlertCircle, AlertTriangle, ChevronDown, ChevronUp,
  Copy, ClipboardCheck, KeyRound, ArrowRight, Loader2,
  RefreshCw, Info,
} from 'lucide-react';
import type { BulkImportResult } from '@/app/api/keys/bulk-import/route';

// ── CSV parser ────────────────────────────────────────────────────────────────

const STEAM_KEY_RE = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/i;

type RowStatus = 'valid' | 'invalid_key' | 'invalid_row' | 'duplicate_csv';

interface ParsedRow {
  lineNum: number;
  gameId:  string;
  key:     string;
  status:  RowStatus;
  raw:     string;
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/);
  const rows: ParsedRow[] = [];
  const seen = new Set<string>();
  let start = 0;
  if (lines[0]?.toLowerCase().includes('game_id')) start = 1;

  for (let i = start; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    const parts = raw.split(',');
    if (parts.length < 2) { rows.push({ lineNum: i + 1, gameId: '', key: '', status: 'invalid_row', raw }); continue; }
    const gameId = parts[0].trim();
    const key    = parts[1].trim().toUpperCase();
    if (!gameId || !key) { rows.push({ lineNum: i + 1, gameId, key, status: 'invalid_row', raw }); continue; }
    if (!STEAM_KEY_RE.test(key)) { rows.push({ lineNum: i + 1, gameId, key, status: 'invalid_key', raw }); continue; }
    const dedup = `${gameId}::${key}`;
    if (seen.has(dedup)) { rows.push({ lineNum: i + 1, gameId, key, status: 'duplicate_csv', raw }); continue; }
    seen.add(dedup);
    rows.push({ lineNum: i + 1, gameId, key, status: 'valid', raw });
  }
  return rows;
}

interface GameGroup { gameId: string; keys: string[]; count: number }

function groupByGame(rows: ParsedRow[]): GameGroup[] {
  const map = new Map<string, string[]>();
  for (const r of rows) {
    if (r.status !== 'valid') continue;
    const arr = map.get(r.gameId) ?? [];
    arr.push(r.key);
    map.set(r.gameId, arr);
  }
  return Array.from(map.entries()).map(([gameId, keys]) => ({ gameId, keys, count: keys.length }));
}

// ── Types ─────────────────────────────────────────────────────────────────────

type KeyType = 'STORE' | 'DROP' | 'BOTH';
type Phase   = 'upload' | 'preview' | 'importing' | 'done';

interface GameProgress {
  gameId: string;
  status: 'pending' | 'running' | 'done' | 'error';
  result?: BulkImportResult;
  error?:  string;
}

const STATUS_CFG = {
  valid:        { label: 'Валидный',       color: '#22C55E', bg: 'rgba(34,197,94,0.07)'   },
  invalid_key:  { label: 'Неверный ключ',  color: '#EF4444', bg: 'rgba(239,68,68,0.07)'   },
  invalid_row:  { label: 'Неверная строка',color: '#EF4444', bg: 'rgba(239,68,68,0.07)'   },
  duplicate_csv:{ label: 'Дубль в файле',  color: '#F59E0B', bg: 'rgba(245,158,11,0.07)'  },
} as const;

const TYPE_OPTS: { value: KeyType; label: string; desc: string; color: string }[] = [
  { value: 'BOTH',  label: 'BOTH',  desc: 'Магазин + дропы',    color: '#9D60FA' },
  { value: 'STORE', label: 'STORE', desc: 'Только магазин',     color: '#06B6D4' },
  { value: 'DROP',  label: 'DROP',  desc: 'Только дроп-машины', color: '#F59E0B' },
];

// ── UI helpers ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden"
         style={{ background: '#0A0A14', border: `1px solid ${color}18` }}>
      <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
           style={{ background: `radial-gradient(circle at top right, ${color}10, transparent 70%)` }} />
      <p className="font-heading font-bold mb-0.5" style={{ fontSize: '28px', color, letterSpacing: '-0.02em' }}>
        {value.toLocaleString('ru')}
      </p>
      <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>{label}</p>
      {sub && <p className="font-body text-[#374151] mt-0.5" style={{ fontSize: '10px' }}>{sub}</p>}
    </div>
  );
}

function GameProgressRow({ p, index }: { p: GameProgress; index: number }) {
  const done    = p.status === 'done';
  const running = p.status === 'running';
  const errored = p.status === 'error';
  const pending = p.status === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300"
      style={{
        background: done    ? 'rgba(34,197,94,0.05)'    :
                    running  ? 'rgba(124,58,237,0.07)'   :
                    errored  ? 'rgba(239,68,68,0.06)'    :
                               'rgba(255,255,255,0.02)',
        border:     done    ? '1px solid rgba(34,197,94,0.14)'   :
                    running  ? '1px solid rgba(124,58,237,0.22)'  :
                    errored  ? '1px solid rgba(239,68,68,0.14)'   :
                               '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Status icon */}
      <div className="flex-shrink-0 w-6 flex items-center justify-center">
        {done    && <CheckCircle2 style={{ width: '16px', height: '16px', color: '#22C55E' }} />}
        {errored && <AlertCircle  style={{ width: '16px', height: '16px', color: '#EF4444' }} />}
        {running && (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 rounded-full border-2"
                      style={{ borderColor: 'rgba(124,58,237,0.3)', borderTopColor: '#7C3AED' }} />
        )}
        {pending && <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />}
      </div>

      {/* Game ID */}
      <span className="font-pixel text-[#9CA3AF] flex-1 truncate" style={{ fontSize: '11px' }}>{p.gameId}</span>

      {/* Stats */}
      {p.result && (
        <div className="flex items-center gap-4 text-right flex-shrink-0">
          <div>
            <span className="font-heading font-bold" style={{ fontSize: '15px', color: '#22C55E' }}>
              +{p.result.imported}
            </span>
            <span className="font-body text-[#374151] ml-1" style={{ fontSize: '10px' }}>добавлено</span>
          </div>
          {p.result.duplicates > 0 && (
            <div>
              <span className="font-heading font-bold" style={{ fontSize: '13px', color: '#F59E0B' }}>
                {p.result.duplicates}
              </span>
              <span className="font-body text-[#374151] ml-1" style={{ fontSize: '10px' }}>дубль</span>
            </div>
          )}
        </div>
      )}
      {p.error && <span className="font-body text-[#F87171] text-right" style={{ fontSize: '11px' }}>{p.error}</span>}
      {pending && <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>В очереди...</span>}
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BulkImportPage() {
  const [phase,       setPhase]       = useState<Phase>('upload');
  const [isDragging,  setIsDragging]  = useState(false);
  const [fileName,    setFileName]    = useState('');
  const [rows,        setRows]        = useState<ParsedRow[]>([]);
  const [keyType,     setKeyType]     = useState<KeyType>('BOTH');
  const [progress,    setProgress]    = useState<GameProgress[]>([]);
  const [finalResult, setFinalResult] = useState<BulkImportResult | null>(null);
  const [showInvalid, setShowInvalid] = useState(false);
  const [copied,      setCopied]      = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const groups     = useMemo(() => groupByGame(rows), [rows]);
  const validCount = useMemo(() => rows.filter(r => r.status === 'valid').length, [rows]);
  const invalidRows = useMemo(() => rows.filter(r => r.status !== 'valid'), [rows]);
  const dupCount   = useMemo(() => rows.filter(r => r.status === 'duplicate_csv').length, [rows]);
  const errCount   = useMemo(() => rows.filter(r => r.status === 'invalid_key' || r.status === 'invalid_row').length, [rows]);

  const loadFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      setRows(parseCsv((e.target?.result as string) ?? ''));
      setFileName(file.name);
      setPhase('preview');
    };
    reader.readAsText(file, 'utf-8');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, [loadFile]);

  const startImport = async () => {
    if (groups.length === 0) return;
    const init: GameProgress[] = groups.map(g => ({ gameId: g.gameId, status: 'pending' }));
    setProgress(init);
    setPhase('importing');

    const tot: BulkImportResult = { imported: 0, duplicates: 0, invalid: 0, total: 0 };

    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      setProgress(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'running' } : p));
      try {
        const res  = await fetch('/api/keys/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: g.gameId, keys: g.keys, type: keyType }),
        });
        const data = await res.json() as BulkImportResult & { error?: string };
        if (!res.ok || data.error) throw new Error(data.error ?? 'Server error');
        tot.imported   += data.imported;
        tot.duplicates += data.duplicates;
        tot.invalid    += data.invalid;
        tot.total      += data.total;
        setProgress(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'done', result: data } : p));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setProgress(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'error', error: msg } : p));
        tot.total += g.keys.length;
      }
    }

    // Add CSV-level invalids to the totals
    tot.invalid    += errCount;
    tot.duplicates += dupCount;
    tot.total      += invalidRows.length;

    setFinalResult(tot);
    setPhase('done');
  };

  const reset = () => {
    setPhase('upload'); setRows([]); setProgress([]);
    setFinalResult(null); setFileName(''); setShowInvalid(false);
  };

  const copyInvalid = () => {
    navigator.clipboard.writeText(invalidRows.map(r => r.raw).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/admin/keys"
          className="inline-flex items-center gap-1.5 font-body mb-4 transition-colors"
          style={{ fontSize: '12px', color: '#4B5563' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#7C3AED')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}>
          <ChevronLeft style={{ width: '14px', height: '14px' }} />
          Key Inventory
        </Link>
        <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#7C3AED', letterSpacing: '0.14em' }}>
          BULK KEY IMPORT
        </p>
        <h1 className="font-heading font-bold text-white" style={{ fontSize: '24px' }}>
          Массовый импорт ключей
        </h1>
        <p className="font-body text-[#4B5563]" style={{ fontSize: '13px' }}>
          Загрузите CSV с ключами в формате <span className="font-pixel text-[#6B7280]" style={{ fontSize: '11px' }}>game_id,key</span>
        </p>
      </motion.div>

      {/* Step stepper */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 }}
                  className="flex items-center gap-2">
        {[
          { id: 'upload',    label: 'Загрузка',  icon: Upload          },
          { id: 'preview',   label: 'Проверка',  icon: FileSpreadsheet },
          { id: 'importing', label: 'Импорт',    icon: Loader2         },
          { id: 'done',      label: 'Готово',    icon: CheckCircle2    },
        ].map((s, i, arr) => {
          const phases: Phase[] = ['upload', 'preview', 'importing', 'done'];
          const cur  = phases.indexOf(phase);
          const idx  = phases.indexOf(s.id as Phase);
          const done = cur > idx;
          const act  = cur === idx;
          const Icon = s.icon;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300"
                     style={{
                       background: done ? 'rgba(34,197,94,0.15)'    : act ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                       border:     done ? '1px solid rgba(34,197,94,0.3)' : act ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.07)',
                     }}>
                  <Icon style={{ width: '13px', height: '13px',
                    color: done ? '#22C55E' : act ? '#7C3AED' : '#374151' }} />
                </div>
                <span className="font-body" style={{ fontSize: '12px',
                  color: done ? '#22C55E' : act ? '#E2E8F0' : '#374151' }}>
                  {s.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className="w-8 h-px" style={{ background: done ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
          );
        })}
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════════════════
            PHASE: UPLOAD
        ══════════════════════════════════════════════════════ */}
        {phase === 'upload' && (
          <motion.div key="upload"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>

            {/* Main drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="rounded-2xl flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 mb-6"
              style={{
                minHeight: '280px',
                background: isDragging ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.015)',
                border: `2px dashed ${isDragging ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.08)'}`,
              }}
              onMouseEnter={e => { if (!isDragging) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { if (!isDragging) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              <motion.div
                animate={{ scale: isDragging ? 1.1 : 1, y: isDragging ? -6 : 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center relative"
                style={{
                  background: isDragging ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isDragging ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isDragging ? '0 0 32px rgba(124,58,237,0.25)' : 'none',
                }}
              >
                <FileSpreadsheet style={{ width: '32px', height: '32px', color: isDragging ? '#9D60FA' : '#374151' }} />
                {isDragging && (
                  <motion.div
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 rounded-2xl"
                    style={{ border: '2px solid rgba(124,58,237,0.3)' }}
                  />
                )}
              </motion.div>

              <div className="text-center">
                <p className="font-heading font-semibold mb-1.5" style={{ fontSize: '17px',
                  color: isDragging ? '#C4B5FD' : '#9CA3AF' }}>
                  {isDragging ? 'Отпустите для загрузки' : 'Перетащите CSV файл сюда'}
                </p>
                <p className="font-body text-[#4B5563]" style={{ fontSize: '13px' }}>
                  или нажмите для выбора файла
                </p>
                <p className="font-body text-[#374151] mt-1" style={{ fontSize: '11px' }}>
                  Поддерживаются .csv и .txt файлы
                </p>
              </div>

              <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl"
                   style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Upload style={{ width: '14px', height: '14px', color: '#6B7280' }} />
                <span className="font-body text-[#6B7280]" style={{ fontSize: '12px' }}>Выбрать файл</span>
              </div>

              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
                     onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
            </div>

            {/* Format guide */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-5" style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-pixel text-[#4B5563] mb-3" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                  ФОРМАТ CSV
                </p>
                <pre className="font-pixel text-[#22C55E]" style={{ fontSize: '11px', lineHeight: '2' }}>
{`game_id,key
cm_abc123,AAAAA-BBBBB-CCCCC
cm_abc123,DDDDD-EEEEE-FFFFF
cm_xyz789,GGGGG-HHHHH-IIIII`}
                </pre>
              </div>
              <div className="rounded-2xl p-5 space-y-3" style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-pixel text-[#4B5563] mb-3" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                  ПРАВИЛА ИМПОРТА
                </p>
                {[
                  { icon: CheckCircle2, text: 'Первая строка — заголовок (игнорируется)', color: '#22C55E' },
                  { icon: CheckCircle2, text: 'Ключи: формат XXXXX-XXXXX-XXXXX',          color: '#22C55E' },
                  { icon: CheckCircle2, text: 'Дубли внутри файла — автоматически пропускаются', color: '#22C55E' },
                  { icon: Info,         text: 'game_id — ID из базы данных, не slug',     color: '#6B7280' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <item.icon style={{ width: '12px', height: '12px', color: item.color, flexShrink: 0, marginTop: '1px' }} />
                    <p className="font-body" style={{ fontSize: '11px', color: item.color }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            PHASE: PREVIEW
        ══════════════════════════════════════════════════════ */}
        {phase === 'preview' && (
          <motion.div key="preview"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="space-y-5">

            {/* File badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                   style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <FileSpreadsheet style={{ width: '13px', height: '13px', color: '#7C3AED' }} />
                <span className="font-body text-[#9D60FA]" style={{ fontSize: '12px' }}>{fileName}</span>
              </div>
              <button onClick={reset} className="flex items-center gap-1.5 font-body transition-colors"
                      style={{ fontSize: '12px', color: '#4B5563' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}>
                <RefreshCw style={{ width: '12px', height: '12px' }} />
                Другой файл
              </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Строк"      value={rows.length}  sub="в файле"          color="#9CA3AF" />
              <StatCard label="Валидных"   value={validCount}   sub={`${groups.length} игр`} color="#22C55E" />
              <StatCard label="Дублей"     value={dupCount}     sub="будут пропущены"  color="#F59E0B" />
              <StatCard label="Неверных"   value={errCount}     sub="не импортируются" color="#EF4444" />
            </div>

            {/* Key type selector */}
            <div>
              <p className="font-body text-[#6B7280] mb-2" style={{ fontSize: '12px' }}>Тип ключей</p>
              <div className="flex gap-3">
                {TYPE_OPTS.map(opt => (
                  <button key={opt.value} onClick={() => setKeyType(opt.value)}
                          className="flex-1 rounded-xl p-4 text-left transition-all duration-200"
                          style={{
                            background: keyType === opt.value ? `${opt.color}10` : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${keyType === opt.value ? `${opt.color}35` : 'rgba(255,255,255,0.07)'}`,
                          }}>
                    <p className="font-pixel mb-1" style={{ fontSize: '10px', letterSpacing: '0.07em',
                      color: keyType === opt.value ? opt.color : '#374151' }}>{opt.label}</p>
                    <p className="font-body" style={{ fontSize: '11px',
                      color: keyType === opt.value ? '#9CA3AF' : '#374151' }}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Games list */}
            <div>
              <p className="font-pixel text-[#4B5563] mb-2" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                ИГРЫ ДЛЯ ИМПОРТА ({groups.length})
              </p>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {groups.map(g => (
                  <div key={g.gameId}
                       className="flex items-center justify-between px-4 py-3 rounded-xl"
                       style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}>
                    <div className="flex items-center gap-2">
                      <KeyRound style={{ width: '12px', height: '12px', color: '#22C55E' }} />
                      <span className="font-pixel text-[#9CA3AF]" style={{ fontSize: '11px' }}>{g.gameId}</span>
                    </div>
                    <span className="font-heading font-bold text-[#22C55E]" style={{ fontSize: '14px' }}>
                      {g.count} ключей
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview table */}
            <div>
              <p className="font-pixel text-[#4B5563] mb-2" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                ПРЕДПРОСМОТР СТРОК (первые {Math.min(rows.length, 40)})
              </p>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 1fr 110px' }}>
                  {['#', 'GAME ID', 'КЛЮЧ', 'СТАТУС'].map(h => (
                    <div key={h} className="px-3 py-2.5 font-pixel text-[#374151]"
                         style={{ fontSize: '8px', letterSpacing: '0.08em',
                                  background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {h}
                    </div>
                  ))}
                  {rows.slice(0, 40).flatMap(row => {
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
                           style={{ fontSize: '10px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                                    color: row.status === 'valid' ? '#22C55E' : '#4B5563' }}>
                        {row.key || row.raw}
                      </div>,
                      <div key={`${row.lineNum}-s`} className="px-3 py-2"
                           style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span className="font-pixel rounded-md px-2 py-0.5"
                              style={{ fontSize: '7px', color: cfg.color, background: cfg.bg,
                                       border: `1px solid ${cfg.color}25` }}>
                          {cfg.label}
                        </span>
                      </div>,
                    ];
                  })}
                </div>
                {rows.length > 40 && (
                  <div className="px-4 py-2.5 text-center font-body text-[#374151]"
                       style={{ fontSize: '11px', background: 'rgba(255,255,255,0.02)',
                                borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    … ещё {rows.length - 40} строк
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
                {validCount > 0
                  ? `${validCount} ключей для ${groups.length} ${groups.length === 1 ? 'игры' : 'игр'} готовы к импорту`
                  : 'Нет валидных ключей для импорта'}
              </p>
              {validCount > 0 && (
                <button
                  onClick={startImport}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-heading font-semibold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                           fontSize: '13px', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 32px rgba(124,58,237,0.55)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 24px rgba(124,58,237,0.4)')}
                >
                  <Upload style={{ width: '14px', height: '14px' }} />
                  Импортировать {validCount} ключей
                  <ArrowRight style={{ width: '14px', height: '14px' }} />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            PHASE: IMPORTING
        ══════════════════════════════════════════════════════ */}
        {phase === 'importing' && (
          <motion.div key="importing"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="space-y-5">

            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-5 rounded-2xl"
                 style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.18)' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 rounded-full border-2 flex-shrink-0"
                style={{ borderColor: 'rgba(124,58,237,0.2)', borderTopColor: '#7C3AED' }}
              />
              <div>
                <p className="font-heading font-semibold text-white" style={{ fontSize: '15px' }}>
                  Импортируем ключи...
                </p>
                <p className="font-body text-[#6B7280]" style={{ fontSize: '12px' }}>
                  {progress.filter(p => p.status === 'done' || p.status === 'error').length} из {progress.length} игр
                </p>
              </div>
              {/* Mini progress bar */}
              <div className="flex-1 h-1.5 rounded-full overflow-hidden ml-4"
                   style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #7C3AED, #06B6D4)' }}
                  animate={{
                    width: `${(progress.filter(p => p.status === 'done' || p.status === 'error').length / Math.max(progress.length, 1)) * 100}%`,
                  }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {/* Per-game rows */}
            <div className="space-y-2">
              {progress.map((p, i) => <GameProgressRow key={p.gameId} p={p} index={i} />)}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            PHASE: DONE
        ══════════════════════════════════════════════════════ */}
        {phase === 'done' && finalResult && (
          <motion.div key="done"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="space-y-6">

            {/* Success banner */}
            <div className="flex items-center gap-4 px-6 py-5 rounded-2xl"
                 style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(34,197,94,0.15)' }}>
                <CheckCircle2 style={{ width: '20px', height: '20px', color: '#22C55E' }} />
              </div>
              <div>
                <p className="font-heading font-bold text-[#22C55E]" style={{ fontSize: '16px' }}>
                  Импорт завершён
                </p>
                <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
                  Ключи зашифрованы (AES-256-GCM) и сохранены в PostgreSQL. Сток игр обновлён.
                </p>
              </div>
            </div>

            {/* Summary stat cards */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Добавлено"  value={finalResult.imported}   sub="новых ключей"       color="#22C55E" />
              <StatCard label="Дублей"     value={finalResult.duplicates} sub="уже в базе"         color="#F59E0B" />
              <StatCard label="Неверных"   value={finalResult.invalid}    sub="пропущено"          color="#EF4444" />
              <StatCard label="Обработано" value={finalResult.total}      sub="строк всего"        color="#9CA3AF" />
            </div>

            {/* Per-game results */}
            <div>
              <p className="font-pixel text-[#4B5563] mb-3" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                РЕЗУЛЬТАТ ПО ИГРАМ
              </p>
              <div className="space-y-2">
                {progress.map((p, i) => <GameProgressRow key={p.gameId} p={p} index={i} />)}
              </div>
            </div>

            {/* Invalid rows report */}
            {invalidRows.length > 0 && (
              <div className="rounded-2xl overflow-hidden"
                   style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                <button
                  onClick={() => setShowInvalid(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 transition-colors"
                  style={{ background: 'rgba(239,68,68,0.07)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.07)')}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle style={{ width: '15px', height: '15px', color: '#EF4444' }} />
                    <p className="font-heading font-semibold text-[#F87171]" style={{ fontSize: '13px' }}>
                      {invalidRows.length} строк пропущено — нажмите для просмотра
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); copyInvalid(); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body transition-all"
                      style={{
                        background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.12)',
                        color:      copied ? '#22C55E' : '#F87171',
                        border:     `1px solid ${copied ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                        fontSize: '11px',
                      }}
                    >
                      {copied
                        ? <><ClipboardCheck style={{ width: '11px', height: '11px' }} /> Скопировано</>
                        : <><Copy style={{ width: '11px', height: '11px' }} /> Копировать</>}
                    </button>
                    {showInvalid
                      ? <ChevronUp  style={{ width: '16px', height: '16px', color: '#EF4444' }} />
                      : <ChevronDown style={{ width: '16px', height: '16px', color: '#EF4444' }} />}
                  </div>
                </button>

                <AnimatePresence>
                  {showInvalid && (
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="max-h-64 overflow-y-auto">
                        {invalidRows.map(r => {
                          const cfg = STATUS_CFG[r.status];
                          return (
                            <div key={`${r.lineNum}-inv`}
                                 className="flex items-center gap-4 px-5 py-2.5"
                                 style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                              <span className="font-pixel text-[#374151] w-10 flex-shrink-0" style={{ fontSize: '9px' }}>
                                #{r.lineNum}
                              </span>
                              <span className="font-pixel text-[#6B7280] flex-1 truncate" style={{ fontSize: '10px' }}>
                                {r.raw}
                              </span>
                              <span className="font-pixel rounded px-2 py-0.5 flex-shrink-0"
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

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Link href="/admin/keys"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-body transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#9CA3AF',
                         border: '1px solid rgba(255,255,255,0.07)', fontSize: '12px' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              >
                <ChevronLeft style={{ width: '13px', height: '13px' }} />
                Key Inventory
              </Link>
              <button
                onClick={reset}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-heading font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                         fontSize: '13px', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 32px rgba(124,58,237,0.55)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 24px rgba(124,58,237,0.4)')}
              >
                <Upload style={{ width: '14px', height: '14px' }} />
                Ещё один импорт
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
