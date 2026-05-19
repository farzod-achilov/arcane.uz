'use client';

import { motion } from 'framer-motion';
import { Zap, ArrowRight, TrendingUp, Percent, Gift, ChevronsUp, Layers } from 'lucide-react';

const perks = [
  {
    icon: TrendingUp,
    title: 'Зарабатывай',
    desc: '1% от каждой покупки возвращается монетами',
    accent: '#22C55E',
  },
  {
    icon: Percent,
    title: 'Трать',
    desc: 'До 30% от суммы заказа можно оплатить монетами',
    accent: '#06B6D4',
  },
  {
    icon: Gift,
    title: 'Бонусы',
    desc: 'Двойные монеты в день рождения и во время акций',
    accent: '#F59E0B',
  },
  {
    icon: ChevronsUp,
    title: 'Уровни',
    desc: 'Повышай статус — больше монет и привилегий',
    accent: '#9D60FA',
  },
];

const tiers = [
  {
    name: 'Bronze',
    label: 'Начинающий',
    min: 0,
    color: '#CD7F32',
    borderColor: 'rgba(205,127,50,0.25)',
    bg: 'rgba(205,127,50,0.07)',
    multiplier: '1×',
    bonus: 'Базовый кэшбэк',
    isTop: false,
  },
  {
    name: 'Silver',
    label: 'Опытный',
    min: 5000,
    color: '#9CA3AF',
    borderColor: 'rgba(156,163,175,0.22)',
    bg: 'rgba(156,163,175,0.06)',
    multiplier: '1.5×',
    bonus: '+50% монет',
    isTop: false,
  },
  {
    name: 'Gold',
    label: 'Про',
    min: 20000,
    color: '#F59E0B',
    borderColor: 'rgba(245,158,11,0.28)',
    bg: 'rgba(245,158,11,0.07)',
    multiplier: '2×',
    bonus: 'Приоритет поддержки',
    isTop: false,
  },
  {
    name: 'Arcane',
    label: 'Легенда',
    min: 50000,
    color: '#9D60FA',
    borderColor: 'rgba(124,58,237,0.45)',
    bg: 'linear-gradient(135deg, rgba(124,58,237,0.14) 0%, rgba(6,182,212,0.07) 100%)',
    multiplier: '3×',
    bonus: 'Эксклюзивный доступ',
    isTop: true,
  },
];

// Ambient floating particles around the coin
const particles = [
  { x: -52, y: -68, size: 3,   color: '#F59E0B', opacity: 0.80, delay: 0,   dur: 4.2 },
  { x:  64, y: -44, size: 2,   color: '#FCD34D', opacity: 0.55, delay: 0.9, dur: 5.1 },
  { x:  80, y:  16, size: 3.5, color: '#7C3AED', opacity: 0.65, delay: 1.6, dur: 3.8 },
  { x:  54, y:  72, size: 2,   color: '#F59E0B', opacity: 0.45, delay: 2.2, dur: 4.7 },
  { x: -70, y:  50, size: 2.5, color: '#9D60FA', opacity: 0.60, delay: 0.4, dur: 5.5 },
  { x: -84, y: -20, size: 2,   color: '#FCD34D', opacity: 0.45, delay: 2.7, dur: 4.1 },
  { x:   6, y: -88, size: 2,   color: '#7C3AED', opacity: 0.50, delay: 1.2, dur: 6.0 },
  { x: -28, y:  88, size: 2.5, color: '#F59E0B', opacity: 0.40, delay: 3.1, dur: 4.6 },
  { x:  36, y: -90, size: 1.5, color: '#FCD34D', opacity: 0.35, delay: 1.8, dur: 5.3 },
];

