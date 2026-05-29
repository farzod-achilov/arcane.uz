'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, Zap, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface SearchResult {
  id:       string;
  title:    string;
  slug:     string;
  cover:    string | null;
  priceUzs: number;
  genres:   string[];
  rating:   number | null;
  instant:  boolean;
}

interface Props {
  onOpenOverlay: () => void;
}

export default function SearchBar({ onOpenOverlay }: Props) {
  const [focused,   setFocused]   = useState(false);
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState<SearchResult[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const inputRef    = useRef<HTMLInputElement>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef    = useRef<AbortController>();
  const router      = useRouter();

  const isOpen = focused && (query.trim().length >= 2 || results.length > 0);

  /* ── Search ── */
  useEffect(() => {
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: ctrl.signal });
        const data = await res.json() as { results?: SearchResult[] };
        setResults(data.results ?? []);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setResults([]);
      } finally {
        setLoading(false);
      }
    }, 260);

    return () => { clearTimeout(debounceRef.current); abortRef.current?.abort(); };
  }, [query]);

  /* ── Click outside → close ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Keyboard: arrows + Enter + Escape ── */
  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setFocused(false); inputRef.current?.blur(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    }
    if (e.key === 'Enter') {
      if (activeIdx >= 0 && results[activeIdx]) {
        router.push(`/games/${results[activeIdx].slug}`);
        clear();
      } else if (query.trim().length >= 2) {
        router.push(`/catalog?q=${encodeURIComponent(query.trim())}`);
        clear();
      }
    }
  }, [results, activeIdx, query, router]); // eslint-disable-line react-hooks/exhaustive-deps

  function clear() {
    setQuery('');
    setResults([]);
    setActiveIdx(-1);
    setFocused(false);
    inputRef.current?.blur();
  }

  const noMatch = query.trim().length >= 2 && !loading && results.length === 0;

  return (
    <div ref={wrapRef} className="relative hidden lg:block">
      {/* Input */}
      <motion.div
        animate={{ width: focused ? 280 : 160 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex items-center gap-2.5 rounded-xl px-3.5"
        style={{
          height: '40px',
          background: focused ? 'rgba(124,58,237,0.07)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${focused ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.07)'}`,
          transition: 'border-color 0.2s, background 0.2s',
          boxShadow: focused ? '0 0 20px rgba(124,58,237,0.1)' : 'none',
        }}
      >
        {loading
          ? <Loader2 style={{ width: '14px', height: '14px', color: '#7C3AED', flexShrink: 0 }} className="animate-spin" />
          : <Search style={{ width: '14px', height: '14px', color: focused ? '#7C3AED' : '#4B5563', flexShrink: 0, transition: 'color 0.2s' }} />}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(-1); }}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKey}
          placeholder="Поиск игр..."
          className="flex-1 bg-transparent text-white outline-none font-body placeholder:text-[#2D2D44]"
          style={{ fontSize: '13px', minWidth: 0 }}
        />

        {query ? (
          <button onClick={clear} className="p-0.5 text-[#4B5563] hover:text-[#9CA3AF] transition-colors">
            <X style={{ width: '12px', height: '12px' }} />
          </button>
        ) : !focused ? (
          <div
            onClick={onOpenOverlay}
            className="flex items-center gap-0.5 cursor-pointer"
            title="Расширенный поиск"
          >
            <kbd className="font-pixel rounded flex items-center justify-center"
              style={{ fontSize: '6px', padding: '1px 4px', background: '#09090E',
                       border: '1px solid rgba(255,255,255,0.08)', color: '#2D2D44', pointerEvents: 'none' }}>
              /
            </kbd>
          </div>
        ) : null}
      </motion.div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-[calc(100%+8px)] left-0 z-[300] rounded-2xl overflow-hidden"
            style={{
              width: '340px',
              background: '#0C0C18',
              border: '1px solid rgba(124,58,237,0.3)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(124,58,237,0.08)',
            }}
          >
            {/* Top accent */}
            <div className="h-px" style={{
              background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.6) 40%, rgba(6,182,212,0.4) 70%, transparent)',
            }} />

            {/* Loading */}
            {loading && (
              <div className="px-4 py-4 space-y-2.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-10 rounded-lg flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 rounded" style={{ background: 'rgba(255,255,255,0.05)', width: `${50 + i * 15}%` }} />
                      <div className="h-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', width: '35%' }} />
                    </div>
                    <div className="h-3 w-16 rounded flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
              <>
                <div className="max-h-[340px] overflow-y-auto">
                  {results.map((r, i) => (
                    <Link
                      key={r.id}
                      href={`/games/${r.slug}`}
                      onClick={clear}
                      onMouseEnter={() => setActiveIdx(i)}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-100"
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        background: activeIdx === i ? 'rgba(124,58,237,0.07)' : 'transparent',
                      }}
                    >
                      {/* Cover */}
                      <div className="relative w-8 h-10 rounded-lg overflow-hidden flex-shrink-0"
                           style={{ background: '#0A0A14' }}>
                        {r.cover && (
                          <Image src={r.cover} alt={r.title} fill unoptimized className="object-cover" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-semibold text-white truncate" style={{ fontSize: '13px' }}>
                          {r.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {r.genres[0] && (
                            <span className="font-pixel rounded px-1.5 py-0.5"
                                  style={{ fontSize: '6.5px', background: 'rgba(124,58,237,0.1)',
                                           color: '#9D60FA', border: '1px solid rgba(124,58,237,0.2)' }}>
                              {r.genres[0]}
                            </span>
                          )}
                          {r.instant && (
                            <Zap style={{ width: '8px', height: '8px', color: '#22C55E' }} />
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <span className="font-heading font-bold text-white flex-shrink-0" style={{ fontSize: '12px' }}>
                        {r.priceUzs > 0 ? formatPrice(r.priceUzs) : '—'}
                      </span>
                    </Link>
                  ))}
                </div>

                {/* Footer: see all */}
                <Link
                  href={`/catalog?q=${encodeURIComponent(query.trim())}`}
                  onClick={clear}
                  className="flex items-center justify-between px-4 py-2.5 transition-colors duration-150 group"
                  style={{ borderTop: '1px solid rgba(124,58,237,0.1)', background: 'rgba(124,58,237,0.03)' }}
                >
                  <span className="font-body text-[#7C3AED] group-hover:text-[#9D60FA] transition-colors" style={{ fontSize: '12px' }}>
                    Все результаты по «{query}»
                  </span>
                  <ArrowRight style={{ width: '12px', height: '12px', color: '#7C3AED' }} />
                </Link>
              </>
            )}

            {/* No match */}
            {noMatch && (
              <div className="px-4 py-6 text-center">
                <p className="font-body text-[#4B5563]" style={{ fontSize: '13px' }}>
                  Ничего не найдено по «{query}»
                </p>
                <p className="font-body text-[#2D2D44] mt-1" style={{ fontSize: '11px' }}>
                  Попробуйте другое название
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
