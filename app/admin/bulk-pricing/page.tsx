'use client';

import { useState } from 'react';
import {
  Layers, Play, CheckCircle2, AlertTriangle, ChevronDown,
  TrendingUp, TrendingDown, Minus, Loader2, Zap,
} from 'lucide-react';

type Strategy = 'GLOBAL' | 'AGGRESSIVE' | 'COMPETITIVE' | 'HIGH_PROFIT';
type Source    = 'all' | 'steam' | 'manual';
type Status    = 'all' | 'active' | 'inactive';

type PreviewItem = {
  id:          string;
  title:       string;
  oldPriceUsd: number;
  newPriceUsd: number;
  oldPriceUzs: number;
  newPriceUzs: number;
  changePct:   number;
  skipped:     boolean;
};

type BulkResult = {
  success:  boolean;
  total:    number;
  affected: number;
  skipped:  number;
  preview:  PreviewItem[];
  dryRun:   boolean;
  error?:   string;
};

const STRATEGIES: { value: Strategy; label: string; desc: string; color: string }[] = [
  { value: 'GLOBAL',      label: 'Глобальная',    desc: 'Стандартная наценка из настроек',          color: '#7C3AED' },
  { value: 'AGGRESSIVE',  label: 'Агрессивная',   desc: 'Максимальная наценка для высокой прибыли', color: '#EF4444' },
  { value: 'COMPETITIVE', label: 'Конкурентная',  desc: 'Сниженная наценка для лучшей цены',        color: '#06B6D4' },
  { value: 'HIGH_PROFIT', label: 'Высокая маржа', desc: 'Повышенная наценка на дорогие игры',       color: '#F59E0B' },
];

function fmt(n: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n));
}

