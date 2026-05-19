'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Sparkles, ChevronRight, Gamepad2, Package, Zap, Tag } from 'lucide-react';
import { mysteryCases } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';

/* ── Rarity visual config ─────────────────────────────── */
type RarityKey = 'silver' | 'gold' | 'arcane';

const rarityMap: Record<RarityKey, {
  label: string;
  accent: string;
  accentBright: string;
  glowColor: string;
  border: string;
  cardGlow: string;
  imageTint: string;
  badgeBg: string;
  badgeText: string;
  btnGrad: string;
  btnShadow: string;
  featured?: boolean;
}> = {
  silver: {
    label: 'SILVER',
    accent: '#9CA3AF',
    accentBright: '#E2E8F0',
    glowColor: 'rgba(156,163,175,0.22)',
    border: 'rgba(156,163,175,0.2)',
    cardGlow: 'rgba(156,163,175,0.15)',
    imageTint: 'rgba(156,163,175,0.12)',
    badgeBg: 'rgba(203,213,225,0.1)',
    badgeText: '#CBD5E1',
    btnGrad: 'linear-gradient(135deg, #4B5563 0%, #9CA3AF 100%)',
    btnShadow: '0 4px 20px rgba(156,163,175,0.2)',
  },
  gold: {
    label: 'GOLD',
    accent: '#F59E0B',
    accentBright: '#FCD34D',
    glowColor: 'rgba(245,158,11,0.28)',
    border: 'rgba(245,158,11,0.28)',
    cardGlow: 'rgba(245,158,11,0.18)',
    imageTint: 'rgba(245,158,11,0.1)',
    badgeBg: 'rgba(245,158,11,0.14)',
    badgeText: '#FCD34D',
    btnGrad: 'linear-gradient(135deg, #B45309 0%, #F59E0B 50%, #FCD34D 100%)',
    btnShadow: '0 4px 22px rgba(245,158,11,0.3)',
  },
  arcane: {
    label: 'ARCANE',
    accent: '#7C3AED',
    accentBright: '#C4B5FD',
    glowColor: 'rgba(124,58,237,0.4)',
    border: 'rgba(124,58,237,0.4)',
    cardGlow: 'rgba(124,58,237,0.22)',
    imageTint: 'rgba(124,58,237,0.12)',
    badgeBg: 'rgba(124,58,237,0.18)',
    badgeText: '#C4B5FD',
    btnGrad: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 50%, #06B6D4 110%)',
    btnShadow: '0 4px 24px rgba(124,58,237,0.45), 0 0 0 1px rgba(124,58,237,0.35)',
    featured: true,
  },
};

function getRewardIcon(item: string) {
  const lower = item.toLowerCase();
  if (lower.includes('игра'))                                     return Gamepad2;
  if (lower.includes('пропуск') || lower.includes('dlc') || lower.includes('бонус')) return Package;
  if (lower.includes('скидка'))                                   return Tag;
  return Zap;
}

