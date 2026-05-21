'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CASES_LIST, RARITY_META, Rarity, pickWeightedReward } from '@/lib/casesData';
import { cn } from '@/lib/utils';

// ── Mock players ──────────────────────────────────────────────────────────────
const PLAYERS = [
  'Farzod', 'Shadow_X', 'NightOwl', 'Player_17', 'CyberAce',
  'Ghost99', 'ArcadeKing', 'Ninja_UZ', 'Pro_Gamer', 'StealthZ',
  'VoidWalker', 'UltraMax', 'DarkStar', 'BlazeFire', 'IceBreaker',
];

interface DropEntry {
  id:        number;
  player:    string;
  icon:      string;
  reward:    string;
  caseTitle: string;
  rarity:    Rarity;
  ts:        number;
}

function randomDrop(): DropEntry {
  const caseConfig = CASES_LIST[Math.floor(Math.random() * CASES_LIST.length)];
  const reward     = pickWeightedReward(caseConfig.rewards);
  return {
    id:        Date.now() + Math.random(),
    player:    PLAYERS[Math.floor(Math.random() * PLAYERS.length)],
    icon:      reward.icon,
    reward:    reward.displayValue,
    caseTitle: caseConfig.title,
    rarity:    reward.rarity,
    ts:        Date.now(),
  };
}

// Seed with initial drops so the feed isn't empty on mount
function seedDrops(n: number): DropEntry[] {
  return Array.from({ length: n }, () => randomDrop());
}

// ── Drop Row ──────────────────────────────────────────────────────────────────
function DropRow({ drop }: { drop: DropEntry }) {
  const meta = RARITY_META[drop.rarity];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
      className={cn(
        'flex items-center gap-2.5 p-2.5 rounded-lg border',
        'bg-bg-card/60 backdrop-blur-sm',
        meta.border,
      )}
    >
      {/* Rarity dot */}
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', meta.dotColor)} />

      {/* Icon */}
      <span className="text-xl leading-none flex-shrink-0">{drop.icon}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">
          <span className="text-white/60">{drop.player}</span>{' '}
          получил{' '}
          <span className={cn('font-bold', meta.textColor)}>{drop.reward}</span>
        </p>
        <p className="text-[10px] text-white/40 truncate">{drop.caseTitle}</p>
      </div>

      {/* Rarity badge */}
      <span className={cn('text-[9px] font-bold uppercase tracking-wider flex-shrink-0', meta.textColor)}>
        {meta.label}
      </span>
    </motion.div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export function LiveDropFeed({ className }: { className?: string }) {
  const [drops, setDrops] = useState<DropEntry[]>(() => seedDrops(8));
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function schedule() {
      // New drop every 3–9 seconds for an organic feel
      const delay = 3000 + Math.random() * 6000;
      timeoutRef.current = setTimeout(() => {
        setDrops((prev) => [randomDrop(), ...prev].slice(0, 20));
        schedule();
      }, delay);
    }
    schedule();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <motion.div
          className="w-2 h-2 rounded-full bg-green-400"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">
          Live Drops
        </h3>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-1.5 overflow-hidden" style={{ maxHeight: 420 }}>
        <AnimatePresence initial={false}>
          {drops.map((d) => (
            <DropRow key={d.id} drop={d} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
