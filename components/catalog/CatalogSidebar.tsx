'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { categories, platforms, PRICE_MIN, PRICE_MAX } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';
import { useDict } from '@/lib/locale/client';

export interface Filters {
  categories: string[];
  platforms: string[];
  minPrice: number;
  maxPrice: number;
  onlyDeals: boolean;
  onlyPreorder: boolean;
}

export const defaultFilters: Filters = {
  categories: [],
  platforms: [],
  minPrice: PRICE_MIN,
  maxPrice: PRICE_MAX,
  onlyDeals: false,
  onlyPreorder: false,
};

interface SidebarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#1E1E2E] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-4 text-left"
      >
        <span className="font-heading font-semibold text-sm text-white">{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PriceRangeSlider({
  minVal,
  maxVal,
  onChange,
}: {
  minVal: number;
  maxVal: number;
  onChange: (min: number, max: number) => void;
}) {
  const c = useDict().catalog;
  const trackRef = useRef<HTMLDivElement>(null);
  const step = 10000;
  const range = PRICE_MAX - PRICE_MIN;

  const minPercent = ((minVal - PRICE_MIN) / range) * 100;
  const maxPercent = ((maxVal - PRICE_MIN) / range) * 100;

  const handleMin = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Math.min(+e.target.value, maxVal - step);
      onChange(v, maxVal);
    },
    [maxVal, onChange],
  );

  const handleMax = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Math.max(+e.target.value, minVal + step);
      onChange(minVal, v);
    },
    [minVal, onChange],
  );

  return (
    <div className="px-1 pt-1 pb-2">
      {/* Track */}
      <div ref={trackRef} className="relative h-1 mx-2 mb-5">
        <div className="absolute inset-0 rounded-full" style={{ background: '#1A1A28' }} />
        <div
          className="absolute h-full rounded-full"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
            background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
            boxShadow: '0 0 8px rgba(124,58,237,0.4)',
          }}
        />
        {/* Min thumb visual */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full bg-white border-2 border-[#7C3AED] pointer-events-none"
          style={{ left: `calc(${minPercent}% - 9px)`, boxShadow: '0 0 8px rgba(124,58,237,0.5)', zIndex: 3 }}
        />
        {/* Max thumb visual */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full bg-white border-2 border-[#06B6D4] pointer-events-none"
          style={{ left: `calc(${maxPercent}% - 9px)`, boxShadow: '0 0 8px rgba(6,182,212,0.5)', zIndex: 3 }}
        />
      </div>

      {/* Invisible inputs for interaction */}
      <div className="relative" style={{ height: 0 }}>
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={step}
          value={minVal}
          onChange={handleMin}
          className="price-slider absolute w-full"
          style={{ top: '-20px', zIndex: minVal > PRICE_MAX - step ? 5 : 4 }}
        />
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={step}
          value={maxVal}
          onChange={handleMax}
          className="price-slider absolute w-full"
          style={{ top: '-20px', zIndex: 4 }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-4">
        <div
          className="rounded-lg px-2.5 py-1"
          style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
        >
          <span className="font-body text-[#9D60FA]" style={{ fontSize: '11px' }}>
            {c.from} {formatPrice(minVal)}
          </span>
        </div>
        <div
          className="rounded-lg px-2.5 py-1"
          style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}
        >
          <span className="font-body text-[#22D3EE]" style={{ fontSize: '11px' }}>
            {c.to} {formatPrice(maxVal)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CatalogSidebar({ filters, onChange }: SidebarProps) {
  const c = useDict().catalog;
  const toggleCategory = (id: string) => {
    const next = filters.categories.includes(id)
      ? filters.categories.filter((c) => c !== id)
      : [...filters.categories, id];
    onChange({ ...filters, categories: next });
  };

  const togglePlatform = (p: string) => {
    const next = filters.platforms.includes(p)
      ? filters.platforms.filter((x) => x !== p)
      : [...filters.platforms, p];
    onChange({ ...filters, platforms: next });
  };

  const isPriceChanged = filters.minPrice !== PRICE_MIN || filters.maxPrice !== PRICE_MAX;

  const activeCount =
    filters.categories.length +
    filters.platforms.length +
    (isPriceChanged ? 1 : 0) +
    (filters.onlyDeals ? 1 : 0) +
    (filters.onlyPreorder ? 1 : 0);

  const hasActiveFilters = activeCount > 0;
  const reset = () => onChange(defaultFilters);

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div
        className="rounded-2xl p-5 sticky top-[108px]"
        style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#7C3AED]" />
            <h3 className="font-heading font-semibold text-white text-sm">{c.filters}</h3>
            {hasActiveFilters && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold"
                style={{ fontSize: '9px', background: '#7C3AED', boxShadow: '0 0 8px rgba(124,58,237,0.5)' }}
              >
                {activeCount}
              </motion.span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={reset}
              className="flex items-center gap-1 text-gray-500 hover:text-[#9D60FA] text-xs transition-colors"
            >
              <X className="w-3 h-3" />
              {c.reset}
            </button>
          )}
        </div>

        {/* Quick toggles */}
        <div className="space-y-2 mb-3">
          <label
            className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200"
            style={{
              background: filters.onlyDeals
                ? 'rgba(239,68,68,0.08)'
                : 'rgba(124,58,237,0.05)',
              border: `1px solid ${filters.onlyDeals ? 'rgba(239,68,68,0.25)' : 'rgba(124,58,237,0.15)'}`,
            }}
          >
            <span className="text-sm font-body text-white">{c.onlyDeals}</span>
            <div
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0`}
              style={{
                background: filters.onlyDeals
                  ? 'linear-gradient(90deg, #EF4444, #F97316)'
                  : '#1E1E2E',
              }}
              onClick={() => onChange({ ...filters, onlyDeals: !filters.onlyDeals })}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  filters.onlyDeals ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </label>

          <label
            className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200"
            style={{
              background: filters.onlyPreorder
                ? 'rgba(6,182,212,0.08)'
                : 'rgba(124,58,237,0.05)',
              border: `1px solid ${filters.onlyPreorder ? 'rgba(6,182,212,0.25)' : 'rgba(124,58,237,0.15)'}`,
            }}
          >
            <span className="text-sm font-body text-white">{c.preorder}</span>
            <div
              className="relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0"
              style={{
                background: filters.onlyPreorder
                  ? 'linear-gradient(90deg, #06B6D4, #7C3AED)'
                  : '#1E1E2E',
              }}
              onClick={() => onChange({ ...filters, onlyPreorder: !filters.onlyPreorder })}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  filters.onlyPreorder ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </label>
        </div>

        {/* Categories */}
        <Section title={c.category}>
          <div className="space-y-1">
            {categories.map((cat) => {
              const active = filters.categories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-200 group"
                  style={{
                    background: active ? `${cat.color}12` : 'transparent',
                    border: `1px solid ${active ? `${cat.color}40` : 'transparent'}`,
                    color: active ? '#E2E8F0' : '#6B7280',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = '#1A1A28';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{cat.icon}</span>
                    <span className="font-body text-sm">{cat.name}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: active ? cat.color : '#374151' }}>{cat.count}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Platforms */}
        <Section title={c.platform}>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => {
              const active = filters.platforms.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all duration-200"
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, #7C3AED, #06B6D4)'
                      : '#0A0A0F',
                    border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.07)'}`,
                    color: active ? '#fff' : '#6B7280',
                    boxShadow: active ? '0 0 10px rgba(124,58,237,0.3)' : 'none',
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Price range */}
        <Section title={c.price}>
          <PriceRangeSlider
            minVal={filters.minPrice}
            maxVal={filters.maxPrice}
            onChange={(min, max) => onChange({ ...filters, minPrice: min, maxPrice: max })}
          />
        </Section>
      </div>
    </aside>
  );
}
