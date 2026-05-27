'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import CatalogToolbar from '@/components/catalog/CatalogToolbar';
import CatalogGenreFilter from '@/components/catalog/CatalogGenreFilter';
import CatalogPagination from '@/components/catalog/CatalogPagination';
import GameCard from '@/components/catalog/GameCard';
import GameListCard from '@/components/catalog/GameListCard';
import type { GameListItem } from '@/lib/db/games';

interface Props {
  games:            GameListItem[];
  total:            number;
  pages:            number;
  page:             number;
  genres:           string[];
  currentGenres:    string[];
  currentPlatform:  string;
  currentSort:      string;
  currentView:      string;
  currentQ:         string;
  currentPriceMin?: number;
  currentPriceMax?: number;
}

export default function CatalogContent({
  games, total, pages, page, genres,
  currentGenres, currentPlatform, currentSort, currentView, currentQ,
  currentPriceMin, currentPriceMax,
}: Props) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const PRICE_MAX = 3_000_000;
  const hasPriceFilter = (currentPriceMin != null && currentPriceMin > 0) || (currentPriceMax != null && currentPriceMax < PRICE_MAX);
  const activeFilters = currentGenres.length + (currentPlatform ? 1 : 0) + (hasPriceFilter ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Toolbar */}
      <div className="mb-6">
        <CatalogToolbar
          total={total}
          currentSort={currentSort}
          currentView={currentView}
          currentQ={currentQ}
          onMobileFilterToggle={() => setMobileFilterOpen(true)}
          activeFilters={activeFilters}
        />
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block flex-shrink-0 w-56">
          <CatalogGenreFilter
            genres={genres}
            currentGenres={currentGenres}
            currentPlatform={currentPlatform}
            currentPriceMin={currentPriceMin}
            currentPriceMax={currentPriceMax}
          />
        </aside>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {mobileFilterOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden"
            >
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileFilterOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="absolute left-0 top-0 bottom-0 w-72 overflow-y-auto p-5"
                style={{ background: '#0A0A0F', borderRight: '1px solid rgba(124,58,237,0.15)' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-heading font-bold text-white">Фильтры</h3>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <CatalogGenreFilter
                  genres={genres}
                  currentGenres={currentGenres}
                  currentPlatform={currentPlatform}
                  currentPriceMin={currentPriceMin}
                  currentPriceMax={currentPriceMax}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Games area */}
        <div className="flex-1 min-w-0">
          {games.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-5 p-4 rounded-2xl"
                   style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.06)' }}>
                🎮
              </div>
              <h3 className="font-heading font-bold text-xl text-white mb-2">Ничего не найдено</h3>
              <p className="text-gray-500 font-body text-sm">
                Попробуйте изменить фильтры или поисковый запрос
              </p>
            </div>
          ) : currentView === 'list' ? (
            <div className="flex flex-col gap-3">
              {games.map((g) => <GameListCard key={g.id} game={g} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {games.map((g, i) => <GameCard key={g.id} game={g} index={i} />)}
            </div>
          )}

          {pages > 1 && (
            <CatalogPagination page={page} pages={pages} total={total} />
          )}
        </div>
      </div>
    </div>
  );
}
