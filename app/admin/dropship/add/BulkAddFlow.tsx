'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import {
  Search, Loader2, CheckCircle2, XCircle, ExternalLink, X, Pencil, TrendingUp, PackagePlus, AlertTriangle,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { STRATEGY_META } from '@/lib/smartPricing/strategies';
import type { PricingStrategy } from '@/lib/smartPricing/types';

interface KinguinResult {
  kinguinId: number;
  name:      string;
  platform:  string | null;
  cover:     string | null;
  genres:    string[];
  costUsd:   number;
  inStock:   boolean;
}

interface RawgResult {
  rawgId:      number;
  title:       string;
  cover:       string | null;
  screenshots: string[];
  genres:      string[];
  platforms:   string[];
  rating:      number | null;
  releaseDate: string | null;
}

type RawgMatch = RawgResult & { description: string | null };

interface BulkRow {
  kinguin:     KinguinResult;
  rQuery:      string;
  rLoading:    boolean;
  rResults:    RawgResult[] | null;
  rawg:        RawgMatch | null;
  rawgSkipped: boolean;
  editing:     boolean;
  status:      'idle' | 'creating' | 'done' | 'error';
  error?:      string;
  createdSlug?: string;
  createdPriceUzs?: number;
}

const STRATEGIES = Object.keys(STRATEGY_META) as PricingStrategy[];

async function fetchRawgMatch(name: string): Promise<{ results: RawgResult[]; top: RawgMatch | null }> {
  try {
    const res  = await fetch(`/api/rawg/search?q=${encodeURIComponent(name)}&limit=6`);
    const json = await res.json();
    if (!json.success || !json.data?.length) return { results: json.data ?? [], top: null };

    const results: RawgResult[] = json.data;
    const top = results[0];
    let description: string | null = null;
    try {
      const detailRes  = await fetch(`/api/rawg/game/${top.rawgId}`);
      const detailJson = await detailRes.json();
      if (detailJson.success) description = detailJson.data.description || null;
    } catch { /* description необязателен */ }

    return { results, top: { ...top, description } };
  } catch {
    return { results: [], top: null };
  }
}

interface BulkSearchRow {
  query:         string;
  picked:        KinguinResult | null;
  candidates:    KinguinResult[];
  reason?:       string;
  included:      boolean;
  overrideOpen:  boolean;
}