export default function ArcaneCoins() {
  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      {/* Section background */}
      <div className="absolute inset-0 bg-[#0A0A0F]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(124,58,237,0.07) 0%, transparent 70%)',
        }}
      />
      {/* Top / bottom divider lines */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(124,58,237,0.35) 40%, rgba(6,182,212,0.2) 65%, transparent 95%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(124,58,237,0.2) 50%, transparent 95%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ════════════════════════════════
              LEFT — Text + Perks + CTA
          ════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Section badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
              style={{
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.28)',
              }}
            >
              <Zap className="w-3.5 h-3.5 text-[#9D60FA]" />
              <span
                className="font-heading font-semibold text-[#9D60FA]"
                style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}
              >
                Программа лояльности
              </span>
            </div>

            {/* Headline */}
            <h2
              className="font-heading font-bold text-white mb-4 leading-tight"
              style={{ fontSize: 'clamp(28px, 3.5vw, 40px)' }}
            >
              Arcane Coins —{' '}
              <br />
              <span
                style={{
                  background: 'linear-gradient(90deg, #9D60FA 0%, #06B6D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                твои привилегии
              </span>
            </h2>

            {/* Description */}
            <p
              className="font-body leading-relaxed mb-9"
              style={{ fontSize: '14.5px', color: '#6B7280', maxWidth: '420px', lineHeight: '1.75' }}
            >
              Система вознаграждений, которая работает за тебя. Каждая покупка приносит монеты — каждая монета приближает к скидке.
            </p>

            {/* Perk cards */}
            <div className="grid grid-cols-2 gap-3 mb-9">
              {perks.map((perk, i) => (
                <motion.div
                  key={perk.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.1 + i * 0.07, ease: 'easeOut' }}
                  className="group rounded-2xl p-4 transition-all duration-300 cursor-default"
                  style={{
                    background: '#0F0F18',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = `${perk.accent}30`;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${perk.accent}10`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      background: `${perk.accent}14`,
                      border: `1px solid ${perk.accent}28`,
                    }}
                  >
                    <perk.icon
                      className="w-[15px] h-[15px]"
                      style={{ color: perk.accent }}
                    />
                  </div>
                  <p
                    className="font-heading font-semibold text-white mb-1"
                    style={{ fontSize: '13px' }}
                  >
                    {perk.title}
                  </p>
                  <p
                    className="font-body text-[#6B7280] leading-snug"
                    style={{ fontSize: '12px', lineHeight: '1.55' }}
                  >
                    {perk.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.975 }}
              className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl font-heading font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 60%, #06B6D4 130%)',
                padding: '13px 28px',
                fontSize: '14px',
                letterSpacing: '0.025em',
                boxShadow:
                  '0 0 0 1px rgba(124,58,237,0.4), 0 4px 24px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
            >
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%)',
                }}
              />
              <span className="relative z-10">Начать копить</span>
              <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-200 group-hover:translate-x-0.5" />
            </motion.button>
          </motion.div>

          {/* ════════════════════════════════
              RIGHT — Coin + Tiers
          ════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* ── COIN VISUAL ── */}
            <div className="relative flex justify-center mb-10">
              <div className="relative w-72 h-72 flex items-center justify-center">

                {/* Outermost soft glow blob */}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(ellipse at center, rgba(245,158,11,0.12) 0%, rgba(124,58,237,0.08) 50%, transparent 75%)',
                    filter: 'blur(24px)',
                  }}
                />

                {/* Inner glow ring — static, subtle halo */}
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    inset: '28px',
                    border: '1px solid rgba(245,158,11,0.18)',
                    boxShadow:
                      '0 0 30px rgba(245,158,11,0.08), inset 0 0 30px rgba(245,158,11,0.05)',
                  }}
                />

                {/* Ambient particles */}
                {particles.map((p, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -9, 0],
                      opacity: [p.opacity, p.opacity * 0.35, p.opacity],
                    }}
                    transition={{
                      duration: p.dur,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: p.delay,
                    }}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      left: `calc(50% + ${p.x}px)`,
                      top: `calc(50% + ${p.y}px)`,
                      width: `${p.size}px`,
                      height: `${p.size}px`,
                      background: p.color,
                      boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}

                {/* Coin — smooth float */}
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative z-10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo_coin.png"
                    alt="Arcane Coin"
                    style={{
                      width: '200px',
                      height: '200px',
                      objectFit: 'contain',
                      filter:
                        'drop-shadow(0 0 18px rgba(245,158,11,0.6)) drop-shadow(0 0 40px rgba(245,158,11,0.25)) drop-shadow(0 0 60px rgba(124,58,237,0.2))',
                    }}
                  />
                </motion.div>
              </div>
            </div>

            {/* ── TIER PROGRESSION ── */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: '#0D0D16',
                border: '1px solid rgba(255,255,255,0.055)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              {/* Card header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Layers className="w-[14px] h-[14px] text-[#7C3AED]" />
                  <h4
                    className="font-heading font-semibold text-[#9CA3AF]"
                    style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                  >
                    Уровни программы
                  </h4>
                </div>
                <span
                  className="font-body text-[#374151]"
                  style={{ fontSize: '11px' }}
                >
                  Множитель монет
                </span>
              </div>

              {/* Tiers list */}
              <div className="space-y-2">
                {tiers.map((tier, i) => (
                  <motion.div
                    key={tier.name}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: 0.2 + i * 0.07, ease: 'easeOut' }}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{
                      background: tier.isTop ? tier.bg : tier.bg,
                      border: `1px solid ${tier.borderColor}`,
                    }}
                  >
                    {/* Left: indicator + name */}
                    <div className="flex items-center gap-3">
                      {/* Color dot */}
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          background: tier.color,
                          boxShadow: tier.isTop
                            ? `0 0 8px ${tier.color}, 0 0 16px ${tier.color}50`
                            : `0 0 5px ${tier.color}80`,
                        }}
                      />
                      <div className="flex flex-col">
                        <span
                          className="font-heading font-semibold"
                          style={{
                            fontSize: '13px',
                            color: tier.isTop ? '#E2E8F0' : '#9CA3AF',
                            lineHeight: 1.2,
                          }}
                        >
                          {tier.name}
                        </span>
                        <span
                          className="font-body text-[#374151]"
                          style={{ fontSize: '10px', marginTop: '1px' }}
                        >
                          {tier.min > 0
                            ? `от ${tier.min.toLocaleString('ru')} монет`
                            : 'Стартовый'}
                        </span>
                      </div>
                    </div>

                    {/* Right: multiplier + bonus */}
                    <div className="flex items-center gap-3">
                      <span
                        className="font-body text-[#4B5563]"
                        style={{ fontSize: '11px' }}
                      >
                        {tier.bonus}
                      </span>
                      {/* Multiplier badge */}
                      <div
                        className="rounded-lg flex items-center justify-center font-heading font-bold"
                        style={{
                          background: tier.isTop
                            ? 'rgba(124,58,237,0.2)'
                            : `${tier.color}18`,
                          border: `1px solid ${tier.color}35`,
                          color: tier.color,
                          fontSize: '12px',
                          minWidth: '36px',
                          padding: '3px 8px',
                          textShadow: tier.isTop ? `0 0 10px ${tier.color}60` : 'none',
                        }}
                      >
                        {tier.multiplier}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer note */}
              <p
                className="font-body text-[#374151] mt-4 text-center"
                style={{ fontSize: '11px' }}
              >
                Уровень повышается автоматически при накоплении монет
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
