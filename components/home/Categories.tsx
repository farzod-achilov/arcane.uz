'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Target, Wand2, Crown, Trophy,
  Flame, Gauge, Compass, Zap,
  Sword, Puzzle, Cpu, Car, ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDict } from '@/lib/locale/client';

type GenreItem = { name: string; count: number };

/* ── Genre → icon + color ── */
function genreConfig(name: string): { icon: LucideIcon; color: string } {
  const key = name.toLowerCase();
  if (key.includes('action'))     return { icon: Target,  color: '#EF4444' };
  if (key.includes('rpg') || key.includes('role')) return { icon: Wand2, color: '#7C3AED' };
  if (key.includes('strategy'))   return { icon: Crown,   color: '#06B6D4' };
  if (key.includes('sport'))      return { icon: Trophy,  color: '#22C55E' };
  if (key.includes('horror'))     return { icon: Flame,   color: '#F59E0B' };
  if (key.includes('racing') || key.includes('car')) return { icon: Car, color: '#F97316' };
  if (key.includes('adventure'))  return { icon: Compass, color: '#8B5CF6' };
  if (key.includes('fight'))      return { icon: Zap,     color: '#EC4899' };
  if (key.includes('shoot') || key.includes('fps')) return { icon: Target, color: '#EF4444' };
  if (key.includes('simulat'))    return { icon: Cpu,     color: '#3B82F6' };
  if (key.includes('puzzle'))     return { icon: Puzzle,  color: '#14B8A6' };
  return { icon: Sword, color: '#9CA3AF' };
}

export default function Categories({ genres }: { genres: GenreItem[] }) {
  const s = useDict().home.sections;
  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-end justify-between mb-7"
        >
          <div>
            <p
              className="font-heading font-semibold text-[#7C3AED] mb-1.5"
              style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}
            >
              {s.catLabel}
            </p>
            <h2
              className="font-heading font-bold text-white"
              style={{ fontSize: 'clamp(20px, 2.5vw, 26px)' }}
            >
              {s.catTitle}
            </h2>
          </div>
          <Link
            href="/catalog"
            className="hidden sm:inline-flex items-center gap-1.5 font-body transition-all duration-200 group"
            style={{ fontSize: '13px', color: '#4B5563' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#9D60FA'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#4B5563'; }}
          >
            <span>{s.catSeeAll}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {genres.map((genre, i) => {
            const { icon: Icon, color } = genreConfig(genre.name);
            return (
              <motion.div
                key={genre.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.045, ease: 'easeOut' }}
              >
                <Link
                  href={`/catalog?genre=${encodeURIComponent(genre.name)}`}
                  className="group relative flex flex-col items-center gap-2.5 rounded-2xl p-4 overflow-hidden transition-all duration-300"
                  style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.055)' }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = color + '55';
                    el.style.boxShadow = `0 0 22px ${color}22, 0 6px 24px rgba(0,0,0,0.4)`;
                    el.style.background = '#11111C';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'rgba(255,255,255,0.055)';
                    el.style.boxShadow = 'none';
                    el.style.background = '#0D0D16';
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-350 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${color}18 0%, transparent 100%)` }}
                  />
                  <div
                    className="relative z-10 w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                    style={{ background: color + '14', border: `1px solid ${color}28` }}
                  >
                    <div
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: color + '20', boxShadow: `0 0 14px ${color}35` }}
                    />
                    <Icon
                      className="relative z-10 transition-transform duration-300 group-hover:scale-110"
                      style={{ width: '17px', height: '17px', color }}
                    />
                  </div>
                  <div className="relative z-10 text-center">
                    <p
                      className="font-heading font-semibold text-[#C4C4D4] group-hover:text-white transition-colors duration-200"
                      style={{ fontSize: '11.5px', lineHeight: 1.2 }}
                    >
                      {genre.name}
                    </p>
                    <p className="font-body mt-0.5" style={{ fontSize: '10px', color: '#4B5563' }}>
                      {genre.count} {s.gamesCount}
                    </p>
                  </div>
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                    style={{ background: color, width: '32px', boxShadow: `0 0 8px ${color}` }}
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-5 text-center sm:hidden">
          <Link href="/catalog" className="font-body transition-colors duration-200 text-[#4B5563] hover:text-[#9D60FA]" style={{ fontSize: '13px' }}>
            {s.catSeeAll} →
          </Link>
        </div>
      </div>
    </section>
  );
}