export default function BulkAddFlow() {
  // ── Search stage: множество тайтлов, каждый ищется и подбирается отдельно ──
  const [bulkText,    setBulkText]    = useState('');
  const [bulkLoading,  setBulkLoading]  = useState(false);
  const [bulkRows,     setBulkRows]     = useState<BulkSearchRow[] | null>(null);
  const [bulkError,    setBulkError]    = useState('');

  // ── Review stage ──
  const [stage,    setStage]    = useState<'search' | 'review'>('search');
  const [rows,     setRows]     = useState<BulkRow[]>([]);
  const [strategy, setStrategy] = useState<PricingStrategy>('GLOBAL');
  const [running,  setRunning]  = useState(false);

  const searchBulk = useCallback(async () => {
    const titles = Array.from(new Set(
      bulkText.split('\n').map(t => t.trim()).filter(t => t.length >= 3),
    ));
    if (!titles.length) { setBulkError('Введите хотя бы одно название (от 3 символов), по одному на строку'); return; }
    if (titles.length > 25) { setBulkError('Максимум 25 тайтлов за раз'); return; }

    setBulkLoading(true); setBulkError(''); setBulkRows(null);
    try {
      const res  = await fetch('/api/admin/dropship/bulk-search-kinguin', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ titles }),
      });
      const json = await res.json();
      if (!json.ok) { setBulkError(json.error ?? 'Ошибка поиска'); return; }
      setBulkRows(json.results.map((r: { query: string; picked: KinguinResult | null; candidates: KinguinResult[]; reason?: string }) => ({
        query: r.query, picked: r.picked, candidates: r.candidates, reason: r.reason,
        included: Boolean(r.picked), overrideOpen: false,
      })));
    } catch {
      setBulkError('Ошибка сети');
    } finally {
      setBulkLoading(false);
    }
  }, [bulkText]);

  const updateBulkRow = (query: string, patch: Partial<BulkSearchRow>) => {
    setBulkRows(prev => prev?.map(r => r.query === query ? { ...r, ...patch } : r) ?? null);
  };

  const bulkIncludedCount = bulkRows?.filter(r => r.included && r.picked).length ?? 0;

  const startReview = async () => {
    const picked = (bulkRows ?? [])
      .filter(r => r.included && r.picked)
      .map(r => r.picked as KinguinResult);
    if (!picked.length) return;

    setRows(picked.map(k => ({
      kinguin: k, rQuery: k.name, rLoading: true, rResults: null,
      rawg: null, rawgSkipped: false, editing: false, status: 'idle',
    })));
    setStage('review');

    // RAWG matching — Kinguin's own listing name is a supplier SKU label
    // ("Grand Theft Auto V PC Rockstar Digital Download CD Key"), not
    // storefront copy, same reason the single-add flow requires a RAWG
    // match. Fired in parallel and each row updates independently once
    // its own lookup resolves — safe since updates are keyed by kinguinId.
    picked.forEach(k => {
      fetchRawgMatch(k.name).then(({ results, top }) => {
        setRows(prev => prev.map(r => r.kinguin.kinguinId === k.kinguinId
          ? { ...r, rLoading: false, rResults: results, rawg: top }
          : r));
      });
    });
  };

  const updateRow = (kinguinId: number, patch: Partial<BulkRow>) => {
    setRows(prev => prev.map(r => r.kinguin.kinguinId === kinguinId ? { ...r, ...patch } : r));
  };

  const removeRow = (kinguinId: number) => {
    setRows(prev => prev.filter(r => r.kinguin.kinguinId !== kinguinId));
  };

  const researchRow = async (kinguinId: number, query: string) => {
    if (query.trim().length < 3) return;
    updateRow(kinguinId, { rLoading: true, rResults: null });
    const { results } = await fetchRawgMatch(query);
    updateRow(kinguinId, { rLoading: false, rResults: results });
  };

  const pickRowRawg = async (kinguinId: number, r: RawgResult) => {
    updateRow(kinguinId, { rawg: { ...r, description: null }, rawgSkipped: false, editing: false });
    try {
      const res  = await fetch(`/api/rawg/game/${r.rawgId}`);
      const json = await res.json();
      if (json.success) {
        setRows(prev => prev.map(row => row.kinguin.kinguinId === kinguinId
          ? { ...row, rawg: row.rawg ? { ...row.rawg, description: json.data.description || null, screenshots: json.data.screenshots?.length ? json.data.screenshots : row.rawg.screenshots } : row.rawg }
          : row));
      }
    } catch { /* описание необязательно */ }
  };

  const readyToRun = rows.length > 0 && rows.every(r => r.rawg || r.rawgSkipped) && !running;
  const pendingCount = rows.filter(r => r.status !== 'done').length;

  const runBulk = async (onlyFailed = false) => {
    setRunning(true);
    for (const row of rows) {
      if (row.status === 'done') continue;
      if (onlyFailed && row.status !== 'error') continue;
      if (!row.rawg && !row.rawgSkipped) continue;

      updateRow(row.kinguin.kinguinId, { status: 'creating', error: undefined });
      try {
        const res = await fetch('/api/admin/dropship/create', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title:         row.kinguin.name,
            kinguinId:     row.kinguin.kinguinId,
            costUsd:       row.kinguin.costUsd,
            cover:         row.kinguin.cover,
            genres:        row.kinguin.genres,
            platforms:     row.kinguin.platform ? [row.kinguin.platform] : ['PC'],
            strategy,
            rawgId:          row.rawg?.rawgId ?? null,
            rawgTitle:       row.rawg?.title ?? null,
            rawgCover:       row.rawg?.cover ?? null,
            rawgScreenshots: row.rawg?.screenshots ?? [],
            rawgGenres:      row.rawg?.genres ?? [],
            rawgPlatforms:   row.rawg?.platforms ?? [],
            rawgRating:      row.rawg?.rating ?? null,
            rawgReleaseDate: row.rawg?.releaseDate ?? null,
            rawgDescription: row.rawg?.description ?? null,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          updateRow(row.kinguin.kinguinId, { status: 'error', error: json.error ?? 'Ошибка создания' });
          continue;
        }
        updateRow(row.kinguin.kinguinId, { status: 'done', createdSlug: json.game.slug, createdPriceUzs: json.game.priceUzs });
      } catch {
        updateRow(row.kinguin.kinguinId, { status: 'error', error: 'Ошибка сети' });
      }
    }
    setRunning(false);
  };

  const reset = () => {
    setBulkText(''); setBulkRows(null); setBulkError('');
    setRows([]); setStage('search');
  };

  const doneCount  = rows.filter(r => r.status === 'done').length;
  const errorCount = rows.filter(r => r.status === 'error').length;
  const allSettled = rows.length > 0 && rows.every(r => r.status === 'done' || r.status === 'error');

  if (stage === 'search') {
    return (
      <div className="rounded-2xl p-5 mb-4" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="font-body text-[#9CA3AF] mb-1" style={{ fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Список игр — по одному названию на строку
        </p>
        <p className="font-body text-[#4B5563] mb-3" style={{ fontSize: '11.5px' }}>
          Каждая строка ищется на Kinguin отдельно и подбирается автоматически (только Steam, в наличии, без DLC/бонусов)
        </p>
        <textarea
          value={bulkText}
          onChange={e => setBulkText(e.target.value)}
          placeholder={'Hollow Knight\nCyberpunk 2077\nStardew Valley'}
          rows={5}
          className="w-full rounded-xl px-4 py-3 font-body text-white text-sm outline-none resize-y"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        <button onClick={searchBulk} disabled={bulkLoading}
          className="w-full mt-2.5 flex items-center justify-center gap-2 rounded-xl py-2.5 font-heading font-semibold text-sm text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
          {bulkLoading ? <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" /> : <Search style={{ width: '14px', height: '14px' }} />}
          {bulkLoading ? 'Ищу на Kinguin…' : 'Искать'}
        </button>
        {bulkError && (
          <p className="font-body mt-2.5" style={{ fontSize: '12px', color: '#FCA5A5' }}>{bulkError}</p>
        )}

        {bulkRows && (
          <div className="mt-4 space-y-2">
            {bulkRows.map(row => (
              <div key={row.query} className="rounded-xl p-3"
                   style={{
                     background: row.picked ? 'rgba(255,255,255,0.02)' : 'rgba(245,158,11,0.05)',
                     border: `1px solid ${row.picked ? 'rgba(255,255,255,0.06)' : 'rgba(245,158,11,0.2)'}`,
                     opacity: row.picked && !row.included ? 0.5 : 1,
                   }}>
                {row.picked ? (
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={row.included}
                      onChange={e => updateBulkRow(row.query, { included: e.target.checked })}
                      className="flex-shrink-0" />
                    {row.picked.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.picked.cover} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ background: 'rgba(124,58,237,0.1)' }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-white truncate" style={{ fontSize: '12.5px' }}>{row.picked.name}</p>
                      <p className="font-body text-[#4B5563] truncate" style={{ fontSize: '10.5px' }}>по запросу «{row.query}»</p>
                    </div>
                    <span className="font-heading font-bold flex-shrink-0" style={{ fontSize: '13px', color: '#F59E0B' }}>
                      ${row.picked.costUsd.toFixed(2)}
                    </span>
                    <button onClick={() => updateBulkRow(row.query, { overrideOpen: !row.overrideOpen })}
                      className="p-1.5 rounded-lg flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <Pencil style={{ width: '12px', height: '12px', color: '#9CA3AF' }} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle style={{ width: '15px', height: '15px', color: '#F59E0B', flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-white truncate" style={{ fontSize: '12.5px' }}>«{row.query}»</p>
                      <p className="font-body text-[#F59E0B]" style={{ fontSize: '10.5px' }}>{row.reason}</p>
                    </div>
                    {row.candidates.length > 0 && (
                      <button onClick={() => updateBulkRow(row.query, { overrideOpen: !row.overrideOpen })}
                        className="rounded-lg px-2.5 py-1.5 font-body flex-shrink-0" style={{ fontSize: '11px', color: '#9CA3AF', background: 'rgba(255,255,255,0.04)' }}>
                        Показать {row.candidates.length}
                      </button>
                    )}
                  </div>
                )}

                {row.overrideOpen && (
                  <div className="mt-2.5 pt-2.5 space-y-1.5 max-h-56 overflow-y-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {row.candidates.length === 0 ? (
                      <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>Других вариантов нет</p>
                    ) : row.candidates.map(c => (
                      <button key={c.kinguinId}
                        onClick={() => updateBulkRow(row.query, { picked: c, included: true, overrideOpen: false })}
                        className="w-full flex items-center gap-2 rounded-lg p-1.5 text-left"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {c.cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.cover} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                        ) : <div className="w-7 h-7 rounded flex-shrink-0" style={{ background: 'rgba(124,58,237,0.1)' }} />}
                        <span className="flex-1 font-body text-white truncate" style={{ fontSize: '11.5px' }}>{c.name}</span>
                        <span className="font-body flex-shrink-0" style={{ fontSize: '11px', color: c.inStock ? '#22C55E' : '#EF4444' }}>
                          {c.platform ?? '—'} · ${c.costUsd.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {bulkRows && (
          <button onClick={startReview} disabled={bulkIncludedCount === 0}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl py-3 font-heading font-bold text-white text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 0 24px rgba(124,58,237,0.25)' }}>
            <PackagePlus style={{ width: '15px', height: '15px' }} />
            Далее: подобрать обложки ({bulkIncludedCount})
          </button>
        )}
      </div>
    );
  }

  // ── Review stage ──
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setStage('search')} disabled={running}
          className="font-body text-[#6B7280] disabled:opacity-50" style={{ fontSize: '12px' }}>
          ← Назад к поиску
        </button>
        <span className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>{rows.length} игр в очереди</span>
      </div>

      <div className="space-y-2 mb-4">
        {rows.map(row => (
          <div key={row.kinguin.kinguinId} className="rounded-2xl p-4"
               style={{
                 background: '#0D0D16',
                 border: `1px solid ${
                   row.status === 'done' ? 'rgba(34,197,94,0.3)'
                   : row.status === 'error' ? 'rgba(239,68,68,0.3)'
                   : row.rawg ? 'rgba(255,255,255,0.07)'
                   : row.rawgSkipped ? 'rgba(245,158,11,0.3)'
                   : 'rgba(255,255,255,0.07)'
                 }`,
               }}>
            <div className="flex items-center gap-3">
              {(row.rawg?.cover ?? row.kinguin.cover) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.rawg?.cover ?? row.kinguin.cover ?? ''} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-lg flex-shrink-0" style={{ background: 'rgba(124,58,237,0.1)' }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-body text-white truncate" style={{ fontSize: '13.5px' }}>
                  {row.rawg?.title ?? row.kinguin.name}
                </p>
                <p className="font-body text-[#4B5563] truncate" style={{ fontSize: '11px' }}>
                  Kinguin: {row.kinguin.name} · ${row.kinguin.costUsd.toFixed(2)}
                </p>
              </div>

              {row.status === 'creating' && <Loader2 style={{ width: '16px', height: '16px', color: '#7C3AED' }} className="animate-spin flex-shrink-0" />}
              {row.status === 'done' && <CheckCircle2 style={{ width: '18px', height: '18px', color: '#22C55E' }} className="flex-shrink-0" />}
              {row.status === 'error' && <XCircle style={{ width: '18px', height: '18px', color: '#EF4444' }} className="flex-shrink-0" />}

              {row.status === 'idle' && (
                <>
                  <button onClick={() => updateRow(row.kinguin.kinguinId, { editing: !row.editing })}
                    className="p-1.5 rounded-lg flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <Pencil style={{ width: '13px', height: '13px', color: '#9CA3AF' }} />
                  </button>
                  <button onClick={() => removeRow(row.kinguin.kinguinId)}
                    className="p-1.5 rounded-lg flex-shrink-0" style={{ background: 'rgba(239,68,68,0.08)' }}>
                    <X style={{ width: '13px', height: '13px', color: '#F87171' }} />
                  </button>
                </>
              )}
            </div>

            {row.rLoading && (
              <p className="font-body mt-2" style={{ fontSize: '11px', color: '#6B7280' }}>Ищу в RAWG…</p>
            )}
            {!row.rLoading && !row.rawg && !row.rawgSkipped && row.status === 'idle' && (
              <div className="mt-2.5 flex items-center gap-2">
                <p className="font-body" style={{ fontSize: '11px', color: '#F59E0B' }}>Не найдено в RAWG —</p>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={row.rawgSkipped}
                    onChange={e => updateRow(row.kinguin.kinguinId, { rawgSkipped: e.target.checked })} />
                  <span className="font-body" style={{ fontSize: '11px', color: '#F59E0B' }}>пропустить (данные с Kinguin как есть)</span>
                </label>
              </div>
            )}
            {row.error && (
              <p className="font-body mt-2" style={{ fontSize: '11.5px', color: '#FCA5A5' }}>{row.error}</p>
            )}
            {row.status === 'done' && row.createdSlug && (
              <Link href={`/games/${row.createdSlug}`} target="_blank"
                className="inline-flex items-center gap-1 mt-2 font-body" style={{ fontSize: '11.5px', color: '#06B6D4' }}>
                Смотреть {row.createdPriceUzs != null && `· ${formatPrice(row.createdPriceUzs)}`} <ExternalLink style={{ width: '11px', height: '11px' }} />
              </Link>
            )}

            {row.editing && row.status === 'idle' && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-2 mb-2">
                  <input
                    value={row.rQuery}
                    onChange={e => updateRow(row.kinguin.kinguinId, { rQuery: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && researchRow(row.kinguin.kinguinId, row.rQuery)}
                    placeholder="Название игры в RAWG"
                    className="flex-1 rounded-lg px-3 py-2 font-body text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <button onClick={() => researchRow(row.kinguin.kinguinId, row.rQuery)}
                    className="rounded-lg px-3 font-body text-sm text-[#9CA3AF]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Search style={{ width: '13px', height: '13px' }} />
                  </button>
                </div>
                {row.rResults && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {row.rResults.length === 0 ? (
                      <p className="font-body text-[#4B5563] py-1" style={{ fontSize: '11.5px' }}>Не найдено</p>
                    ) : row.rResults.map(r => (
                      <button key={r.rawgId} onClick={() => pickRowRawg(row.kinguin.kinguinId, r)}
                        className="w-full flex items-center gap-2 rounded-lg p-1.5 text-left"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {r.cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.cover} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                        ) : <div className="w-7 h-7 rounded flex-shrink-0" style={{ background: 'rgba(124,58,237,0.1)' }} />}
                        <span className="flex-1 font-body text-white truncate" style={{ fontSize: '12px' }}>{r.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {rows.length > 0 && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="font-body text-[#9CA3AF] mb-3" style={{ fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Стратегия наценки (для всех {rows.length} игр)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {STRATEGIES.map(s => {
              const meta = STRATEGY_META[s];
              const active = strategy === s;
              return (
                <button key={s} onClick={() => setStrategy(s)} disabled={running}
                  className="rounded-xl px-3 py-2.5 text-left transition-all disabled:opacity-50"
                  style={{
                    background: active ? `${meta.color}18` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? `${meta.color}55` : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  <p className="font-heading font-semibold" style={{ fontSize: '12.5px', color: active ? meta.color : '#9CA3AF' }}>
                    {meta.label}
                  </p>
                  <p className="font-body text-[#4B5563]" style={{ fontSize: '10px' }}>{meta.description}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl px-4 py-3"
               style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <TrendingUp style={{ width: '15px', height: '15px', color: '#7C3AED', flexShrink: 0 }} />
            <span className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>
              Итоговые цены рассчитаются по выбранной стратегии для каждой игры отдельно
            </span>
          </div>

          {!readyToRun && !allSettled && (
            <p className="font-body mt-3" style={{ fontSize: '11.5px', color: '#F59E0B' }}>
              У всех игр должен быть подобран RAWG-матч (или отмечен «пропустить»), чтобы продолжить
            </p>
          )}

          {allSettled ? (
            <div className="mt-4 flex items-center gap-2">
              <p className="font-body flex-1" style={{ fontSize: '13px', color: '#9CA3AF' }}>
                Готово: <span style={{ color: '#22C55E' }}>{doneCount} добавлено</span>
                {errorCount > 0 && <span style={{ color: '#F87171' }}> · {errorCount} с ошибкой</span>}
              </p>
              {errorCount > 0 && (
                <button onClick={() => runBulk(true)}
                  className="rounded-xl px-4 py-2 font-body text-sm" style={{ color: '#F87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  Повторить неудачные
                </button>
              )}
              <button onClick={reset}
                className="rounded-xl px-4 py-2 font-heading font-semibold text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
                Начать заново
              </button>
            </div>
          ) : (
            <button onClick={() => runBulk(false)} disabled={!readyToRun}
              className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl py-3 font-heading font-bold text-white text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 0 24px rgba(124,58,237,0.25)' }}>
              {running ? <Loader2 style={{ width: '15px', height: '15px' }} className="animate-spin" /> : <PackagePlus style={{ width: '15px', height: '15px' }} />}
              {running ? `Добавляю… (осталось ${pendingCount})` : `Добавить ${rows.length} игр`}
            </button>
          )}
        </div>
      )}
    </>
  );
}
