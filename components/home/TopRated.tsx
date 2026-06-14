'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Star } from 'lucide-react';
import GameCard from '@/components/catalog/GameCard';
import type { GameListItem } from '@/lib/db/games';

export default function TopRated({ games }: { games: GameListItem[] }) {
  if (!games.length) return null;

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
              <Star className="w-4 h-4 text-[#F59E0B]" />
              <p className="text-[#F59E0B] text-xs font-heading font-semibold tracking-widest uppercase">Оценка игроков</p>
            </div>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white">Топ по рейтингу</h2>
          </div>
          <Link
            href="/catalog?sort=rating"
            className="text-sm text-gray-400 hover:text-[#F59E0B] transition-colors font-body hidden sm:block"
          >
            Смотреть все →
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {games.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/catalog?sort=rating"
            className="inline-flex items-center gap-2 bg-[#12121A] border border-[#1E1E2E] text-white text-sm font-heading font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:border-[#F59E0B]/50"
          >
            Смотреть все →
          </Link>
        </div>
      </div>
    </section>
  );
}