export default function BulkPricingPage() {
  const [strategy, setStrategy] = useState<Strategy>('GLOBAL');
  const [source,   setSource]   = useState<Source>('all');
  const [status,   setStatus]   = useState<Status>('active');
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<BulkResult | null>(null);
  const [applying, setApplying] = useState(false);
  const [done,     setDone]     = useState(false);

  function buildFilters() {
    return {
      ...(source !== 'all'  && { source  }),
      ...(status !== 'all'  && { isActive: status === 'active' }),
    };
  }

  async function handlePreview() {
    setLoading(true);
    setResult(null);
    setDone(false);
    try {
      const res  = await fetch('/api/admin/game/bulk-pricing', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ strategy, filters: buildFilters(), dryRun: true }),
      });
      const data = await res.json() as BulkResult;
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!result) return;
    setApplying(true);
    try {
      const res  = await fetch('/api/admin/game/bulk-pricing', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ strategy, filters: buildFilters(), dryRun: false }),
      });
      const data = await res.json() as BulkResult;
      setResult(data);
      setDone(true);
    } finally {
      setApplying(false);
    }
  }

  const strat = STRATEGIES.find((s) => s.value === strategy)!;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg, #7C3AED22, #7C3AED44)', border: '1px solid #7C3AED44' }}>
          <Layers style={{ width: '18px', height: '18px', color: '#7C3AED' }} />
        </div>
        <div>
          <h1 className="font-heading font-bold text-white text-lg">Массовое ценообразование</h1>
          <p className="text-[#6B7280] text-sm">Применить стратегию сразу к нескольким играм</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: config */}
        <div className="lg:col-span-1 space-y-4">

          {/* Strategy */}
          <div className="rounded-2xl p-4 space-y-3"
               style={{ background: '#12121A', border: '1px solid #1E1E2E' }}>
            <p className="text-xs font-semibold tracking-widest text-[#4B5563] uppercase">Стратегия</p>
            {STRATEGIES.map((s) => (
              <button
                key={s.value}
                onClick={() => { setStrategy(s.value); setResult(null); setDone(false); }}
                className="w-full text-left rounded-xl px-3 py-2.5 transition-all duration-150"
                style={{
                  background: strategy === s.value ? `${s.color}18` : 'transparent',
                  border:     `1px solid ${strategy === s.value ? s.color + '55' : '#1E1E2E'}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                       style={{ background: strategy === s.value ? s.color : '#374151' }} />
                  <span className="font-semibold text-sm"
                        style={{ color: strategy === s.value ? s.color : '#9CA3AF' }}>
                    {s.label}
                  </span>
                </div>
                <p className="text-[11px] text-[#4B5563] mt-0.5 pl-4">{s.desc}</p>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="rounded-2xl p-4 space-y-3"
               style={{ background: '#12121A', border: '1px solid #1E1E2E' }}>
            <p className="text-xs font-semibold tracking-widest text-[#4B5563] uppercase">Фильтры</p>

            <div>
              <label className="text-xs text-[#6B7280] mb-1 block">Источник</label>
              <div className="relative">
                <select
                  value={source}
                  onChange={(e) => { setSource(e.target.value as Source); setResult(null); setDone(false); }}
                  className="w-full rounded-lg px-3 py-2 text-sm appearance-none pr-8"
                  style={{ background: '#1A1A28', border: '1px solid #1E1E2E', color: '#E2E8F0', outline: 'none' }}
                >
                  <option value="all">Все игры</option>
                  <option value="steam">Только Steam</option>
                  <option value="manual">Только Manual</option>
                </select>
                <ChevronDown className="absolute right-2 top-2.5 pointer-events-none" style={{ width: '14px', color: '#6B7280' }} />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#6B7280] mb-1 block">Статус</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value as Status); setResult(null); setDone(false); }}
                  className="w-full rounded-lg px-3 py-2 text-sm appearance-none pr-8"
                  style={{ background: '#1A1A28', border: '1px solid #1E1E2E', color: '#E2E8F0', outline: 'none' }}
                >
                  <option value="all">Все</option>
                  <option value="active">Только активные</option>
                  <option value="inactive">Только неактивные</option>
                </select>
                <ChevronDown className="absolute right-2 top-2.5 pointer-events-none" style={{ width: '14px', color: '#6B7280' }} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={handlePreview}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm transition-all duration-200"
            style={{
              background: '#7C3AED22',
              border:     '1px solid #7C3AED55',
              color:      '#A78BFA',
            }}
          >
            {loading
              ? <><Loader2 className="animate-spin" style={{ width: '15px' }} /> Загрузка...</>
              : <><Play style={{ width: '15px' }} /> Предпросмотр</>}
          </button>

          {result && !done && (
            <button
              onClick={handleApply}
              disabled={applying || result.affected === 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm transition-all duration-200"
              style={{
                background: applying ? '#22C55E11' : 'linear-gradient(135deg, #22C55E22, #16A34A22)',
                border:     '1px solid #22C55E55',
                color:      '#4ADE80',
              }}
            >
              {applying
                ? <><Loader2 className="animate-spin" style={{ width: '15px' }} /> Применяем...</>
                : <><Zap style={{ width: '15px' }} /> Применить к {result.affected} играм</>}
            </button>
          )}
        </div>

        {/* Right: preview */}
        <div className="lg:col-span-2">
          {!result && !loading && (
            <div className="h-64 flex flex-col items-center justify-center rounded-2xl"
                 style={{ background: '#12121A', border: '1px dashed #1E1E2E' }}>
              <Layers style={{ width: '32px', height: '32px', color: '#374151', marginBottom: '12px' }} />
              <p className="text-[#4B5563] text-sm">Выберите параметры и нажмите «Предпросмотр»</p>
            </div>
          )}

          {loading && (
            <div className="h-64 flex items-center justify-center rounded-2xl"
                 style={{ background: '#12121A', border: '1px solid #1E1E2E' }}>
              <Loader2 className="animate-spin" style={{ width: '28px', color: '#7C3AED' }} />
            </div>
          )}

          {result && (
            <div className="rounded-2xl overflow-hidden"
                 style={{ background: '#12121A', border: '1px solid #1E1E2E' }}>

              {/* Summary bar */}
              <div className="px-4 py-3 flex items-center gap-4 flex-wrap"
                   style={{ borderBottom: '1px solid #1E1E2E' }}>
                {done
                  ? <span className="flex items-center gap-1.5 text-sm font-semibold text-green-400">
                      <CheckCircle2 style={{ width: '15px' }} /> Применено к {result.affected} играм
                    </span>
                  : <span className="text-sm font-semibold text-white">
                      Предпросмотр — {result.total} игр
                    </span>}
                <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${strat.color}22`, color: strat.color }}>
                  {strat.label}
                </span>
                {result.skipped > 0 && (
                  <span className="flex items-center gap-1 text-xs text-yellow-500">
                    <AlertTriangle style={{ width: '12px' }} /> {result.skipped} пропущено (нет закупочной цены)
                  </span>
                )}
                <span className="ml-auto text-xs text-[#4B5563]">
                  Показаны первые 50
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1E1E2E' }}>
                      <th className="text-left px-4 py-2.5 text-xs text-[#4B5563] font-semibold uppercase tracking-wider">Игра</th>
                      <th className="text-right px-3 py-2.5 text-xs text-[#4B5563] font-semibold uppercase tracking-wider">Было $</th>
                      <th className="text-right px-3 py-2.5 text-xs text-[#4B5563] font-semibold uppercase tracking-wider">Стало $</th>
                      <th className="text-right px-3 py-2.5 text-xs text-[#4B5563] font-semibold uppercase tracking-wider">Стало сум</th>
                      <th className="text-right px-4 py-2.5 text-xs text-[#4B5563] font-semibold uppercase tracking-wider">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #1A1A28' }}
                          className={item.skipped ? 'opacity-40' : ''}>
                        <td className="px-4 py-2.5 text-[#E2E8F0] max-w-[200px] truncate">
                          {item.title}
                        </td>
                        <td className="px-3 py-2.5 text-right text-[#6B7280] font-mono text-xs">
                          ${item.oldPriceUsd.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold"
                            style={{ color: item.skipped ? '#4B5563' : '#E2E8F0' }}>
                          ${item.newPriceUsd.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-[#9CA3AF]">
                          {fmt(item.newPriceUzs)} сум
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {item.skipped ? (
                            <span className="text-xs text-[#374151]">—</span>
                          ) : item.changePct === 0 ? (
                            <span className="flex items-center justify-end gap-1 text-xs text-[#6B7280]">
                              <Minus style={{ width: '11px' }} /> 0%
                            </span>
                          ) : item.changePct > 0 ? (
                            <span className="flex items-center justify-end gap-1 text-xs text-red-400">
                              <TrendingUp style={{ width: '11px' }} /> +{item.changePct}%
                            </span>
                          ) : (
                            <span className="flex items-center justify-end gap-1 text-xs text-green-400">
                              <TrendingDown style={{ width: '11px' }} /> {item.changePct}%
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
