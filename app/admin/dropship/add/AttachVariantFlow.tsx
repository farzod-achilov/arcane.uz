'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, CheckCircle2, ExternalLink, Plus } from 'lucide-react';

interface GameResult {
  id:    string;
  title: string;
  cover: string | null;
  slug:  string;
}

interface KinguinResult {
  kinguinId: number;
  name:      string;
  platform:  string | null;
  cover:     string | null;
  genres:    string[];
  costUsd:   number;
  inStock:   boolean;
}

export default function AttachVariantFlow() {
  // ── Step 1: pick the existing game ──
  const [gQuery,   setGQuery]   = useState('');
  const [gLoading, setGLoading] = useState(false);
  const [gResults, setGResults] = useState<GameResult[] | null>(null);
  const [game,     setGame]     = useState<GameResult | null>(null);

  // ── Step 2: Kinguin search for the new SKU ──
  const [kQuery,   setKQuery]   = useState('');
  const [kLoading, setKLoading] = useState(false);
  const [kResults, setKResults] = useState<KinguinResult[] | null>(null);
  const [kBlockedCount, setKBlockedCount] = useState(0);
  const [kError,   setKError]   = useState('');
  const [picked,   setPicked]   = useState<KinguinResult | null>(null);

  // ── Step 3: label + submit ──
  const [label,     setLabel]     = useState('');
  const [creating,  setCreating]  = useState(false);
  const [createErr, setCreateErr] = useState('');
  const [created,   setCreated]   = useState<{ variantLabel: string; priceUzs: number; gameTitle: string; gameSlug: string } | null>(null);

  const searchGames = useCallback(async () => {
    if (gQuery.trim().length < 2) return;
    setGLoading(true); setGResults(null); setGame(null);
    try {
      const res  = await fetch(`/api/admin/games?q=${encodeURIComponent(gQuery.trim())}`);
      const json = await res.json();
      setGResults((json.games ?? []).map((g: GameResult) => ({ id: g.id, title: g.title, cover: g.cover, slug: g.slug })));
    } catch {
      setGResults([]);
    } finally {
      setGLoading(false);
    }
  }, [gQuery]);

  const pickGame = (g: GameResult) => {
    setGame(g);
    if (!kQuery) setKQuery(g.title);
  };

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

  const create = async () => {
    if (!game || !picked || !label.trim()) return;
    setCreating(true); setCreateErr(''); setCreated(null);
    try {
      const res = await fetch('/api/admin/dropship/create-variant', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId:    game.id,
          label:     label.trim(),
          kinguinId: picked.kinguinId,
          costUsd:   picked.costUsd,
          title:     picked.name,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) { setCreateErr(json.error ?? 'Ошибка создания'); return; }
      setCreated({ variantLabel: json.variant.label, priceUzs: json.variant.priceUzs, gameTitle: game.title, gameSlug: game.slug });
    } catch {
      setCreateErr('Ошибка сети');
    } finally {
      setCreating(false);
    }
  };

  const reset = () => {
    setGQuery(''); setGResults(null); setGame(null);
    setKQuery(''); setKResults(null); setKError(''); setPicked(null); setKBlockedCount(0);
    setLabel(''); setCreated(null); setCreateErr('');
  };

  if (created) {
    return (
      <div className="rounded-2xl p-6 text-center"
           style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)' }}>
        <CheckCircle2 style={{ width: '32px', height: '32px', color: '#22C55E', margin: '0 auto 12px' }} />
        <p className="font-heading font-bold text-white mb-1" style={{ fontSize: '17px' }}>
          Вариант «{created.variantLabel}» добавлен к «{created.gameTitle}»
        </p>
        <p className="font-body text-[#9CA3AF] mb-1" style={{ fontSize: '13px' }}>
          Цена: <span style={{ color: '#22C55E', fontWeight: 600 }}>{created.priceUzs.toLocaleString('ru-RU')} сум</span>
        </p>
        <div className="flex items-center justify-center gap-3 mt-5">
          <Link href={`/games/${created.gameSlug}`} target="_blank"
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
    );
  }

  return (
    <>
      {/* ── Step 1: pick existing game ── */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="font-body text-[#9CA3AF] mb-3" style={{ fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          1 · Выбрать игру, к которой добавляем вариант
        </p>
        <div className="flex gap-2">
          <input
            value={gQuery}
            onChange={e => setGQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchGames()}
            placeholder="Название игры на сайте"
            className="flex-1 rounded-xl px-4 py-2.5 font-body text-white text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <button onClick={searchGames} disabled={gLoading}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-semibold text-sm text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
            {gLoading ? <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" /> : <Search style={{ width: '14px', height: '14px' }} />}
            Искать
          </button>
        </div>

        {game && (
          <div className="flex items-center gap-3 rounded-xl p-3 mt-3"
               style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)' }}>
            {game.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={game.cover} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            ) : null}
            <span className="flex-1 font-body text-white truncate" style={{ fontSize: '13px' }}>{game.title}</span>
            <button onClick={() => setGame(null)} className="font-body text-[#4B5563] flex-shrink-0" style={{ fontSize: '11px' }}>изменить</button>
          </div>
        )}

        {gResults && !game && (
          <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto">
            {gResults.length === 0 ? (
              <p className="font-body text-[#4B5563] py-2" style={{ fontSize: '12px' }}>Ничего не найдено</p>
            ) : gResults.map(g => (
              <button key={g.id} onClick={() => pickGame(g)}
                className="w-full flex items-center gap-3 rounded-lg p-2 text-left"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {g.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.cover} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                ) : <div className="w-8 h-8 rounded-md flex-shrink-0" style={{ background: 'rgba(124,58,237,0.1)' }} />}
                <span className="flex-1 font-body text-white truncate" style={{ fontSize: '12.5px' }}>{g.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Step 2 + 3 (only after picking a game) ── */}
      {game && (
        <>
          <div className="rounded-2xl p-5 mb-4" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="font-body text-[#9CA3AF] mb-3" style={{ fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              2 · Найти новый SKU на Kinguin
            </p>
            <div className="flex gap-2">
              <input
                value={kQuery}
                onChange={e => setKQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchKinguin()}
                placeholder="Название на Kinguin"
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
            {kError && <p className="font-body mt-2.5" style={{ fontSize: '12px', color: '#FCA5A5' }}>{kError}</p>}
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
                    onClick={() => {
                      if (!r.inStock && !confirm(`«${r.name}» сейчас нет в наличии на Kinguin — если добавить, заказ уйдёт в ручную обработку, пока не появится. Точно добавить?`)) return;
                      setPicked(r);
                    }}
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

          {picked && (
            <div className="rounded-2xl p-5 mb-4" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-body text-[#9CA3AF] mb-3" style={{ fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                3 · Название варианта
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {['Ключ', 'Аккаунт', '1 месяц', '3 месяца', '12 месяцев'].map(preset => (
                  <button key={preset} onClick={() => setLabel(preset)}
                    className="rounded-xl px-3 py-1.5 font-body text-sm"
                    style={{
                      background: label === preset ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${label === preset ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      color: label === preset ? '#C4B5FD' : '#9CA3AF',
                    }}>
                    {preset}
                  </button>
                ))}
              </div>
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="Например: Ключ / Аккаунт"
                className="w-full rounded-xl px-4 py-2.5 font-body text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />

              {createErr && (
                <p className="font-body mt-3" style={{ fontSize: '12px', color: '#FCA5A5' }}>{createErr}</p>
              )}

              <button onClick={create} disabled={creating || !label.trim()}
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl py-3 font-heading font-bold text-white text-sm disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 0 24px rgba(124,58,237,0.25)' }}>
                {creating ? <Loader2 style={{ width: '15px', height: '15px' }} className="animate-spin" /> : <Plus style={{ width: '15px', height: '15px' }} />}
                {creating ? 'Добавление...' : 'Добавить вариант'}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
