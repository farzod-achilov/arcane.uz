'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Zap, ArrowRight, Flame, Tag, Star } from 'lucide-react';
import { products } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/lib/types';

/* ── Quick links shown when search is empty ───────────── */
const QUICK = [
  { label: 'Топ продаж',  href: '/catalog?sort=trending', icon: Flame,  color: '#EF4444' },
  { label: 'Скидки',      href: '/deals',                 icon: Tag,    color: '#22C55E' },
  { label: 'Новинки',     href: '/new-releases',          icon: Star,   color: '#F59E0B' },
];

function searchProducts(q: string): Product[] {
  const lower = q.toLowerCase().trim();
  if (!lower) return [];
  return products
    .filter(
      (p) =>
        p.title.toLowerCase().includes(lower) ||
        p.subtitle?.toLowerCase().includes(lower) ||
        p.category.toLowerCase().includes(lower) ||
        p.platform.some((pl) => pl.toLowerCase().includes(lower)) ||
        p.tags?.some((t) => t.toLowerCase().includes(lower)),
    )
    .slice(0, 7);
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const router = useRouter();

  /* ── Auto-focus / reset on open ── */
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setActiveIdx(-1);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  /* ── Debounced search ── */
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(() => setResults(searchProducts(query)), 240);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  /* ── Keyboard navigation ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, -1));
      }
      if (e.key === 'Enter' && activeIdx >= 0 && results[activeIdx]) {
        router.push(`/product/${results[activeIdx].id}`);
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, results, activeIdx, onClose, router]);

  const hasResults = results.length > 0;
  const noMatch = query.trim() && !hasResults;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200]"
            style={{ background: 'rgba(4,3,10,0.82)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-[120px] left-1/2 -translate-x-1/2 z-[201] w-full max-w-2xl px-4"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#0C0C18',
                border: '1px solid rgba(124,58,237,0.32)',
                boxShadow:
                  '0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(124,58,237,0.1), 0 0 40px rgba(124,58,237,0.08)',
              }}
            >
              {/* Top glow line */}
              <div
                className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(124,58,237,0.6) 40%, rgba(6,182,212,0.4) 70%, transparent)',
                }}
              />

              {/* Input row */}
              <div
                className="flex items-center gap-3.5 px-5 py-4"
                style={{
                  borderBottom:
                    hasResults || noMatch || !query.trim()
                      ? '1px solid rgba(255,255,255,0.05)'
                      : 'none',
                }}
              >
                <Search
                  style={{ width: '18px', height: '18px', color: '#7C3AED', flexShrink: 0 }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActiveIdx(-1); }}
                  placeholder="Поиск игр, жанров, платформ..."
                  className="flex-1 bg-transparent text-white outline-none font-heading placeholder:text-[#2D2D44]"
                  style={{ fontSize: '16px' }}
                />
                {query ? (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 rounded-lg transition-colors text-[#4B5563] hover:text-[#9CA3AF]"
                  >
                    <X style={{ width: '16px', height: '16px' }} />
                  </button>
                ) : (
                  <kbd
                    className="hidden sm:flex items-center font-pixel rounded-md px-2 py-1 text-[#374151]"
                    style={{
                      fontSize: '7px',
                      background: '#09090E',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    ESC
                  </kbd>
                )}
              </div>

              {/* Results */}
              {hasResults && (
                <div className="max-h-[55vh] overflow-y-auto">
                  {/* Results header */}
                  <div
                    className="flex items-center justify-between px-5 py-2.5"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <span
                      className="font-heading text-[#4B5563]"
                      style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                    >
                      Результаты ({results.length})
                    </span>
                    <Link
                      href="/catalog"
                      onClick={onClose}
                      className="flex items-center gap-1 font-body transition-colors text-[#7C3AED] hover:text-[#9D60FA]"
                      style={{ fontSize: '12px' }}
                    >
                      Все результаты
                      <ArrowRight style={{ width: '12px', height: '12px' }} />
                    </Link>
                  </div>

                  {results.map((product, i) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      onClick={onClose}
                      className="group flex items-center gap-4 px-5 py-3.5 transition-all duration-150"
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        background: activeIdx === i ? 'rgba(124,58,237,0.07)' : 'transparent',
                      }}
                      onMouseEnter={() => setActiveIdx(i)}
                    >
                      {/* Cover */}
                      <div className="relative w-10 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-heading font-semibold text-white line-clamp-1"
                          style={{ fontSize: '14px' }}
                        >
                          {product.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-body text-[#4B5563]" style={{ fontSize: '11.5px' }}>
                            {product.platform.slice(0, 2).join(' · ')}
                          </span>
                          {product.inStock && (
                            <>
                              <span className="text-[#1F2937]">·</span>
                              <div className="flex items-center gap-1">
                                <Zap style={{ width: '9px', height: '9px', color: '#22C55E' }} />
                                <span
                                  className="font-body text-[#22C55E]"
                                  style={{ fontSize: '10.5px' }}
                                >
                                  Мгновенно
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p
                          className="font-heading font-bold text-white"
                          style={{ fontSize: '14px' }}
                        >
                          {formatPrice(product.price)}
                        </p>
                        {product.discount && (
                          <span
                            className="font-pixel rounded"
                            style={{
                              fontSize: '7px',
                              background: 'rgba(239,68,68,0.15)',
                              color: '#F87171',
                              padding: '1.5px 5px',
                              letterSpacing: '0.04em',
                            }}
                          >
                            -{product.discount}%
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* No results */}
              {noMatch && (
                <div className="px-5 py-10 text-center">
                  <p className="font-body text-[#4B5563] mb-1.5" style={{ fontSize: '14px' }}>
                    Ничего не найдено по запросу «{query}»
                  </p>
                  <p className="font-body text-[#2D2D44]" style={{ fontSize: '12px' }}>
                    Попробуйте другое название или жанр
                  </p>
                </div>
              )}

              {/* Quick links (empty state) */}
              {!query.trim() && (
                <div className="p-5">
                  <p
                    className="font-heading text-[#4B5563] mb-3"
                    style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                  >
                    Быстрые ссылки
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK.map((ql) => (
                      <Link
                        key={ql.href}
                        href={ql.href}
                        onClick={onClose}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-medium transition-all duration-200"
                        style={{
                          background: '#09090E',
                          border: '1px solid rgba(255,255,255,0.07)',
                          fontSize: '13px',
                          color: '#9CA3AF',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)';
                          (e.currentTarget as HTMLElement).style.color = '#E2E8F0';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                          (e.currentTarget as HTMLElement).style.color = '#9CA3AF';
                        }}
                      >
                        <ql.icon style={{ width: '14px', height: '14px', color: ql.color }} />
                        {ql.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
