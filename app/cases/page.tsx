'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CASES_LIST, RARITY_META, Rarity } from '@/lib/casesData';
import { CaseCard } from '@/components/cases/CaseCard';
import { LiveDropFeed } from '@/components/cases/LiveDropFeed';

// ── Rarity legend ─────────────────────────────────────────────────────────────
const RARITIES: { rarity: Rarity; pct: string }[] = [
  { rarity: 'common',    pct: '60%' },
  { rarity: 'rare',      pct: '25%' },
  { rarity: 'epic',      pct: '10%' },
  { rarity: 'legendary', pct: '4%'  },
  { rarity: 'arcane',    pct: '1%'  },
];

function RarityLegend() {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {RARITIES.map(({ rarity, pct }) => {
        const meta = RARITY_META[rarity];
        return (
          <div key={rarity} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: meta.color, boxShadow: `0 0 6px ${meta.color}` }}
            />
            <span className={`text-xs font-semibold ${meta.textColor}`}>{meta.label}</span>
            <span className="text-xs text-white/30">{pct}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CasesPage() {
  const [showDrops, setShowDrops] = useState(false);

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Background glow field */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-accent-purple/10 blur-[100px]" />
          <div className="absolute top-1/2 right-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-accent-cyan/10 blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          {/* Pre-title */}
          <motion.p
            className="text-xs font-black uppercase tracking-[0.3em] text-accent-cyan mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            ⚡ Mystery Reward System
          </motion.p>

          {/* Main title */}
          <motion.h1
            className="text-4xl sm:text-6xl font-black text-white mb-4 leading-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            ARCANE{' '}
            <span className="bg-gradient-to-r from-accent-purple via-violet-400 to-accent-cyan bg-clip-text text-transparent">
              КЕЙСЫ
            </span>
          </motion.h1>

          <motion.p
            className="text-sm sm:text-base text-white/50 max-w-lg mx-auto mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Открывай кейсы и выигрывай игры, монеты и эксклюзивные бандлы.
            Каждое открытие — уникальный опыт.
          </motion.p>

          {/* Rarity legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <RarityLegend />
          </motion.div>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {/* Toggle: show drop chances */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-black text-white uppercase tracking-wider">
            Выбери кейс
          </h2>
          <button
            onClick={() => setShowDrops((v) => !v)}
            className="text-xs font-bold uppercase tracking-wider text-white/40
                       hover:text-white/80 transition-colors flex items-center gap-1.5"
          >
            <span className={showDrops ? 'text-accent-cyan' : ''}>
              {showDrops ? '▲' : '▼'}
            </span>
            {showDrops ? 'Скрыть шансы' : 'Показать шансы'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
          {/* Case cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">
            {CASES_LIST.map((c, i) => (
              <motion.div
                key={c.id}
                className="flex"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <CaseCard caseConfig={c} showDrops={showDrops} className="w-full" />
              </motion.div>
            ))}
          </div>

          {/* Live drop feed */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24 rounded-2xl border border-white/10 bg-bg-card/50 backdrop-blur-sm p-4">
              <LiveDropFeed />
            </div>
          </motion.div>
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 rounded-2xl border border-white/10 bg-bg-card/30 p-8"
        >
          <h2 className="text-xl font-black text-white mb-6 text-center uppercase tracking-wider">
            Как это работает
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: '📦', title: 'Выбери кейс',   desc: 'Silver, Gold или Arcane — каждый с уникальными наградами и шансами' },
              { icon: '🎰', title: 'Открой',          desc: 'Смотри на рулетку с кинематографической анимацией замедления' },
              { icon: '🏆', title: 'Получи награду',  desc: 'Монеты, скидки, инди-игры, AAA тайтлы или эксклюзивные Arcane бандлы' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-bg-elevated border border-white/10 flex items-center justify-center text-2xl">
                  {step.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-white mb-1">{step.title}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
