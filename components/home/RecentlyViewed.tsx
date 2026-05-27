'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import GameCard from '@/components/catalog/GameCard';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import type { GameListItem } from '@/lib/db/games';

export default function RecentlyViewed() {
  const { ids } = useRecentlyViewed();
  const [games,   setGames]   = useState<GameListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ids.length) return;
    setLoading(true);
    fetch(`/api/games/batch?ids=${ids.join(',')}`)
      .then(r => r.json())
      .then((d: { items?: GameListItem[] }) => setGames(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ids.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ids.length || (!loading && games.length === 0)) return null;

  return (
    <section className="py-10 relative" style={{ background: '#07070F' }}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="flex items-center gap-2.5">
            <div style={{ width: '3px', height: '20px', background: 'linear-gradient(to bottom, #06B6D4, #7C3AED)', borderRadius: '2px' }} />
            <Clock style={{ width: '15px', height: '15px', color: '#06B6D4' }} />
            <h2 className="font-heading font-bold text-white" style={{ fontSize: '18px' }}>
              Вы смотрели
            </h2>
          </div>
          <span className="font-body text-[#374151]" style={{ fontSize: '12px' }}>
            {games.length} {games.length === 1 ? 'игра' : games.length < 5 ? 'игры' : 'игр'}
          </span>
        </motion.div>

        {/* Scroll strip */}
        {loading ? (
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 rounded-xl animate-pulse"
                style={{ width: '160px', aspectRatio: '2/3', background: 'rgba(255,255,255,0.04)' }}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex gap-4 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {games.map((game, i) => (
              <div key={game.id} className="flex-shrink-0" style={{ width: '160px' }}>
                <GameCard game={game} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
