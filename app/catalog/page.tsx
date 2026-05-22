'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutGrid, List, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import CatalogSidebar, { Filters, defaultFilters } from '@/components/catalog/CatalogSidebar';
import { products as mockProducts, PRICE_MIN, PRICE_MAX } from '@/lib/mockData';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Zap } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { arcaneGamesToProducts } from '@/lib/arcaneMapper';
import type { ArcaneGameListResponse } from '@/lib/arcaneApi';

const sortOptions = [
  { value: 'trending',  label: 'По популярности' },
  { value: 'newest',    label: 'Новинки' },
  { value: 'price_asc', label: 'Цена: по возрастанию' },
  { value: 'price_desc',label: 'Цена: по убыванию' },
  { value: 'discount',  label: 'Biggest Discount' },
  { value: 'rating',    label: 'По рейтингу' },
];

export default function CatalogPage() {
  const [filters, setFilters]       = useState<Filters>(defaultFilters);
  const [sort, setSort]             = useState('trending');
  const [search, setSearch]         = useState('');
  const [view, setView]             = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [arcaneProducts, setArcaneProducts] = useState<Product[]>([]);

  // Fetch games from arcane-api and merge with mockData
  useEffect(() => {
    fetch('/api/arcane/games?limit=200')
      .then(r => r.json())
      .then((res: ArcaneGameListResponse & { mockProducts?: Product[] }) => {
        if (res.success && res.data?.length) {
          setArcaneProducts(arcaneGamesToProducts(res.data));
        }
        // If backend returned mockProducts fallback, ignore — we already have mockProducts below
      })
      .catch(() => {/* arcane-api offline — fall through to mockData only */});
  }, []);

  // Merge: arcane-api games first, then mockData (dedup by id)
  const products = useMemo(() => {
    const arcaneIds = new Set(arcaneProducts.map(p => p.id));
    const deduped   = mockProducts.filter(p => !arcaneIds.has(p.id));
    return [...arcaneProducts, ...deduped];
  }, [arcaneProducts]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.platform.some((pl) => pl.toLowerCase().includes(q)) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)) ||
          p.developer?.toLowerCase().includes(q),
      );
    }

    if (filters.categories.length > 0) {
      result = result.filter((p) => filters.categories.includes(p.category));
    }

    if (filters.platforms.length > 0) {
      result = result.filter((p) => p.platform.some((pl) => filters.platforms.includes(pl)));
    }

    if (filters.onlyDeals) {
      result = result.filter((p) => p.discount && p.discount > 0);
    }

    if (filters.onlyPreorder) {
      result = result.filter((p) => p.preorder);
    }

    const isPriceFiltered = filters.minPrice !== PRICE_MIN || filters.maxPrice !== PRICE_MAX;
    if (isPriceFiltered) {
      result = result.filter((p) => p.price >= filters.minPrice && p.price <= filters.maxPrice);
    }

    switch (sort) {
      case 'price_asc':  result.sort((a, b) => a.price - b.price); break;
      case 'price_desc': result.sort((a, b) => b.price - a.price); break;
      case 'rating':     result.sort((a, b) => b.rating - a.rating); break;
      case 'discount':   result.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0)); break;
      case 'newest':     result.sort((a, b) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        return dateB - dateA;
      }); break;
    }

    return result;
  }, [filters, sort, search]);

  const activeFilterCount =
    filters.categories.length +
    filters.platforms.length +
    (filters.minPrice !== PRICE_MIN || filters.maxPrice !== PRICE_MAX ? 1 : 0) +
    (filters.onlyDeals ? 1 : 0) +
    (filters.onlyPreorder ? 1 : 0);

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '108px' }}>
      {/* Subtle grid bg */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          opacity: 0.013,
        }}
      />

      {/* Header banner */}
      <div
        className="relative"
        style={{
          background: 'linear-gradient(180deg, #0D0A1A 0%, #0A0A0F 100%)',
          borderBottom: '1px solid rgba(124,58,237,0.12)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p
              className="font-pixel mb-2"
              style={{ fontSize: '9px', color: '#7C3AED', letterSpacing: '0.15em' }}
            >
              КАТАЛОГ
            </p>
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-6">
              Все игры
              <span
                className="ml-3 font-heading text-lg font-normal"
                style={{ color: '#374151' }}
              >
                ({products.length})
              </span>
            </h1>

            {/* Search + controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: '#4B5563' }}
                />
                <input
                  type="text"
                  placeholder="Поиск по названию, платформе, жанру..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-2.5 text-white text-sm font-body outline-none transition-all duration-200 placeholder:text-gray-600"
                  style={{
                    background: '#12121A',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.45)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                />
                <AnimatePresence>
                  {search && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none rounded-xl px-4 pr-9 py-2.5 text-white text-sm font-body outline-none cursor-pointer min-w-[200px]"
                  style={{
                    background: '#12121A',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: '#4B5563' }}
                />
              </div>

              {/* View toggle (desktop) */}
              <div
                className="hidden sm:flex items-center rounded-xl p-1"
                style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <button
                  onClick={() => setView('grid')}
                  className="p-1.5 rounded-lg transition-all duration-200"
                  style={{
                    background: view === 'grid' ? '#7C3AED' : 'transparent',
                    color: view === 'grid' ? '#fff' : '#6B7280',
                  }}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className="p-1.5 rounded-lg transition-all duration-200"
                  style={{
                    background: view === 'list' ? '#7C3AED' : 'transparent',
                    color: view === 'list' ? '#fff' : '#6B7280',
                  }}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile filter toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 rounded-xl px-4 py-2.5 text-white text-sm font-body transition-all duration-200"
                style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <SlidersHorizontal className="w-4 h-4 text-[#7C3AED]" />
                Фильтры
                {activeFilterCount > 0 && (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ fontSize: '9px', background: '#7C3AED' }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <CatalogSidebar filters={filters} onChange={setFilters} />
          </div>

          {/* Mobile sidebar overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 lg:hidden"
              >
                <div
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                  className="absolute right-0 top-0 bottom-0 w-80 overflow-y-auto p-4"
                  style={{ background: '#0A0A0F', borderLeft: '1px solid rgba(124,58,237,0.15)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-bold text-white">Фильтры</h3>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <CatalogSidebar filters={filters} onChange={setFilters} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Products area */}
          <div className="flex-1 min-w-0">
            {/* Results row */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-500 text-sm font-body">
                Найдено:{' '}
                <span className="text-white font-semibold">{filtered.length}</span>{' '}
                {filtered.length === 1 ? 'игра' : filtered.length < 5 ? 'игры' : 'игр'}
              </p>
              {(search || activeFilterCount > 0) && (
                <motion.button
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => { setSearch(''); setFilters(defaultFilters); }}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#9D60FA] transition-colors"
                >
                  <X className="w-3 h-3" />
                  Сбросить всё
                </motion.button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {filtered.length > 0 ? (
                <motion.div
                  key={`${sort}-${view}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={
                    view === 'grid'
                      ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4'
                      : 'flex flex-col gap-4'
                  }
                >
                  {filtered.map((product, i) =>
                    view === 'grid' ? (
                      <ProductCard key={product.id} product={product} index={i} />
                    ) : (
                      <ListProductCard key={product.id} product={product} />
                    ),
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-24 text-center"
                >
                  <div
                    className="text-5xl mb-5 p-4 rounded-2xl"
                    style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    🎮
                  </div>
                  <h3 className="font-heading font-bold text-xl text-white mb-2">
                    Ничего не найдено
                  </h3>
                  <p className="text-gray-500 font-body text-sm mb-6">
                    Попробуйте изменить фильтры или поисковый запрос
                  </p>
                  <button
                    onClick={() => { setSearch(''); setFilters(defaultFilters); }}
                    className="font-heading font-semibold text-sm px-5 py-2.5 rounded-xl text-white transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.8), rgba(76,29,149,0.9))',
                      border: '1px solid rgba(124,58,237,0.4)',
                    }}
                  >
                    Сбросить фильтры
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── List view card ─────────────────────────────────────── */
function ListProductCard({ product }: { product: Product }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Link
        href={`/product/${product.id}`}
        className="group flex gap-4 rounded-xl p-3.5 transition-all duration-300 block"
        style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)' }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = 'rgba(124,58,237,0.35)';
          el.style.boxShadow = '0 0 24px rgba(124,58,237,0.1), 0 8px 32px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = 'rgba(255,255,255,0.06)';
          el.style.boxShadow = 'none';
        }}
      >
        {/* Image */}
        <div className="relative w-20 h-[104px] rounded-xl overflow-hidden flex-shrink-0">
          <Image
            src={product.image}
            alt={product.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-400 group-hover:scale-[1.06]"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(13,13,22,0.5) 100%)' }}
          />
          {product.discount && (
            <div
              className="absolute top-1.5 left-1.5 font-pixel rounded"
              style={{
                fontSize: '7px',
                background: '#EF4444',
                color: '#fff',
                padding: '2px 5px',
                letterSpacing: '0.04em',
              }}
            >
              -{product.discount}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {product.subtitle && (
                <p className="font-body mb-0.5 truncate" style={{ fontSize: '11px', color: '#374151' }}>
                  {product.subtitle}
                </p>
              )}
              <h3 className="font-heading font-bold text-white mb-1.5 line-clamp-1" style={{ fontSize: '14.5px' }}>
                {product.title}
              </h3>
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B] flex-shrink-0" />
                  <span className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>
                    {product.rating}
                  </span>
                  <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
                    ({product.reviews.toLocaleString()})
                  </span>
                </div>
                <span style={{ color: '#1F2937', fontSize: '10px' }}>·</span>
                <div className="flex items-center gap-0.5">
                  <Zap style={{ width: '10px', height: '10px', color: '#22C55E', flexShrink: 0 }} />
                  <span className="font-body text-[#22C55E]" style={{ fontSize: '10.5px' }}>Мгновенно</span>
                </div>
                <span style={{ color: '#1F2937', fontSize: '10px' }}>·</span>
                <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>RU/CIS</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {product.platform.slice(0, 3).map((p) => (
                  <span
                    key={p}
                    className="font-pixel"
                    style={{
                      fontSize: '7px',
                      letterSpacing: '0.05em',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#6B7280',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Price + button */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="text-right">
                <p className="font-heading font-bold text-white" style={{ fontSize: '16px', lineHeight: 1 }}>
                  {formatPrice(product.price)}
                </p>
                {product.originalPrice && (
                  <p className="font-body line-through mt-0.5" style={{ fontSize: '11.5px', color: '#374151' }}>
                    {formatPrice(product.originalPrice)}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => e.preventDefault()}
                className="group/btn relative inline-flex items-center gap-1.5 rounded-lg overflow-hidden font-heading font-semibold text-white"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  boxShadow: '0 0 0 1px rgba(124,58,237,0.3)',
                }}
              >
                <span
                  className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%)' }}
                />
                <ShoppingCart className="w-3 h-3 relative z-10" />
                <span className="relative z-10">В корзину</span>
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