export default function MysteryCases() {
  return (
    <section className="py-16 sm:py-22 relative overflow-hidden">
      {/* Section background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0C0A1A] to-[#0A0A0F]" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 45%, rgba(124,58,237,0.07) 0%, transparent 70%)',
        }}
      />
      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.018,
        }}
      />
      {/* Top / bottom accent lines */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(124,58,237,0.4) 40%, rgba(6,182,212,0.25) 65%, transparent 95%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Section header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
            style={{
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.28)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#9D60FA]" />
            <span
              className="font-heading font-semibold text-[#9D60FA]"
              style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}
            >
              Mystery Cases
            </span>
          </div>

          <h2
            className="font-heading font-bold text-white mb-3 leading-tight"
            style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}
          >
            Открой свой{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #9D60FA 0%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              фантомный кейс
            </span>
          </h2>

          <p
            className="font-body mx-auto"
            style={{ fontSize: '15px', color: '#6B7280', maxWidth: '440px', lineHeight: '1.7' }}
          >
            Гарантированная ценность внутри каждого кейса — игры, ключи и Arcane Coins.
          </p>
        </motion.div>

        {/* ── Cases grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {mysteryCases.map((c, i) => {
            const rarity = rarityMap[c.id as RarityKey] ?? rarityMap.silver;
            return (
              <CaseCard
                key={c.id}
                caseData={c}
                rarity={rarity}
                index={i}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Individual Case Card ─────────────────────────────── */
function CaseCard({
  caseData,
  rarity,
  index,
}: {
  caseData: { id: string; title: string; price: number; image: string; items: string[] };
  rarity: (typeof rarityMap)[RarityKey];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: '#0D0D16',
        border: `1px solid ${rarity.border}`,
        boxShadow: `0 0 0 0 ${rarity.glowColor}`,
        transition: 'box-shadow 0.35s ease, border-color 0.35s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          `0 0 40px ${rarity.glowColor}, 0 20px 60px rgba(0,0,0,0.5)`;
        (e.currentTarget as HTMLElement).style.borderColor = rarity.accent + '60';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.borderColor = rarity.border;
      }}
    >
      {/* ── Image area ── */}
      <div className="relative h-52 overflow-hidden flex-shrink-0">
        {/* Rarity tint overlay */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: rarity.imageTint }}
        />
        {/* Bottom gradient fade into card */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 z-20 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, transparent 0%, rgba(13,13,22,0.85) 70%, #0D0D16 100%)',
          }}
        />
        {/* Top glow line */}
        <div
          className="absolute top-0 left-0 right-0 h-px z-20 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${rarity.accent}70, transparent)`,
          }}
        />

        <Image
          src={caseData.image}
          alt={caseData.title}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />

        {/* Rarity badge — top right */}
        <div
          className="absolute top-3.5 right-3.5 z-30 rounded-lg px-2.5 py-1 font-pixel"
          style={{
            background: rarity.badgeBg,
            border: `1px solid ${rarity.accent}40`,
            color: rarity.badgeText,
            fontSize: '8px',
            letterSpacing: '0.1em',
            backdropFilter: 'blur(8px)',
          }}
        >
          {rarity.label}
        </div>

        {/* Ambient glow from below the image */}
        <motion.div
          animate={{ opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.7 }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-40 h-20 pointer-events-none z-10"
          style={{
            background: `radial-gradient(ellipse at center, ${rarity.cardGlow} 0%, transparent 70%)`,
            filter: 'blur(12px)',
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative flex flex-col flex-1 p-5 pt-4">
        {/* Title */}
        <h3
          className="font-heading font-bold text-white mb-1"
          style={{ fontSize: '17px' }}
        >
          {caseData.title}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-5">
          <span
            className="font-heading font-bold"
            style={{ fontSize: '22px', color: rarity.accentBright }}
          >
            {formatPrice(caseData.price)}
          </span>
          <span
            className="font-body"
            style={{ fontSize: '11px', color: '#4B5563' }}
          >
            за кейс
          </span>
        </div>

        {/* Reward chips */}
        <div className="flex flex-col gap-2 mb-6">
          {caseData.items.map((item, j) => {
            const Icon = getRewardIcon(item);
            return (
              <div
                key={j}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                style={{
                  background: `${rarity.accent}08`,
                  border: `1px solid ${rarity.accent}18`,
                }}
              >
                <Icon
                  className="flex-shrink-0"
                  style={{ width: '13px', height: '13px', color: rarity.accent }}
                />
                <span
                  className="font-body"
                  style={{ fontSize: '12.5px', color: '#9CA3AF' }}
                >
                  {item}
                </span>
              </div>
            );
          })}
        </div>

        {/* CTA button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group/btn relative w-full flex items-center justify-center gap-2 rounded-xl font-heading font-semibold text-white overflow-hidden mt-auto"
          style={{
            background: rarity.btnGrad,
            padding: '13px 20px',
            fontSize: '13.5px',
            letterSpacing: '0.02em',
            boxShadow: rarity.btnShadow,
          }}
        >
          {/* Shine */}
          <span
            className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 55%)',
            }}
          />
          <span className="relative z-10">Открыть кейс</span>
          <ChevronRight className="w-4 h-4 relative z-10 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
