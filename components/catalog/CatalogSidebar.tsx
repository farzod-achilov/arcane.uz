'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { categories, platforms, priceRanges } from '@/lib/mockData';

interface Filters {
  categories: string[];
  platforms: string[];
  priceRange: number;
  onlyDeals: boolean;
}

interface SidebarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#1E1E2E] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-4 text-left"
      >
        <span className="font-heading font-semibold text-sm text-white">{title}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
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

export default function CatalogSidebar({ filters, onChange }: SidebarProps) {
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

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.platforms.length > 0 ||
    filters.priceRange !== -1 ||
    filters.onlyDeals;

  const reset = () => onChange({ categories: [], platforms: [], priceRange: -1, onlyDeals: false });

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5 sticky top-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#7C3AED]" />
            <h3 className="font-heading font-semibold text-white text-sm">Фильтры</h3>
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-[9px] font-bold">
                {filters.categories.length + filters.platforms.length + (filters.priceRange !== -1 ? 1 : 0) + (filters.onlyDeals ? 1 : 0)}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={reset}
              className="flex items-center gap-1 text-gray-500 hover:text-[#9D60FA] text-xs transition-colors"
            >
              <X className="w-3 h-3" />
              Сбросить
            </button>
          )}
        </div>

        {/* Deals toggle */}
        <div className="mb-4 p-3 bg-gradient-to-r from-[#7C3AED]/10 to-[#06B6D4]/10 border border-[#7C3AED]/20 rounded-xl">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                filters.onlyDeals ? 'bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]' : 'bg-[#1E1E2E]'
              }`}
              onClick={() => onChange({ ...filters, onlyDeals: !filters.onlyDeals })}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${filters.onlyDeals ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm font-body text-white">Только со скидкой</span>
          </label>
        </div>

        {/* Categories */}
        <Section title="Категории">
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-200 group ${
                  filters.categories.includes(cat.id)
                    ? 'bg-[#7C3AED]/15 border border-[#7C3AED]/40 text-white'
                    : 'hover:bg-[#1A1A28] text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{cat.icon}</span>
                  <span className="font-body text-sm">{cat.name}</span>
                </div>
                <span className="text-[10px] text-gray-600">{cat.count}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Platforms */}
        <Section title="Платформа">
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all duration-200 ${
                  filters.platforms.includes(p)
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white shadow-[0_0_10px_rgba(124,58,237,0.3)]'
                    : 'bg-[#0A0A0F] border border-[#1E1E2E] text-gray-400 hover:border-[#7C3AED]/40 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </Section>

        {/* Price */}
        <Section title="Цена">
          <div className="space-y-1">
            {priceRanges.map((range, i) => (
              <button
                key={i}
                onClick={() => onChange({ ...filters, priceRange: filters.priceRange === i ? -1 : i })}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                  filters.priceRange === i
                    ? 'bg-[#7C3AED]/15 border border-[#7C3AED]/40 text-white'
                    : 'hover:bg-[#1A1A28] text-gray-400 hover:text-white'
                }`}
              >
                <span className="font-body">{range.label}</span>
              </button>
            ))}
          </div>
        </Section>
      </div>
    </aside>
  );
}
