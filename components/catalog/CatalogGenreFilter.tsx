'use client';

import { useTransition, useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Monitor, Apple, Terminal, Tag, X, Check } from 'lucide-react';

const PLATFORMS = ['PC', 'Mac', 'Linux'];
const PRICE_MAX  = 3_000_000;
const PRICE_STEP = 50_000;

function fmtPrice(n: number): string {
  if (n === 0) return '0';
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;
  }
  return `${Math.round(n / 1_000)}K`;
}

interface Props {
  genres:           string[];
  currentGenres:    string[];
  currentPlatform:  string;
  currentPriceMin?: number;
  currentPriceMax?: number;
}

export default function CatalogGenreFilter({
  genres, currentGenres, currentPlatform, currentPriceMin, currentPriceMax,
}: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const sp       = useSearchParams();
  const [, start] = useTransition();

  const [localMin, setLocalMin] = useState(currentPriceMin ?? 0);
  const [localMax, setLocalMax] = useState(currentPriceMax ?? PRICE_MAX);

  useEffect(() => {
    setLocalMin(currentPriceMin ?? 0);
    setLocalMax(currentPriceMax ?? PRICE_MAX);
  }, [currentPriceMin, currentPriceMax]);

  const navigate = (
    nextGenres: string[],
    platform: string,
    priceMin: number,
    priceMax: number,
  ) => {
    const params = new URLSearchParams(sp.toString());
    if (nextGenres.length) params.set('genre', nextGenres.join(','));
    else                   params.delete('genre');
    if (platform) params.set('platform', platform);
    else          params.delete('platform');
    if (priceMin > 0)         params.set('priceMin', String(priceMin));
    else                      params.delete('priceMin');
    if (priceMax < PRICE_MAX) params.set('priceMax', String(priceMax));
    else                      params.delete('priceMax');
    params.delete('page');
    start(() => router.push(`${pathname}?${params.toString()}`));
  };

  const applyPrice = () => navigate(currentGenres, currentPlatform, localMin, localMax);

  const toggleGenre = (g: string) => {
    const next = currentGenres.includes(g)
      ? currentGenres.filter((x) => x !== g)
      : [...currentGenres, g];
    navigate(next, currentPlatform, localMin, localMax);
  };

  const togglePlatform = (p: string) => {
    navigate(currentGenres, currentPlatform === p ? '' : p, localMin, localMax);
  };

  const clearAll = () => {
    setLocalMin(0);
    setLocalMax(PRICE_MAX);
    const params = new URLSearchParams(sp.toString());
    params.delete('genre'); params.delete('platform'); params.delete('page');
    params.delete('priceMin'); params.delete('priceMax');
    start(() => router.push(`${pathname}?${params.toString()}`));
  };

  const hasPriceFilter = localMin > 0 || localMax < PRICE_MAX;
  const hasFilters     = currentGenres.length > 0 || !!currentPlatform || hasPriceFilter;

  const leftPct  = (localMin / PRICE_MAX) * 100;
  const rightPct = (localMax / PRICE_MAX) * 100;

  return (
    <div className="w-56 space-y-6">
      {/* Platform */}
      <div>
        <p className="font-pixel mb-3"
           style={{ fontSize: '7px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.16em' }}>
          ◆ ПЛАТФОРМА
        </p>
        <div className="space-y-1">
          {PLATFORMS.map((p) => {
            const active = currentPlatform === p;
            const Icon   = p === 'Mac' ? Apple : p === 'Linux' ? Terminal : Monitor;
            return (
              <button key={p} onClick={() => togglePlatform(p)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-150 font-body"
                      style={{
                        background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                        border:     active ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                        color:      active ? '#C4B5FD' : '#6B7280',
                        fontSize: '13px',
                      }}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {p}
                {active && <Check className="ml-auto w-3 h-3 text-[#9D60FA]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price range */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-pixel"
             style={{ fontSize: '7px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.16em' }}>
            ◆ ЦЕНА (сум)
          </p>
          {hasPriceFilter && (
            <button
              onClick={() => { setLocalMin(0); setLocalMax(PRICE_MAX); navigate(currentGenres, currentPlatform, 0, PRICE_MAX); }}
              className="font-body text-[#6B7280] hover:text-[#F87171] transition-colors"
              style={{ fontSize: '10px' }}
            >
              сбросить
            </button>
          )}
        </div>

        {/* Price values display */}
        <div className="flex justify-between mb-3">
          <span
            className="font-body rounded-lg px-2 py-1"
            style={{ fontSize: '11px', background: 'rgba(124,58,237,0.1)', color: '#C4B5FD', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            {fmtPrice(localMin)}
          </span>
          <span
            className="font-body rounded-lg px-2 py-1"
            style={{ fontSize: '11px', background: 'rgba(124,58,237,0.1)', color: '#C4B5FD', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            {localMax >= PRICE_MAX ? `${fmtPrice(PRICE_MAX)}+` : fmtPrice(localMax)}
          </span>
        </div>

        {/* Dual range slider */}
        <div className="relative" style={{ height: '20px' }}>
          {/* Background track */}
          <div
            className="absolute rounded-full"
            style={{
              top: '50%', transform: 'translateY(-50%)',
              left: 0, right: 0, height: '3px',
              background: 'rgba(255,255,255,0.08)',
            }}
          />
          {/* Active track */}
          <div
            className="absolute rounded-full"
            style={{
              top: '50%', transform: 'translateY(-50%)',
              left: `${leftPct}%`,
              width: `${rightPct - leftPct}%`,
              height: '3px',
              background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
            }}
          />

          {/* Min thumb (visual) */}
          <div
            className="absolute rounded-full border-2 pointer-events-none"
            style={{
              top: '50%', transform: 'translate(-50%, -50%)',
              left: `${leftPct}%`,
              width: '14px', height: '14px',
              background: '#7C3AED',
              borderColor: '#C4B5FD',
              zIndex: 2,
              boxShadow: '0 0 0 3px rgba(124,58,237,0.2)',
            }}
          />
          {/* Max thumb (visual) */}
          <div
            className="absolute rounded-full border-2 pointer-events-none"
            style={{
              top: '50%', transform: 'translate(-50%, -50%)',
              left: `${rightPct}%`,
              width: '14px', height: '14px',
              background: '#06B6D4',
              borderColor: '#67E8F9',
              zIndex: 2,
              boxShadow: '0 0 0 3px rgba(6,182,212,0.2)',
            }}
          />

          {/* Min input (invisible, interactive) */}
          <input
            type="range"
            min={0} max={PRICE_MAX} step={PRICE_STEP}
            value={localMin}
            onChange={e => setLocalMin(Math.min(Number(e.target.value), localMax - PRICE_STEP))}
            onMouseUp={applyPrice}
            onTouchEnd={applyPrice}
            className="absolute w-full h-full cursor-pointer"
            style={{ opacity: 0, top: 0, left: 0, zIndex: localMin > PRICE_MAX - PRICE_STEP ? 5 : 3 }}
          />
          {/* Max input (invisible, interactive) */}
          <input
            type="range"
            min={0} max={PRICE_MAX} step={PRICE_STEP}
            value={localMax}
            onChange={e => setLocalMax(Math.max(Number(e.target.value), localMin + PRICE_STEP))}
            onMouseUp={applyPrice}
            onTouchEnd={applyPrice}
            className="absolute w-full h-full cursor-pointer"
            style={{ opacity: 0, top: 0, left: 0, zIndex: 4 }}
          />
        </div>
      </div>

      {/* Genres */}
      {genres.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-pixel"
               style={{ fontSize: '7px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.16em' }}>
              ◆ ЖАНРЫ
            </p>
            {currentGenres.length > 0 && (
              <span
                className="font-body rounded-full px-1.5 py-0.5"
                style={{ fontSize: '9px', background: 'rgba(124,58,237,0.25)', color: '#C4B5FD' }}
              >
                {currentGenres.length}
              </span>
            )}
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {genres.map((g) => {
              const active = currentGenres.includes(g);
              return (
                <button key={g} onClick={() => toggleGenre(g)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-150 font-body"
                        style={{
                          background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                          border:     active ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                          color:      active ? '#C4B5FD' : '#6B7280',
                          fontSize: '13px',
                        }}>
                  <Tag className="w-3 h-3 flex-shrink-0" />
                  <span className="flex-1 truncate">{g}</span>
                  {active && <Check className="w-3 h-3 flex-shrink-0 text-[#9D60FA]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear all filters */}
      {hasFilters && (
        <button onClick={clearAll}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-body text-sm transition-all duration-150"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                         color: '#F87171' }}>
          <X className="w-3.5 h-3.5" />
          Сбросить фильтры
        </button>
      )}
    </div>
  );
}
