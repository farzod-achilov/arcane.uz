'use client';

import { useCallback, useTransition, useRef, useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X, LayoutGrid, List, ChevronDown, SlidersHorizontal } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Новинки' },
  { value: 'rating',     label: 'По рейтингу' },
  { value: 'price_asc',  label: 'Цена: по возрастанию' },
  { value: 'price_desc', label: 'Цена: по убыванию' },
  { value: 'name',       label: 'По названию' },
];

interface Props {
  total:        number;
  currentSort:  string;
  currentView:  string;
  currentQ:     string;
  onMobileFilterToggle?: () => void;
  activeFilters?: number;
}

export default function CatalogToolbar({
  total, currentSort, currentView, currentQ,
  onMobileFilterToggle, activeFilters = 0,
}: Props) {
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [localQ, setLocalQ] = useState(currentQ);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setLocalQ(currentQ); }, [currentQ]);

  const buildUrl = useCallback((overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined || v === '') params.delete(k);
      else params.set(k, v);
    }
    params.delete('page');
    return `${pathname}?${params.toString()}`;
  }, [pathname, searchParams]);

  const onSearch = (val: string) => {
    setLocalQ(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(() => {
        router.push(buildUrl({ q: val || undefined }));
      });
    }, 350);
  };

  const onSort = (val: string) => {
    startTransition(() => {
      router.push(buildUrl({ sort: val }));
    });
  };

  const onView = (val: string) => {
    startTransition(() => {
      router.push(buildUrl({ view: val }));
    });
  };

  const clearSearch = () => {
    setLocalQ('');
    startTransition(() => {
      router.push(buildUrl({ q: undefined }));
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: '#4B5563', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Поиск по названию, разработчику, жанру…"
          value={localQ}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full rounded-xl pl-10 pr-4 py-2.5 text-white text-sm font-body outline-none transition-all duration-200 placeholder:text-gray-600"
          style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.07)' }}
          onFocus={(e)  => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.45)')}
          onBlur={(e)   => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
        />
        {localQ && (
          <button onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="relative">
        <select
          value={currentSort}
          onChange={(e) => onSort(e.target.value)}
          className="appearance-none rounded-xl px-4 pr-9 py-2.5 text-white text-sm font-body outline-none cursor-pointer min-w-[190px]"
          style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                     style={{ color: '#4B5563' }} />
      </div>

      {/* View toggle */}
      <div className="hidden sm:flex items-center rounded-xl p-1"
           style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.07)' }}>
        {(['grid', 'list'] as const).map((v) => (
          <button key={v} onClick={() => onView(v)}
                  className="p-1.5 rounded-lg transition-all duration-200"
                  style={{ background: currentView === v ? '#7C3AED' : 'transparent',
                           color:      currentView === v ? '#fff'    : '#6B7280'     }}>
            {v === 'grid' ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </button>
        ))}
      </div>

      {/* Mobile filter toggle */}
      {onMobileFilterToggle && (
        <button
          onClick={onMobileFilterToggle}
          className="lg:hidden flex items-center gap-2 rounded-xl px-4 py-2.5 text-white text-sm font-body"
          style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <SlidersHorizontal className="w-4 h-4 text-[#7C3AED]" />
          Фильтры
          {activeFilters > 0 && (
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ fontSize: '9px', background: '#7C3AED' }}>
              {activeFilters}
            </span>
          )}
        </button>
      )}

      {/* Count chip */}
      <div className="hidden lg:flex items-center px-4 rounded-xl"
           style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.07)' }}>
        <span className="font-body text-[#4B5563] text-sm">
          <span className="text-white font-semibold">{total}</span> игр
        </span>
      </div>
    </div>
  );
}
