'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { CaseReward, RARITY_META, Rarity, pickWeightedReward, rarityRank } from '@/lib/casesData';
import { cn } from '@/lib/utils';

// ── Constants ──────────────────────────────────────────────────────────────────
const CARD_W        = 140; // px
const CARD_GAP      = 8;   // px
const ITEM_STRIDE   = CARD_W + CARD_GAP; // 148 px
const TRACK_SIZE    = 60;
const WINNER_IDX    = 44;  // winner lands here — leaves 15 buffer cards after

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildTrack(
  rewards:  CaseReward[],
  winner:   CaseReward,
  nearMiss: boolean,
): CaseReward[] {
  const track: CaseReward[] = [];

  for (let i = 0; i < TRACK_SIZE; i++) {
    if (i === WINNER_IDX) {
      track.push(winner);
      continue;
    }
    // Near-miss: place a higher-rarity item just BEFORE the winner
    if (nearMiss && i === WINNER_IDX - 1) {
      const higherOnes = rewards.filter(
        (r) => rarityRank(r.rarity) > rarityRank(winner.rarity),
      );
      track.push(
        higherOnes.length > 0
          ? higherOnes[Math.floor(Math.random() * higherOnes.length)]
          : pickWeightedReward(rewards),
      );
      continue;
    }
    track.push(pickWeightedReward(rewards));
  }

  return track;
}

// ── RouletteCard ──────────────────────────────────────────────────────────────
function RouletteCard({
  reward,
  highlight,
}: {
  reward:    CaseReward;
  highlight: boolean;
}) {
  const meta = RARITY_META[reward.rarity];

  return (
    <motion.div
      animate={highlight ? { scale: 1.06 } : { scale: 1 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'flex-shrink-0 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 p-2.5 relative overflow-hidden select-none',
        meta.border,
        meta.bg,
      )}
      style={{
        width:     CARD_W,
        height:    180,
        boxShadow: highlight ? meta.glow : undefined,
      }}
    >
      {/* Shine overlay */}
      <div
        className={cn('absolute inset-0 opacity-10 bg-gradient-to-br pointer-events-none', meta.gradient)}
      />

      {/* Rarity top bar */}
      <div
        className="absolute top-0 inset-x-0 h-0.5"
        style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }}
      />

      {/* Icon */}
      <span className="text-4xl leading-none relative z-10">{reward.icon}</span>

      {/* Name */}
      <p className="text-[11px] font-semibold text-white text-center leading-tight relative z-10 line-clamp-2 px-1">
        {reward.name}
      </p>

      {/* Rarity badge */}
      <span
        className={cn(
          'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border relative z-10',
          meta.textColor,
          meta.border,
        )}
      >
        {meta.label}
      </span>
    </motion.div>
  );
}

// ── Center Indicator ──────────────────────────────────────────────────────────
function Indicator({ spinning }: { spinning: boolean }) {
  return (
    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
      {/* Top arrow */}
      <div
        className="flex-shrink-0 w-0 h-0"
        style={{
          borderLeft:  '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop:   '11px solid #06B6D4',
          filter: spinning ? 'drop-shadow(0 0 6px #06B6D4)' : undefined,
        }}
      />
      {/* Line */}
      <motion.div
        className="flex-1 w-[2px]"
        animate={{ opacity: spinning ? [0.6, 1, 0.6] : 1 }}
        transition={{ duration: 0.8, repeat: spinning ? Infinity : 0 }}
        style={{
          background:
            'linear-gradient(to bottom, #06B6D4, rgba(6,182,212,0.15))',
          boxShadow: spinning ? '0 0 8px rgba(6,182,212,0.7)' : '0 0 4px rgba(6,182,212,0.4)',
        }}
      />
      {/* Bottom arrow */}
      <div
        className="flex-shrink-0 w-0 h-0"
        style={{
          borderLeft:   '7px solid transparent',
          borderRight:  '7px solid transparent',
          borderBottom: '11px solid #06B6D4',
          filter: spinning ? 'drop-shadow(0 0 6px #06B6D4)' : undefined,
        }}
      />
    </div>
  );
}

// ── Roulette (public API) ─────────────────────────────────────────────────────
export interface RouletteHandle {
  spin: (winner: CaseReward) => void;
}

interface RouletteProps {
  rewards:       CaseReward[];
  spinning:      boolean;
  result:        CaseReward | null;
  onSpinComplete: () => void;
  accentColor:   string;
}

export function Roulette({
  rewards,
  spinning,
  result,
  onSpinComplete,
  accentColor,
}: RouletteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controls     = useAnimation();

  const [track, setTrack]         = useState<CaseReward[]>(() =>
    Array.from({ length: TRACK_SIZE }, () => pickWeightedReward(rewards)),
  );
  const [showWinner, setShowWinner] = useState(false);

  const animateSpin = useCallback(
    async (winner: CaseReward) => {
      setShowWinner(false);

      // Near-miss only when result isn't already top-tier
      const doNearMiss =
        Math.random() < 0.3 &&
        winner.rarity !== 'legendary' &&
        winner.rarity !== 'arcane';

      setTrack(buildTrack(rewards, winner, doNearMiss));

      // Wait one tick so React flushes the new track before we animate
      await new Promise<void>((r) => setTimeout(r, 30));

      const containerW = containerRef.current?.offsetWidth ?? 900;
      const targetX    = -(WINNER_IDX * ITEM_STRIDE + CARD_W / 2 - containerW / 2);

      controls.set({ x: 0 });
      await controls.start({
        x: targetX,
        transition: {
          duration: 5.8,
          ease: [0.12, 0.85, 0.28, 1.0],
        },
      });

      setShowWinner(true);
      // Small pause so winner highlight is visible before overlay appears
      await new Promise<void>((r) => setTimeout(r, 400));
      onSpinComplete();
    },
    [rewards, controls, onSpinComplete],
  );

  useEffect(() => {
    if (spinning && result) {
      animateSpin(result);
    }
  }, [spinning, result]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full select-none" style={{ height: 210 }}>
      {/* Side fade gradients */}
      <div
        className="absolute inset-y-0 left-0 w-28 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(to right, #0A0A0F 0%, transparent 100%)`,
        }}
      />
      <div
        className="absolute inset-y-0 right-0 w-28 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(to left, #0A0A0F 0%, transparent 100%)`,
        }}
      />

      <Indicator spinning={spinning} />

      {/* Track wrapper */}
      <div
        ref={containerRef}
        className="overflow-hidden h-full flex items-center"
      >
        <motion.div
          animate={controls}
          className="flex gap-2 will-change-transform"
          style={{ x: 0 }}
        >
          {track.map((item, i) => (
            <RouletteCard
              key={i}
              reward={item}
              highlight={showWinner && i === WINNER_IDX}
            />
          ))}
        </motion.div>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 inset-x-0 h-px opacity-30"
        style={{ background: `linear-gradient(to right, transparent, ${accentColor}, transparent)` }}
      />
    </div>
  );
}
