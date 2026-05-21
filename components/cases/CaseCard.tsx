'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CaseConfig, RARITY_META, Rarity } from '@/lib/casesData';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ── Drop-chance bar ────────────────────────────────────────────────────────────
function RarityBar({ rarity, pct }: { rarity: Rarity; pct: number }) {
  const meta = RARITY_META[rarity];
  return (
    <div className="flex items-center gap-2">
      <span className={cn('text-[9px] font-bold uppercase tracking-wider w-[72px] flex-shrink-0', meta.textColor)}>
        {meta.label}
      </span>
      <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r', meta.gradient)}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
          style={{ boxShadow: `0 0 6px ${meta.color}60` }}
        />
      </div>
      <span className="text-[9px] text-white/30 w-7 text-right flex-shrink-0 tabular-nums">{pct}%</span>
    </div>
  );
}

function deriveDropChances(rewards: CaseConfig['rewards']): Partial<Record<Rarity, number>> {
  const map: Partial<Record<Rarity, number>> = {};
  for (const r of rewards) map[r.rarity] = (map[r.rarity] ?? 0) + r.probability;
  return map;
}

// ── Per-tier cinematic preview cube ───────────────────────────────────────────
function PreviewCube({ c }: { c: CaseConfig }) {
  const isArcane = c.id === 'arcane';
  const isGold   = c.id === 'gold';

  return (
    /* Outer ambient field */
    <div className="relative flex items-center justify-center" style={{ width: 168, height: 168 }}>

      {/* Radial ambient */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: isArcane ? -28 : -20,
          background: `radial-gradient(circle, ${c.glowColor} 0%, transparent 65%)`,
          opacity: isArcane ? 0.65 : 0.4,
        }}
      />

      {/* Floating wrapper */}
      <motion.div
        className="relative"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Cube */}
        <motion.div
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            width:        148,
            height:       148,
            borderRadius: 20,
            border:       `1.5px solid ${c.accentColor}38`,
            background:   isArcane
              ? 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(6,182,212,0.12) 100%)'
              : isGold
              ? 'linear-gradient(135deg, rgba(245,158,11,0.16) 0%, rgba(251,191,36,0.07) 100%)'
              : 'linear-gradient(135deg, rgba(148,163,184,0.13) 0%, rgba(100,116,139,0.06) 100%)',
          }}
          animate={{
            boxShadow: [
              `0 0 18px ${c.glowColor}, 0 0 36px ${c.glowColor}55, inset 0 1px 0 rgba(255,255,255,0.07)`,
              `0 0 32px ${c.glowColor}, 0 0 64px ${c.glowColor}38, inset 0 1px 0 rgba(255,255,255,0.11)`,
              `0 0 18px ${c.glowColor}, 0 0 36px ${c.glowColor}55, inset 0 1px 0 rgba(255,255,255,0.07)`,
            ],
          }}
          transition={{ duration: isArcane ? 2 : 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Gradient wash */}
          <div className="absolute inset-0 opacity-[0.22]" style={{ background: c.gradient }} />

          {/* Arcane: spinning conic shimmer */}
          {isArcane && (
            <motion.div
              className="absolute inset-0"
              style={{
                background: `conic-gradient(from 0deg, transparent 0%, ${c.accentColor}22 18%, transparent 38%)`,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {/* Gold: sweeping diagonal shine */}
          {isGold && (
            <motion.div
              className="absolute"
              style={{
                inset: 0,
                background: 'linear-gradient(120deg, transparent 20%, rgba(251,191,36,0.1) 45%, rgba(255,255,255,0.07) 52%, transparent 58%)',
              }}
              animate={{ x: [-148, 148] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
            />
          )}

          {/* Silver: subtle frost sheen */}
          {!isArcane && !isGold && (
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, transparent 45%)',
              }}
            />
          )}

          {/* Top reflection stripe */}
          <div
            className="absolute top-0 inset-x-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent 5%, ${c.accentColor}80 50%, transparent 95%)` }}
          />
          {/* Bottom ground line */}
          <div
            className="absolute bottom-0 inset-x-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent 20%, ${c.accentColor}30 50%, transparent 80%)` }}
          />

          {/* Icon */}
          <span className="text-[56px] leading-none relative z-10" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' }}>
            📦
          </span>
        </motion.div>

        {/* Arcane: 4 corner accent dots */}
        {isArcane && (
          <>
            {[
              { pos: { top: -5, left:  -5 }, color: '#7C3AED', delay: 0   },
              { pos: { top: -5, right: -5 }, color: '#06B6D4', delay: 0.6 },
              { pos: { bottom: -5, left:  -5 }, color: '#06B6D4', delay: 1.2 },
              { pos: { bottom: -5, right: -5 }, color: '#7C3AED', delay: 1.8 },
            ].map((dot, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{ ...dot.pos, backgroundColor: dot.color, boxShadow: `0 0 6px ${dot.color}` }}
                animate={{ scale: [1, 1.7, 1], opacity: [0.9, 0.2, 0.9] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: dot.delay }}
              />
            ))}
          </>
        )}

        {/* Silver/Gold: single orbiting dot */}
        {!isArcane && (
          <motion.div
            className="absolute w-2.5 h-2.5 rounded-full"
            style={{ top: -5, right: -5, backgroundColor: c.accentColor, boxShadow: `0 0 8px ${c.accentColor}` }}
            animate={{ scale: [1, 1.6, 1], opacity: [1, 0.25, 1] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Ground reflection (subtle ellipse beneath the cube) */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 0,
          width:  100,
          height: 12,
          background: `radial-gradient(ellipse, ${c.glowColor} 0%, transparent 70%)`,
          opacity: 0.45,
          filter: 'blur(4px)',
        }}
      />
    </div>
  );
}

// ── Tier labels ────────────────────────────────────────────────────────────────
const TIER_LABELS: Record<string, string> = { silver: 'Серебряный', gold: 'Золотой', arcane: 'Arcane' };

// ── Public component ──────────────────────────────────────────────────────────
interface CaseCardProps {
  caseConfig: CaseConfig;
  href?:      string;
  showDrops?: boolean;
  className?: string;
}

export function CaseCard({ caseConfig: c, href, showDrops = false, className }: CaseCardProps) {
  const dropChances = deriveDropChances(c.rewards);
  const rarityOrder: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'arcane'];
  const topRewards  = c.rewards.filter((r) => r.rarity === 'legendary' || r.rarity === 'arcane').slice(0, 3);
  const target      = href ?? `/cases/${c.id}`;
  const isArcane    = c.id === 'arcane';

  return (
    <Link href={target} className={cn('block group focus:outline-none h-full', className)}>
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative h-full flex flex-col rounded-2xl overflow-hidden"
        style={{ background: '#0D0D1A', border: `1px solid ${c.accentColor}20` }}
      >

        {/* ── Depth layers ─────────────────────────────────── */}
        {/* Top tinted wash */}
        <div
          className="absolute top-0 inset-x-0 h-52 pointer-events-none"
          style={{ background: `linear-gradient(180deg, ${c.accentColor}0D 0%, transparent 100%)` }}
        />
        {/* Bottom tinted wash */}
        <div
          className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
          style={{ background: `linear-gradient(0deg, ${c.accentColor}08 0%, transparent 100%)` }}
        />
        {/* Hover: inner border glow */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
          style={{ boxShadow: `inset 0 0 50px ${c.glowColor}` }}
        />
        {/* Hover: outer card glow */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
          style={{ boxShadow: `0 0 45px ${c.glowColor}, 0 24px 56px rgba(0,0,0,0.55)` }}
        />

        {/* ── Top rarity bar ─────────────────────────────── */}
        <div
          className="absolute top-0 inset-x-0 h-[3px] z-10"
          style={{
            background:  c.accentColor,
            boxShadow:   `0 0 10px ${c.glowColor}, 0 0 20px ${c.glowColor}`,
          }}
        />

        {/* ── Body ───────────────────────────────────────── */}
        <div className="relative z-10 flex flex-col flex-1 p-5 pt-7">

          {/* 1. HEADER */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <p
                className="text-[10px] font-black uppercase tracking-[0.15em] mb-0.5"
                style={{ color: `${c.accentColor}99` }}
              >
                {c.subtitle}
              </p>
              <h3 className="text-[17px] font-black text-white leading-snug">
                {c.title}
              </h3>
            </div>
            <span
              className="flex-shrink-0 text-[9px] font-black uppercase tracking-[0.12em] px-2 py-[3px] rounded-lg border"
              style={{
                color:       c.accentColor,
                borderColor: `${c.accentColor}40`,
                background:  `${c.accentColor}0F`,
              }}
            >
              {TIER_LABELS[c.id]}
            </span>
          </div>

          {/* 2. DESCRIPTION — always 2 lines */}
          <p className="text-[11.5px] text-white/45 leading-relaxed line-clamp-2 min-h-[36px] mb-0">
            {c.description}
          </p>

          {/* 3. PREVIEW CUBE — centered, fixed height block */}
          <div className="flex justify-center items-center" style={{ height: 176 }}>
            <PreviewCube c={c} />
          </div>

          {/* 4. TOP REWARD TAGS — fixed min-height keeps cards aligned */}
          <div className="min-h-[48px] flex flex-wrap gap-1.5 content-start mb-4">
            {topRewards.map((r) => (
              <span
                key={r.id}
                className={cn(
                  'text-[9px] font-bold px-2 py-[3px] rounded-full border',
                  RARITY_META[r.rarity].textColor,
                  RARITY_META[r.rarity].border,
                  RARITY_META[r.rarity].bg,
                )}
              >
                {r.icon} {r.name}
              </span>
            ))}
          </div>

          {/* 5. DROP BARS (optional, only shown when requested) */}
          {showDrops && (
            <div className="flex flex-col gap-2 mb-4 pt-3 border-t border-white/5">
              {rarityOrder
                .filter((r) => (dropChances[r] ?? 0) > 0)
                .map((r) => (
                  <RarityBar key={r} rarity={r} pct={Math.round(dropChances[r] ?? 0)} />
                ))}
            </div>
          )}

          {/* 6. FOOTER — always at bottom */}
          <div className="mt-auto">
            {/* Price row */}
            <div className="flex items-end justify-between mb-3 pt-3 border-t border-white/[0.06]">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/30 mb-0.5">Стоимость</p>
                <p className="text-[16px] font-black text-white leading-none">
                  {formatPrice(c.price)}
                </p>
              </div>

              {/* Arcane label */}
              {isArcane && (
                <motion.p
                  className="text-[9px] font-black uppercase tracking-widest"
                  style={{ color: c.accentColor }}
                  animate={{ opacity: [1, 0.35, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                >
                  ★ Ultra Rare
                </motion.p>
              )}
            </div>

            {/* Full-width CTA */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="relative w-full h-12 rounded-xl flex items-center justify-center gap-2
                         text-[12px] font-black uppercase tracking-[0.1em] text-white overflow-hidden"
              style={{
                background: c.gradient,
                boxShadow:  `0 4px 20px ${c.glowColor}, 0 1px 0 rgba(255,255,255,0.08) inset`,
              }}
            >
              {/* Hover shine overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.13) 0%, transparent 55%)' }}
              />
              <span className="relative z-10">⚡</span>
              <span className="relative z-10">Открыть кейс</span>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
