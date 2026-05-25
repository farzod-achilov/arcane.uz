'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Monitor, Apple, Terminal, Tag, X } from 'lucide-react';

const PLATFORMS = ['PC', 'Mac', 'Linux'];

interface Props {
  genres:          string[];
  currentGenre:    string;
  currentPlatform: string;
}

export default function CatalogGenreFilter({ genres, currentGenre, currentPlatform }: Props) {
  const router     = useRouter();
  const pathname   = usePathname();
  const sp         = useSearchParams();
  const [, start]  = useTransition();

  const navigate = (genre: string, platform: string) => {
    const params = new URLSearchParams(sp.toString());
    if (genre)    params.set('genre',    genre);    else params.delete('genre');
    if (platform) params.set('platform', platform); else params.delete('platform');
    params.delete('page');
    start(() => router.push(`${pathname}?${params.toString()}`));
  };

  const clearAll = () => {
    const params = new URLSearchParams(sp.toString());
    params.delete('genre'); params.delete('platform'); params.delete('page');
    start(() => router.push(`${pathname}?${params.toString()}`));
  };

  const hasFilters = currentGenre || currentPlatform;

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
              <button key={p} onClick={() => navigate(currentGenre, active ? '' : p)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-150 font-body"
                      style={{
                        background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                        border:     active ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                        color:      active ? '#C4B5FD' : '#6B7280',
                        fontSize: '13px',
                      }}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {p}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#9D60FA]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Genres */}
      {genres.length > 0 && (
        <div>
          <p className="font-pixel mb-3"
             style={{ fontSize: '7px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.16em' }}>
            ◆ ЖАНРЫ
          </p>
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {genres.map((g) => {
              const active = currentGenre === g;
              return (
                <button key={g} onClick={() => navigate(active ? '' : g, currentPlatform)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-150 font-body"
                        style={{
                          background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                          border:     active ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                          color:      active ? '#C4B5FD' : '#6B7280',
                          fontSize: '13px',
                        }}>
                  <Tag className="w-3 h-3 flex-shrink-0" />
                  {g}
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#9D60FA]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear filters */}
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
