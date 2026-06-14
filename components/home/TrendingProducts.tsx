'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import GameCard from '@/components/catalog/GameCard';
import type { GameListItem } from '@/lib/db/games';
import { useDict } from '@/lib/locale/client';

export default function TrendingProducts({ games }: { games: GameListItem[] }) {
  const s = useDict().home.sections;
  return (
    <section className="py-16 sm:py-20 bg-[#0A0A0F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#7C3AED]" />
              <p className="text-[#7C3AED] text-xs font-heading font-semibold tracking-widest uppercase">{s.trendLabel}</p>
            </div>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white">{s.trendTitle}</h2>
          </div>
          <Link
            href="/catalog?sort=popular"
            className="text-sm text-gray-400 hover:text-[#9D60FA] transition-colors font-body hidden sm:block"
          >
            {s.seeAll} →
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {games.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/catalog?sort=popular"
            className="inline-flex items-center gap-2 bg-[#12121A] border border-[#1E1E2E] text-white text-sm font-heading font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:border-[#7C3AED]/50"
          >
            {s.seeAll} →
          </Link>
        </div>
      </div>
    </section>
  );
}
