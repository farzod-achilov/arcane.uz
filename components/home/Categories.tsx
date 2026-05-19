'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Target, Wand2, Crown, Trophy,
  Flame, Gauge, Compass, Zap,
  ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { categories } from '@/lib/mockData';

/* ── Icon map (replaces emojis) ───────────────────────── */
const iconMap: Record<string, LucideIcon> = {
  shooters:  Target,
  rpg:       Wand2,
  strategy:  Crown,
  sports:    Trophy,
  horror:    Flame,
  racing:    Gauge,
  adventure: Compass,
  fighting:  Zap,
};

export default function Categories() {
  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Header ── */}
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
              Разделы
            </p>
            <h2
              className="font-heading font-bold text-white"
              style={{ fontSize: 'clamp(20px, 2.5vw, 26px)' }}
            >
              Категории игр
            </h2>
          </div>

          <Link
            href="/catalog"
            className="hidden sm:inline-flex items-center gap-1.5 font-body transition-all duration-200 group"
            style={{ fontSize: '13px', color: '#4B5563' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#9D60FA'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#4B5563'; }}
          >
            <span>Все категории</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {categories.map((cat, i) => {
            const Icon = iconMap[cat.id] ?? Target;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.045, ease: 'easeOut' }}
              >
                <CategoryCard cat={cat} Icon={Icon} />
              </motion.div>
            );
          })}
        </div>

        {/* Mobile: see all */}
        <div className="mt-5 text-center sm:hidden">
          <Link
            href="/catalog"
            className="font-body transition-colors duration-200 text-[#4B5563] hover:text-[#9D60FA]"
            style={{ fontSize: '13px' }}
          >
            Все категории →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Category Card ────────────────────────────────────── */
function CategoryCard({
  cat,
  Icon,
}: {
  cat: { id: string; name: string; count: number; color: string };
  Icon: LucideIcon;
}) {
  const handleEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget as HTMLElement;
    el.style.borderColor = cat.color + '55';
    el.style.boxShadow = `0 0 22px ${cat.color}22, 0 6px 24px rgba(0,0,0,0.4)`;
    el.style.background = '#11111C';
  };
  const handleLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget as HTMLElement;
    el.style.borderColor = 'rgba(255,255,255,0.055)';
    el.style.boxShadow = 'none';
    el.style.background = '#0D0D16';
  };

  return (
    <Link
      href={`/catalog?category=${cat.id}`}
      className="group relative flex flex-col items-center gap-2.5 rounded-2xl p-4 overflow-hidden transition-all duration-300"
      style={{
        background: '#0D0D16',
        border: '1px solid rgba(255,255,255,0.055)',
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Radial glow from top on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-350 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${cat.color}18 0%, transparent 100%)`,
        }}
      />

      {/* Icon container */}
      <div
        className="relative z-10 w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
        style={{
          background: cat.color + '14',
          border: `1px solid ${cat.color}28`,
        }}
      >
        {/* Icon glow on hover */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: cat.color + '20', boxShadow: `0 0 14px ${cat.color}35` }}
        />
        <Icon
          className="relative z-10 transition-transform duration-300 group-hover:scale-110"
          style={{ width: '17px', height: '17px', color: cat.color }}
        />
      </div>

      {/* Text */}
      <div className="relative z-10 text-center">
        <p
          className="font-heading font-semibold text-[#C4C4D4] group-hover:text-white transition-colors duration-200"
          style={{ fontSize: '11.5px', lineHeight: 1.2 }}
        >
          {cat.name}
        </p>
        <p
          className="font-body mt-0.5"
          style={{ fontSize: '10px', color: '#4B5563' }}
        >
          {cat.count} игр
        </p>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
        style={{
          background: cat.color,
          width: '32px',
          boxShadow: `0 0 8px ${cat.color}`,
        }}
      />
    </Link>
  );
}
