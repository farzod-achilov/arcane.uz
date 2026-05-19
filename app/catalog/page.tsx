'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import CatalogSidebar from '@/components/catalog/CatalogSidebar';
import { products, priceRanges } from '@/lib/mockData';

interface Filters {
  categories: string[];
  platforms: string[];
  priceRange: number;
  onlyDeals: boolean;
}

const sortOptions = [
  { value: 'trending', label: 'По популярности' },
  { value: 'price_asc', label: 'Дешевле' },
  { value: 'price_desc', label: 'Дороже' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'newest', label: 'Новинки' },
];

export default function CatalogPage() {
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    platforms: [],
    priceRange: -1,
    onlyDeals: false,
  });
  const [sort, setSort] = useState('trending');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = [...products];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q));
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
    if (filters.priceRange !== -1) {
      const range = priceRanges[filters.priceRange];
      result = result.filter((p) => p.price >= range.min && p.price <= range.max);
    }

    switch (sort) {
      case 'price_asc': result.sort((a, b) => a.price - b.price); break;
      case 'price_desc': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'newest': result.sort((a, b) => (b.badge === 'new' ? 1 : 0) - (a.badge === 'new' ? 1 : 0)); break;
    }

    return result;
  }, [filters, sort, search]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-[108px]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#0D0A1A] to-[#0A0A0F] border-b border-[#1E1E2E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[#7C3AED] text-xs font-heading font-semibold tracking-widest uppercase mb-2">Каталог</p>
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-6">Все игры</h1>

            {/* Search + controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Поиск игр..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#12121A] border border-[#1E1E2E] focus:border-[#7C3AED]/50 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm font-body outline-none transition-colors placeholder:text-gray-600"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-[#12121A] border border-[#1E1E2E] rounded-xl px-4 py-2.5 text-white text-sm font-body outline-none cursor-pointer min-w-[180px]"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* View toggle */}
              <div className="hidden sm:flex items-center bg-[#12121A] border border-[#1E1E2E] rounded-xl p-1">
                <button
                  onClick={() => setView('grid')}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${view === 'grid' ? 'bg-[#7C3AED] text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${view === 'list' ? 'bg-[#7C3AED] text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile filter toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 bg-[#12121A] border border-[#1E1E2E] px-4 py-2.5 rounded-xl text-white text-sm font-body"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#7C3AED]" />
                Фильтры
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
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#0A0A0F] overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-white">Фильтры</h3>
                  <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <CatalogSidebar filters={filters} onChange={setFilters} />
              </div>
            </div>
          )}

          {/* Products area */}
          <div className="flex-1 min-w-0">
            {/* Results count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-500 text-sm font-body">
                Найдено: <span className="text-white font-semibold">{filtered.length}</span> игр
              </p>
            </div>

            {filtered.length > 0 ? (
              <div className={
                view === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'flex flex-col gap-4'
              }>
                {filtered.map((product, i) =>
                  view === 'grid' ? (
                    <ProductCard key={product.id} product={product} index={i} />
                  ) : (
                    <ListProductCard key={product.id} product={product} />
                  )
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-5xl mb-4">🎮</div>
                <h3 className="font-heading font-bold text-xl text-white mb-2">Ничего не найдено</h3>
                <p className="text-gray-500 font-body text-sm">Попробуйте изменить фильтры или поисковый запрос</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Zap } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

function ListProductCard({ product }: { product: Product }) {
  const discountBadge = product.discount ? (
    <span
      className="font-pixel rounded flex-shrink-0"
      style={{
        background: 'rgba(239,68,68,0.9)',
        color: '#fff',
        fontSize: '8px',
        padding: '3px 6px',
        letterSpacing: '0.04em',
        boxShadow: '0 0 8px rgba(239,68,68,0.4)',
      }}
    >
      -{product.discount}%
    </span>
  ) : null;

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex gap-4 rounded-xl p-3.5 transition-all duration-300"
      style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'rgba(124,58,237,0.38)';
        el.style.boxShadow = '0 0 24px rgba(124,58,237,0.14), 0 8px 32px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'rgba(255,255,255,0.07)';
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
          style={{
            background: 'linear-gradient(to bottom, transparent 50%, rgba(13,13,22,0.5) 100%)',
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          {/* Left */}
          <div className="min-w-0 flex-1">
            {product.subtitle && (
              <p className="font-body mb-0.5 truncate" style={{ fontSize: '11px', color: '#374151' }}>
                {product.subtitle}
              </p>
            )}
            <h3
              className="font-heading font-bold text-white mb-1.5 line-clamp-1"
              style={{ fontSize: '14.5px' }}
            >
              {product.title}
            </h3>

            {/* Rating row */}
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

            {/* Platform chips */}
            <div className="flex flex-wrap gap-1">
              {product.platform.map((p) => (
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

          {/* Right: price + badge + button */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {discountBadge}
            <div className="text-right">
              <p
                className="font-heading font-bold text-white"
                style={{ fontSize: '16px', lineHeight: 1 }}
              >
                {formatPrice(product.price)}
              </p>
              {product.originalPrice && (
                <p
                  className="font-body line-through mt-0.5"
                  style={{ fontSize: '11.5px', color: '#374151' }}
                >
                  {formatPrice(product.originalPrice)}
                </p>
              )}
            </div>
            <button
              onClick={(e) => e.preventDefault()}
              className="group/btn relative inline-flex items-center gap-1.5 rounded-lg overflow-hidden font-heading font-semibold text-white transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                padding: '6px 12px',
                fontSize: '11.5px',
                letterSpacing: '0.02em',
                boxShadow: '0 0 0 1px rgba(124,58,237,0.3)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  '0 0 16px rgba(124,58,237,0.5), 0 0 0 1px rgba(124,58,237,0.5)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  '0 0 0 1px rgba(124,58,237,0.3)';
              }}
            >
              <span
                className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%)' }}
              />
              <ShoppingCart className="w-3 h-3 relative z-10" />
              <span className="relative z-10">В корзину</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
