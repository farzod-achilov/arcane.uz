'use client';

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaseReward, RARITY_META, Rarity } from '@/lib/casesData';
import { cn } from '@/lib/utils';

// ── Particles ─────────────────────────────────────────────────────────────────
function Particles({ color, count, rarity }: { color: string; count: number; rarity: Rarity }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle    = (i / count) * Math.PI * 2;
        const distance = 90 + Math.random() * 140;
        const size     = 3 + Math.random() * 5;
        const delay    = Math.random() * 0.35;
        return { angle, distance, size, delay };
      }),
    [count],
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width:       p.size,
            height:      p.size,
            backgroundColor: color,
            top:  '50%',
            left: '50%',
            marginTop:  -p.size / 2,
            marginLeft: -p.size / 2,
            boxShadow:  `0 0 ${p.size * 2}px ${color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x:       Math.cos(p.angle) * p.distance,
            y:       Math.sin(p.angle) * p.distance,
            opacity: [0, 1, 0.8, 0],
            scale:   [0, 1.2, 0.8, 0],
          }}
          transition={{ duration: 1.1, delay: p.delay, ease: 'easeOut' }}
        />
      ))}

      {/* Extra large orbs for legendary/arcane */}
      {(rarity === 'legendary' || rarity === 'arcane') &&
        Array.from({ length: 8 }, (_, i) => {
          const angle    = (i / 8) * Math.PI * 2 + 0.3;
          const distance = 150 + Math.random() * 80;
          return (
            <motion.div
              key={`orb-${i}`}
              className="absolute rounded-full"
              style={{
                width:       12,
                height:      12,
                background:  `radial-gradient(circle, ${color}, transparent)`,
                top:  '50%',
                left: '50%',
                marginTop:  -6,
                marginLeft: -6,
              }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{
                x:       Math.cos(angle) * distance,
                y:       Math.sin(angle) * distance,
                opacity: [0, 1, 0],
                scale:   [0, 1.5, 0],
              }}
              transition={{ duration: 1.4, delay: 0.1 + Math.random() * 0.3, ease: 'easeOut' }}
            />
          );
        })}
    </div>
  );
}

// ── Main Reward Card ──────────────────────────────────────────────────────────
function BigRewardCard({ reward }: { reward: CaseReward }) {
  const meta = RARITY_META[reward.rarity];

  return (
    <motion.div
      className={cn(
        'relative rounded-2xl border-2 flex flex-col items-center justify-center gap-3 overflow-hidden',
        meta.border,
        meta.bg,
      )}
      style={{ width: 220, height: 280, boxShadow: meta.glow }}
      initial={{ scale: 0.4, opacity: 0, rotateY: -25 }}
      animate={{ scale: 1,   opacity: 1, rotateY: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
    >
      {/* Gradient background */}
      <div className={cn('absolute inset-0 opacity-15 bg-gradient-to-br', meta.gradient)} />

      {/* Top rarity bar */}
      <div
        className="absolute top-0 inset-x-0 h-1"
        style={{
          background:  meta.color,
          boxShadow:   `0 0 12px ${meta.color}, 0 0 24px ${meta.color}40`,
        }}
      />

      {/* Animated border shimmer */}
      {(reward.rarity === 'legendary' || reward.rarity === 'arcane') && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, ${meta.color}40 25%, transparent 50%)`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Icon */}
      <motion.span
        className="text-6xl leading-none relative z-10"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {reward.icon}
      </motion.span>

      {/* Name */}
      <div className="text-center relative z-10 px-4">
        <p className="text-base font-bold text-white leading-snug">{reward.name}</p>
        <p className="text-xs text-white/60 mt-1">{reward.description}</p>
      </div>

      {/* Rarity badge */}
      <span
        className={cn(
          'text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border relative z-10',
          meta.textColor,
          meta.border,
        )}
      >
        {meta.label}
      </span>

      {/* Coin value */}
      <p className={cn('text-sm font-semibold relative z-10', meta.textColor)}>
        ≈ {reward.coinValue.toLocaleString()} монет
      </p>
    </motion.div>
  );
}

// ── Screen Flash for top-tier drops ──────────────────────────────────────────
function RarityFlash({ color }: { color: string }) {
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-[60]"
      style={{ backgroundColor: color }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.18, 0] }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    />
  );
}

// ── Rarity Title ──────────────────────────────────────────────────────────────
const RARITY_LABELS: Record<Rarity, string> = {
  common:    '✦ Обычная Награда',
  rare:      '✦✦ Редкая Награда',
  epic:      '✦✦✦ Эпическая Награда',
  legendary: '★ ЛЕГЕНДАРНАЯ НАГРАДА ★',
  arcane:    '⚡ A R C A N E  D R O P ⚡',
};

// ── Public component ──────────────────────────────────────────────────────────
interface RewardRevealProps {
  reward:    CaseReward | null;
  visible:   boolean;
  onOpenAgain:    () => void;
  onAddInventory: () => void;
  onDismiss:      () => void;
}

export function RewardReveal({
  reward,
  visible,
  onOpenAgain,
  onAddInventory,
  onDismiss,
}: RewardRevealProps) {
  const meta = reward ? RARITY_META[reward.rarity] : null;

  // Prevent body scroll while open
  useEffect(() => {
    if (visible) document.body.style.overflow = 'hidden';
    else         document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && reward && meta && (
        <>
          {/* Flash for epic+ */}
          {(reward.rarity === 'legendary' || reward.rarity === 'arcane') && (
            <RarityFlash color={meta.color} />
          )}

          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
            style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(10,10,15,0.88)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            onClick={onDismiss}
          >
            {/* Radial glow behind card */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width:      500,
                height:     500,
                background: `radial-gradient(circle, ${meta.color}25 0%, transparent 65%)`,
              }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Inner panel (stop propagation so clicking card doesn't dismiss) */}
            <motion.div
              className="relative flex flex-col items-center gap-6"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            >
              {/* Rarity headline */}
              <motion.p
                className={cn('text-sm font-extrabold uppercase tracking-[0.2em] text-center', meta.textColor)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {RARITY_LABELS[reward.rarity]}
              </motion.p>

              {/* Card + particles */}
              <div className="relative">
                <Particles
                  color={meta.color}
                  count={reward.rarity === 'arcane' ? 36 : reward.rarity === 'legendary' ? 28 : 18}
                  rarity={reward.rarity}
                />
                <BigRewardCard reward={reward} />
              </div>

              {/* Actions */}
              <motion.div
                className="flex flex-col sm:flex-row gap-3 w-full max-w-xs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={onAddInventory}
                  className={cn(
                    'flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wider',
                    'border-2 transition-all hover:scale-[1.03] active:scale-[0.97]',
                    meta.border,
                    meta.textColor,
                    meta.bg,
                  )}
                >
                  В инвентарь
                </button>
                <button
                  onClick={onOpenAgain}
                  className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wider
                             bg-accent-purple hover:bg-accent-purple/80 text-white
                             transition-all hover:scale-[1.03] active:scale-[0.97]
                             border-2 border-accent-purple/60"
                >
                  Открыть ещё
                </button>
              </motion.div>

              {/* Share / dismiss hint */}
              <motion.p
                className="text-xs text-white/30 cursor-pointer hover:text-white/60 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={onDismiss}
              >
                Нажмите в любом месте, чтобы закрыть
              </motion.p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
