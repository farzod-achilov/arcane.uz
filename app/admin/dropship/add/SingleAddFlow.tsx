'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, Loader2, CheckCircle2, ExternalLink, Plus, TrendingUp,
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

const STRATEGIES = Object.keys(STRATEGY_META) as PricingStrategy[];

export default function SingleAddFlow() {
  // ── Kinguin search ──
  const [kQuery,   setKQuery]   = useState('');
  const [kLoading, setKLoading] = useState(false);
  const [kResults, setKResults] = useState<KinguinResult[] | null>(null);
  const [kBlockedCount, setKBlockedCount] = useState(0);
  const [kError,   setKError]   = useState('');
  const [picked,   setPicked]   = useState<KinguinResult | null>(null);

  // ── RAWG search — drives display title/cover/screenshots/genres, NOT
  // Kinguin's own listing (which is a supplier SKU label, e.g. "Grand
  // Theft Auto V PC Rockstar Digital Download CD Key", not storefront copy) ──
  const [rQuery,   setRQuery]   = useState('');
  const [rLoading, setRLoading] = useState(false);
  const [rResults, setRResults] = useState<RawgResult[] | null>(null);
  const [rawg,     setRawg]     = useState<(RawgResult & { description: string | null }) | null>(null);
  const [rawgSkipped, setRawgSkipped] = useState(false);

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
    setKLoading(true); setKError(''); setKResults(null); setKBlockedCount(0); setPicked(null);
    try {
      const res  = await fetch(`/api/admin/dropship/search-kinguin?q=${encodeURIComponent(kQuery.trim())}`);
      const json = await res.json();
      if (!json.ok) { setKError(json.error ?? 'Ошибка поиска'); return; }
      setKResults(json.results);
      setKBlockedCount(json.blockedCount ?? 0);
    } catch {
      setKError('Ошибка сети');
    } finally {
      setKLoading(false);
    }
  }, [kQuery]);

  const pickKinguin = (r: KinguinResult) => {
    setPicked(r);
    if (!sQuery) setSQuery(r.name);
    if (!rQuery) setRQuery(r.name);
    setRawg(null); setRawgSkipped(false); setRResults(null);
    // Kinguin's own listing name is a supplier SKU label, not a clean
    // title — auto-search RAWG right away so the admin isn't left with
    // "Grand Theft Auto V PC Rockstar Digital Download CD Key" by default.
    searchRawgWith(r.name);
  };

  const searchRawgWith = useCallback(async (q: string) => {
    if (q.trim().length < 3) return;
    setRLoading(true); setRResults(null);
    try {
      const res  = await fetch(`/api/rawg/search?q=${encodeURIComponent(q.trim())}&limit=6`);
      const json = await res.json();
      if (json.success) setRResults(json.data);
    } catch { /* RAWG — необязательный шаг, тихо пропускаем */ }
    finally { setRLoading(false); }
  }, []);

  const searchRawg = useCallback(() => searchRawgWith(rQuery), [rQuery, searchRawgWith]);

  const pickRawg = async (r: RawgResult) => {
    setRawgSkipped(false);
    setRawg({ ...r, description: null });
    try {
      const res  = await fetch(`/api/rawg/game/${r.rawgId}`);
      const json = await res.json();
      if (json.success) {
        setRawg(prev => prev ? { ...prev, description: json.data.description || null, screenshots: json.data.screenshots?.length ? json.data.screenshots : prev.screenshots } : prev);
      }
    } catch { /* описание необязательно — обложка/жанры уже есть */ }
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
    if (!rawg && !rawgSkipped) return; // require an explicit RAWG pick or explicit skip
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
          rawgId:          rawg?.rawgId ?? null,
          rawgTitle:       rawg?.title ?? null,
          rawgCover:       rawg?.cover ?? null,
          rawgScreenshots: rawg?.screenshots ?? [],
          rawgGenres:      rawg?.genres ?? [],
          rawgPlatforms:   rawg?.platforms ?? [],
          rawgRating:      rawg?.rating ?? null,
          rawgReleaseDate: rawg?.releaseDate ?? null,
          rawgDescription: rawg?.description ?? null,
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
    setRQuery(''); setRResults(null); setRawg(null); setRawgSkipped(false);
    setSQuery(''); setSResults(null); setSteam(null);
    setCreated(null); setCreateErr('');
  };

  return (
    <>
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
            {kBlockedCount > 0 && (
              <p className="font-body mt-2.5" style={{ fontSize: '11.5px', color: '#F59E0B' }}>
                Скрыто {kBlockedCount} {kBlockedCount === 1 ? 'товар' : 'товара(ов)'} — ключ не активируется в Узбекистане
              </p>
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

          {/* ── Step 2 + 3 + 4 (only after picking) ── */}
          {picked && (
            <>
              {/* ── Step 2: RAWG — required (or explicit skip) — drives
                  title/cover/screenshots/genres shown to customers.
                  Kinguin's own listing name is a supplier SKU label, not
                  storefront copy — same principle already used for the
                  other 5 dropship games in the catalog. ── */}
              <div className="rounded-2xl p-5 mb-4" style={{ background: '#0D0D16', border: `1px solid ${rawg ? 'rgba(34,197,94,0.3)' : rawgSkipped ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                <p className="font-body text-[#9CA3AF] mb-3" style={{ fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  2 · Обложка и описание (RAWG)
                </p>
                <div className="flex gap-2">
                  <input
                    value={rQuery}
                    onChange={e => setRQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchRawg()}
                    placeholder="Название игры в RAWG"
                    className="flex-1 rounded-xl px-4 py-2.5 font-body text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <button onClick={searchRawg} disabled={rLoading}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-body text-sm text-[#9CA3AF] disabled:opacity-50"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {rLoading ? <Loader2 style={{ width: '13px', height: '13px' }} className="animate-spin" /> : <Search style={{ width: '13px', height: '13px' }} />}
                  </button>
                </div>

                {rawg && (
                  <div className="flex items-center gap-3 rounded-xl p-3 mt-3"
                       style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)' }}>
                    {rawg.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={rawg.cover} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-white truncate" style={{ fontSize: '13px' }}>{rawg.title}</p>
                      <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{rawg.genres.join(', ') || '—'}</p>
                    </div>
                    <button onClick={() => setRawg(null)} className="font-body text-[#4B5563] flex-shrink-0" style={{ fontSize: '11px' }}>убрать</button>
                  </div>
                )}

                {rResults && !rawg && (
                  <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto">
                    {rResults.length === 0 ? (
                      <p className="font-body text-[#4B5563] py-2" style={{ fontSize: '12px' }}>Не найдено в RAWG</p>
                    ) : rResults.map(r => (
                      <button
                        key={r.rawgId}
                        onClick={() => pickRawg(r)}
                        className="w-full flex items-center gap-3 rounded-lg p-2 text-left"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        {r.cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.cover} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                        ) : <div className="w-8 h-8 rounded-md flex-shrink-0" style={{ background: 'rgba(124,58,237,0.1)' }} />}
                        <span className="flex-1 font-body text-white truncate" style={{ fontSize: '12.5px' }}>{r.title}</span>
                        <span className="font-body flex-shrink-0 text-[#4B5563]" style={{ fontSize: '11px' }}>{r.releaseDate?.slice(0, 4) ?? ''}</span>
                      </button>
                    ))}
                  </div>
                )}

                {!rawg && (
                  <label className="flex items-center gap-2 mt-3">
                    <input type="checkbox" checked={rawgSkipped} onChange={e => setRawgSkipped(e.target.checked)} />
                    <span className="font-body" style={{ fontSize: '11.5px', color: rawgSkipped ? '#F59E0B' : '#4B5563' }}>
                      Пропустить — использовать название/картинку с Kinguin как есть (не рекомендуется)
                    </span>
                  </label>
                )}
              </div>

              <div className="rounded-2xl p-5 mb-4" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="font-body text-[#9CA3AF] mb-3" style={{ fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  3 · Цена в Steam (необязательно, для сравнения «вы экономите»)
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
                  4 · Стратегия наценки
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

                {!rawg && !rawgSkipped && (
                  <p className="font-body mt-3" style={{ fontSize: '11.5px', color: '#F59E0B' }}>
                    Выберите игру в RAWG на шаге 2 (или отметьте «пропустить»), чтобы продолжить
                  </p>
                )}
                {createErr && (
                  <p className="font-body mt-3" style={{ fontSize: '12px', color: '#FCA5A5' }}>{createErr}</p>
                )}

                <button onClick={create} disabled={creating || (!rawg && !rawgSkipped)}
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
    </>
  );
}
