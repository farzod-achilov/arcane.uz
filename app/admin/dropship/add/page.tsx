'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader2, CheckCircle2, AlertCircle, ExternalLink,
  ChevronLeft, Plus, TrendingUp,
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

interface SteamResult {
  appId:    number;
  name:     string;
  cover:    string | null;
  priceUsd: number | null;
}

const STRATEGIES = Object.keys(STRATEGY_META) as PricingStrategy[];

export default function AddDropshipGamePage() {
  // ── Kinguin search ──
  const [kQuery,   setKQuery]   = useState('');
  const [kLoading, setKLoading] = useState(false);
  const [kResults, setKResults] = useState<KinguinResult[] | null>(null);
  const [kError,   setKError]   = useState('');
  const [picked,   setPicked]   = useState<KinguinResult | null>(null);

  // ── Steam search (optional) ──
  const [sQuery,   setSQuery]   = useState('');
  const [sLoading, setSLoading] = useState(false);
  const [sResults, setSResults] = useState<SteamResult[] | null>(null);
  const [steam,    setSteam]    = useState<SteamResult | null>(null);

  // ── Pricing ──
  const [strategy, setStrategy] = useState<PricingStrategy>('GLOBAL');
  const [creating,  setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');
  const [created,   setCreated]  = useState<{ title: string; slug: string; priceUzs: number; marginPercent: number | null } | null>(null);

  const searchKinguin = useCallback(async () => {
    if (kQuery.trim().length < 3) { setKError('Минимум 3 символа'); return; }
    setKLoading(true); setKError(''); setKResults(null); setPicked(null);
    try {
      const res  = await fetch(`/api/admin/dropship/search-kinguin?q=${encodeURIComponent(kQuery.trim())}`);
      const json = await res.json();
      if (!json.ok) { setKError(json.error ?? 'Ошибка поиска'); return; }
      setKResults(json.results);
    } catch {
      setKError('Ошибка сети');
    } finally {
      setKLoading(false);
    }
  }, [kQuery]);

  const pickKinguin = (r: KinguinResult) => {
    setPicked(r);
    if (!sQuery) setSQuery(r.name);
  };

  const searchSteam = useCallback(async () => {
    if (sQuery.trim().length < 3) return;
    setSLoading(true); setSResults(null);
    try {
      const res  = await fetch(`/api/admin/dropship/search-steam?q=${encodeURIComponent(sQuery.trim())}`);
      const json = await res.json();
      if (json.ok) setSResults(json.results);
    } catch { /* необязательный шаг — тихо пропускаем */ }
    finally { setSLoading(false); }
  }, [sQuery]);

  const create = async () => {
    if (!picked) return;
    setCreating(true); setCreateErr(''); setCreated(null);
    try {
      const res = await fetch('/api/admin/dropship/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:         picked.name,
          kinguinId:     picked.kinguinId,
          costUsd:       picked.costUsd,
          cover:         picked.cover,
          genres:        picked.genres,
          platforms:     picked.platform ? [picked.platform] : ['PC'],
          steamAppId:    steam?.appId ?? null,
          steamPriceUsd: steam?.priceUsd ?? null,
          strategy,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) { setCreateErr(json.error ?? 'Ошибка создания'); return; }
      setCreated(json.game);
    } catch {
      setCreateErr('Ошибка сети');
    } finally {
      setCreating(false);
    }
  };

  const reset = () => {
    setKQuery(''); setKResults(null); setKError(''); setPicked(null);
    setSQuery(''); setSResults(null); setSteam(null);
    setCreated(null); setCreateErr('');
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/suppliers"
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <ChevronLeft style={{ width: '16px', height: '16px', color: '#9CA3AF' }} />
        </Link>
        <div>
          <h1 className="font-heading font-bold text-white" style={{ fontSize: '20px' }}>
            Добавить dropship-игру
          </h1>
          <p className="font-body text-[#6B7280]" style={{ fontSize: '13px' }}>
            Поиск на Kinguin → цена закупки → цена продажи с наценкой
          </p>
        </div>
      </div>

      {/* ── SUCCESS ── */}
      {created ? (
        <div className="rounded-2xl p-6 text-center"
             style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <CheckCircle2 style={{ width: '32px', height: '32px', color: '#22C55E', margin: '0 auto 12px' }} />
          <p className="font-heading font-bold text-white mb-1" style={{ fontSize: '17px' }}>
            «{created.title}» добавлена
          </p>
          <p className="font-body text-[#9CA3AF] mb-1" style={{ fontSize: '13px' }}>
            Цена на витрине: <span style={{ color: '#22C55E', fontWeight: 600 }}>{formatPrice(created.priceUzs)}</span>
            {created.marginPercent != null && ` · маржа +${Math.round(created.marginPercent)}%`}
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <Link href={`/games/${created.slug}`} target="_blank"
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 font-body text-sm"
              style={{ color: '#06B6D4', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
              Смотреть на сайте <ExternalLink style={{ width: '13px', height: '13px' }} />
            </Link>
            <button onClick={reset}
              className="rounded-xl px-4 py-2 font-heading font-semibold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
              Добавить ещё
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── Step 1: Kinguin search ── */}
          <div className="rounded-2xl p-5 mb-4" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="font-body text-[#9CA3AF] mb-3" style={{ fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              1 · Найти на Kinguin
            </p>
            <div className="flex gap-2">
              <input
                value={kQuery}
                onChange={e => setKQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchKinguin()}
                placeholder="Название игры, например Hollow Knight"
                className="flex-1 rounded-xl px-4 py-2.5 font-body text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <button onClick={searchKinguin} disabled={kLoading}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-semibold text-sm text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
                {kLoading ? <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" /> : <Search style={{ width: '14px', height: '14px' }} />}
                Искать
              </button>
            </div>
            {kError && (
              <p className="font-body mt-2.5" style={{ fontSize: '12px', color: '#FCA5A5' }}>{kError}</p>
            )}

            {kResults && (
              <div className="mt-3 space-y-1.5 max-h-80 overflow-y-auto">
                {kResults.length === 0 ? (
                  <p className="font-body text-[#4B5563] py-4 text-center" style={{ fontSize: '13px' }}>Ничего не найдено</p>
                ) : kResults.map(r => (
                  <button
                    key={r.kinguinId}
                    onClick={() => pickKinguin(r)}
                    className="w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all"
                    style={{
                      background: picked?.kinguinId === r.kinguinId ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${picked?.kinguinId === r.kinguinId ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    {r.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.cover} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: 'rgba(124,58,237,0.1)' }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-white truncate" style={{ fontSize: '13px' }}>{r.name}</p>
                      <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
                        {r.platform ?? '—'} · {r.inStock ? <span style={{ color: '#22C55E' }}>в наличии</span> : <span style={{ color: '#EF4444' }}>нет в наличии</span>}
                      </p>
                    </div>
                    <span className="font-heading font-bold flex-shrink-0" style={{ fontSize: '14px', color: '#F59E0B' }}>
                      ${r.costUsd.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Step 2 + 3 (only after picking) ── */}
          {picked && (
            <>
              <div className="rounded-2xl p-5 mb-4" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="font-body text-[#9CA3AF] mb-3" style={{ fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  2 · Цена в Steam (необязательно, для сравнения «вы экономите»)
                </p>
                <div className="flex gap-2 mb-3">
                  <input
                    value={sQuery}
                    onChange={e => setSQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchSteam()}
                    placeholder="Название в Steam"
                    className="flex-1 rounded-xl px-4 py-2.5 font-body text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <button onClick={searchSteam} disabled={sLoading}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-body text-sm text-[#9CA3AF] disabled:opacity-50"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {sLoading ? <Loader2 style={{ width: '13px', height: '13px' }} className="animate-spin" /> : <Search style={{ width: '13px', height: '13px' }} />}
                  </button>
                </div>

                {steam && (
                  <div className="flex items-center justify-between rounded-xl px-3 py-2 mb-2"
                       style={{ background: 'rgba(102,192,244,0.08)', border: '1px solid rgba(102,192,244,0.25)' }}>
                    <span className="font-body text-white truncate" style={{ fontSize: '12.5px' }}>{steam.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-heading font-bold" style={{ fontSize: '13px', color: '#66C0F4' }}>
                        {steam.priceUsd != null ? `$${steam.priceUsd.toFixed(2)}` : '—'}
                      </span>
                      <button onClick={() => setSteam(null)} className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>убрать</button>
                    </div>
                  </div>
                )}

                {sResults && !steam && (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {sResults.length === 0 ? (
                      <p className="font-body text-[#4B5563] py-2" style={{ fontSize: '12px' }}>Не найдено в Steam</p>
                    ) : sResults.map(r => (
                      <button
                        key={r.appId}
                        onClick={() => setSteam(r)}
                        className="w-full flex items-center gap-3 rounded-lg p-2 text-left"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <span className="flex-1 font-body text-white truncate" style={{ fontSize: '12.5px' }}>{r.name}</span>
                        <span className="font-body flex-shrink-0" style={{ fontSize: '12px', color: '#66C0F4' }}>
                          {r.priceUsd != null ? `$${r.priceUsd.toFixed(2)}` : 'бесплатно/—'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl p-5 mb-4" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="font-body text-[#9CA3AF] mb-3" style={{ fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  3 · Стратегия наценки
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {STRATEGIES.map(s => {
                    const meta = STRATEGY_META[s];
                    const active = strategy === s;
                    return (
                      <button key={s} onClick={() => setStrategy(s)}
                        className="rounded-xl px-3 py-2.5 text-left transition-all"
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

                <div className="mt-4 flex items-center justify-between rounded-xl px-4 py-3"
                     style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <div className="flex items-center gap-2">
                    <TrendingUp style={{ width: '15px', height: '15px', color: '#7C3AED' }} />
                    <span className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>Закупка ${picked.costUsd.toFixed(2)} — итоговую цену увидите после создания</span>
                  </div>
                </div>

                {createErr && (
                  <p className="font-body mt-3" style={{ fontSize: '12px', color: '#FCA5A5' }}>{createErr}</p>
                )}

                <button onClick={create} disabled={creating}
                  className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl py-3 font-heading font-bold text-white text-sm disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 0 24px rgba(124,58,237,0.25)' }}>
                  {creating ? <Loader2 style={{ width: '15px', height: '15px' }} className="animate-spin" /> : <Plus style={{ width: '15px', height: '15px' }} />}
                  {creating ? 'Добавление...' : 'Добавить игру'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
