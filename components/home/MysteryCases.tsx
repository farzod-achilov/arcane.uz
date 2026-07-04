'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { CASES_LIST } from '@/lib/casesData';
import { MACHINE_VIS, type MachineId, generateLiveWins, DROP_VFX } from '@/lib/arcaneDropData';
import { formatPrice } from '@/lib/utils';
import { useDict } from '@/lib/locale/client';
import { CASES_COMING_SOON } from '@/lib/featureFlags';

// ── Live ticker ───────────────────────────────────────────────────────────────
function LiveTicker() {
  const cs = useDict().home.cases;
  const wins = useMemo(() => generateLiveWins(14), []);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % wins.length), 2800);
    return () => clearInterval(t);
  }, [wins.length]);
  const w = wins[idx];
  const vfx = DROP_VFX[w.rarity];
  return (
    <AnimatePresence mode="wait">
      <motion.div key={idx}
        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.25 }}
        className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full"
        style={{ background: vfx.bg, border: `1px solid ${vfx.border}` }}>
        <motion.div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: vfx.color, boxShadow: `0 0 6px ${vfx.color}` }}
          animate={{ scale: [1, 1.6, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
        <span className="font-pixel" style={{ fontSize: 8, color: vfx.color, letterSpacing: '0.1em' }}>{vfx.label}</span>
        <span className="font-body text-white/45 text-xs">
          <span className="text-white/65">{w.user}</span> {cs.won} {w.reward}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Machine card ──────────────────────────────────────────────────────────────
function MachineCard({ config, vis, index }: {
  config: typeof CASES_LIST[0];
  vis: typeof MACHINE_VIS[MachineId];
  index: number;
}) {
  const cs = useDict().home.cases;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.015 }}
      className="relative flex flex-col"
    >
      {/* Outer spotlight glow */}
      <motion.div className="absolute -inset-6 rounded-[36px] blur-2xl pointer-events-none"
        style={{ backgroundColor: vis.color }}
        animate={{ opacity: hovered ? 0.14 : 0.04 }}
        transition={{ duration: 0.4 }} />

      {/* Cabinet */}
      <div className="relative flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #141430 0%, #0D0D24 35%, #080818 70%, #0C0C22 100%)',
          border: `1.5px solid ${vis.color}26`,
          boxShadow: `
            0 0 50px ${vis.glow},
            0 0 100px ${vis.glow}50,
            0 28px 70px rgba(0,0,0,0.85),
            inset 0 1px 0 rgba(255,255,255,0.06),
            inset 0 -1px 0 rgba(0,0,0,0.5)
          `,
        }}>

        {/* Metal sheen */}
        <div className="absolute top-0 inset-x-0 h-16 pointer-events-none rounded-t-2xl"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)' }} />

        {/* Subtle body grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: `linear-gradient(${vis.color} 1px, transparent 1px), linear-gradient(90deg, ${vis.color} 1px, transparent 1px)`,
            backgroundSize: '28px 28px', opacity: 0.018 }} />

        {/* Left neon tube */}
        <motion.div className="absolute pointer-events-none"
          style={{ left: -2, top: '12%', bottom: '14%', width: 4, borderRadius: 2,
            background: `linear-gradient(180deg, ${vis.color}50 0%, ${vis.color} 35%, ${vis.color} 65%, ${vis.color}50 100%)` }}
          animate={{ boxShadow: hovered
            ? `0 0 16px ${vis.color}, 0 0 32px ${vis.color}, 0 0 64px ${vis.color}70`
            : `0 0 8px ${vis.color}80, 0 0 16px ${vis.color}40` }}
          transition={{ duration: 0.4 }} />

        {/* Right neon tube */}
        <motion.div className="absolute pointer-events-none"
          style={{ right: -2, top: '12%', bottom: '14%', width: 4, borderRadius: 2,
            background: `linear-gradient(180deg, ${vis.color}50 0%, ${vis.color} 35%, ${vis.color} 65%, ${vis.color}50 100%)` }}
          animate={{ boxShadow: hovered
            ? `0 0 16px ${vis.color}, 0 0 32px ${vis.color}, 0 0 64px ${vis.color}70`
            : `0 0 8px ${vis.color}80, 0 0 16px ${vis.color}40` }}
          transition={{ duration: 0.4, delay: 0.1 }} />

        {/* Marquee */}
        <div className="relative h-10 mx-4 mt-4 rounded-xl overflow-hidden flex items-center justify-center mb-3"
          style={{ background: `linear-gradient(90deg, transparent, ${vis.color}10 50%, transparent)`,
            border: `1px solid ${vis.color}1C` }}>
          <motion.div className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${vis.color}18, transparent)` }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2.5 }} />
          <div className="flex items-center gap-2.5 relative z-10">
            <motion.div className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: vis.color }}
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
            <span className="font-pixel" style={{ fontSize: 7.5, letterSpacing: '0.24em', color: `${vis.color}BB` }}>
              ARCANE DROP ◆ {vis.tier}
            </span>
            <motion.div className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: vis.color }}
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }} />
          </div>
        </div>

        {/* Screen */}
        <div className="mx-4 rounded-2xl overflow-hidden relative"
          style={{
            height: 190,
            background: vis.screenBg,
            border: `1.5px solid ${vis.color}1C`,
            boxShadow: `inset 0 4px 20px rgba(0,0,0,0.9), inset 0 0 40px ${vis.color}0A`,
          }}>
          {/* Glass reflection */}
          <div className="absolute top-0 left-0 w-1/2 h-1/3 pointer-events-none rounded-br-full"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 70%)' }} />

          {/* CRT scanlines */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.18) 0px,rgba(0,0,0,0.18) 1px,transparent 1px,transparent 3px)',
              backgroundSize: '100% 3px', zIndex: 2 }} />

          {/* Moving scanbar */}
          <motion.div className="absolute inset-x-0 h-[2px] pointer-events-none z-[3]"
            style={{ background: `linear-gradient(90deg, transparent, ${vis.color}70, transparent)` }}
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }} />

          {/* Screen ambient */}
          <motion.div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 50% 35%, ${vis.color}14 0%, transparent 65%)` }}
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />

          {/* Corner brackets */}
          {[['top-2 left-2','top right'],['top-2 right-2','top left'],['bottom-2 left-2','bottom right'],['bottom-2 right-2','bottom left']].map(([pos, corner], i) => (
            <motion.div key={i} className={`absolute ${pos} w-2.5 h-2.5 pointer-events-none z-[4]`}
              style={{
                borderTop: corner.includes('top') ? `1.5px solid ${vis.color}70` : 'none',
                borderBottom: corner.includes('bottom') ? `1.5px solid ${vis.color}45` : 'none',
                borderLeft: corner.includes('left') ? `1.5px solid ${vis.color}70` : 'none',
                borderRight: corner.includes('right') ? `1.5px solid ${vis.color}45` : 'none',
              }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.35 }} />
          ))}

          {/* Floating capsules */}
          <div className="absolute inset-0 flex items-center justify-center z-[1]">
            {[0,1,2].map(i => (
              <motion.div key={i}
                className="absolute flex items-center justify-center"
                style={{
                  width: 38, height: 52,
                  left: `calc(50% + ${(i - 1) * 58}px - 19px)`,
                  borderRadius: 20,
                  background: `linear-gradient(180deg, ${vis.color}1E, ${vis.color}08)`,
                  border: `1px solid ${vis.color}${i === 1 ? '45' : '25'}`,
                  boxShadow: `0 0 ${i === 1 ? 18 : 8}px ${vis.color}${i === 1 ? '35' : '18'}`,
                }}
                animate={{ y: [0, i === 1 ? -12 : -7, 0], opacity: [0.55, i === 1 ? 1 : 0.75, 0.55] }}
                transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.6, ease: 'easeInOut' }}
              >
                <span style={{ fontSize: i === 1 ? 16 : 13 }}>
                  {i === 0 ? '🎮' : i === 1 ? '💎' : '✨'}
                </span>
              </motion.div>
            ))}
          </div>

          {/* READY pulse */}
          <div className="absolute bottom-3 inset-x-0 flex justify-center z-[4]">
            <motion.span className="font-pixel"
              style={{ fontSize: 7.5, color: `${vis.color}70`, letterSpacing: '0.22em' }}
              animate={{ opacity: [1, 0.15, 1] }} transition={{ duration: 1.3, repeat: Infinity }}>
              {CASES_COMING_SOON ? '◆ COMING SOON ◆' : '◆ READY TO DROP ◆'}
            </motion.span>
          </div>
        </div>

        {/* Info */}
        <div className="px-4 pt-4 pb-2">
          <h3 className="font-heading font-black text-white mb-0.5" style={{ fontSize: 18,
            textShadow: `0 0 20px ${vis.color}30` }}>
            {vis.label}
          </h3>
          <p className="font-pixel mb-3" style={{ fontSize: 7, color: 'rgba(255,255,255,0.24)', letterSpacing: '0.14em' }}>
            {vis.tagline}
          </p>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-pixel px-2.5 py-1.5 rounded-lg"
              style={{ fontSize: 7, background: `${vis.color}0E`, border: `1px solid ${vis.color}22`,
                color: `${vis.color}BB`, letterSpacing: '0.1em' }}>
              {config.rewards.length} {cs.drops}
            </span>
            <span className="font-pixel px-2.5 py-1.5 rounded-lg"
              style={{ fontSize: 7, background: 'rgba(255,200,87,0.07)', border: '1px solid rgba(255,200,87,0.18)',
                color: 'rgba(255,200,87,0.7)', letterSpacing: '0.1em' }}>
              {CASES_COMING_SOON ? cs.soon : `${cs.from} ${formatPrice(config.price)}`}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="px-4 pb-5">
          <Link href={CASES_COMING_SOON ? '/cases' : `/cases/${config.id}`}>
            <motion.div
              className="relative w-full rounded-xl overflow-hidden cursor-pointer flex items-center justify-center gap-2.5"
              style={{
                height: 52,
                background: `linear-gradient(135deg, ${vis.color}22 0%, ${vis.color}0E 100%)`,
                border: `1.5px solid ${vis.color}38`,
              }}
              animate={{ boxShadow: hovered
                ? `0 0 40px ${vis.glow}, 0 0 80px ${vis.glow}50, 0 8px 24px rgba(0,0,0,0.5)`
                : `0 0 20px ${vis.glow}, 0 8px 24px rgba(0,0,0,0.4)` }}
              transition={{ duration: 0.4 }}
              whileTap={{ scale: 0.97 }}>
              {/* Animated border */}
              <motion.div className="absolute inset-0 rounded-xl pointer-events-none"
                style={{ border: `1px solid ${vis.color}` }}
                animate={{ opacity: [0.15, 0.55, 0.15] }} transition={{ duration: 1.8, repeat: Infinity }} />
              {/* Shine */}
              <motion.div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.1) 50%, transparent 65%)' }}
                animate={{ x: hovered ? ['-100%', '200%'] : '-100%' }}
                transition={{ duration: 1.5, repeat: hovered ? Infinity : 0, repeatDelay: 0.5 }} />
              {/* Top glow line */}
              <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
                style={{ background: `linear-gradient(90deg, transparent, ${vis.color}80, transparent)` }} />
              <Zap className="w-4 h-4 relative z-10" style={{ color: vis.color }} />
              <span className="font-heading font-black text-white relative z-10 tracking-wider" style={{ fontSize: 13 }}>
                {CASES_COMING_SOON ? cs.soon : cs.launch}
              </span>
              <ChevronRight className="w-4 h-4 relative z-10 opacity-50" style={{ color: vis.color }} />
            </motion.div>
          </Link>
        </div>

        {/* Floor reflection */}
        <div className="pointer-events-none"
          style={{ height: 24, marginTop: -1, position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '85%', height: 2,
            background: `linear-gradient(90deg, transparent 5%, ${vis.color}35 30%, ${vis.color}55 50%, ${vis.color}35 70%, transparent 95%)`,
          }} />
          <div style={{
            position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
            width: '80%', height: 22,
            background: `radial-gradient(ellipse at 50% 0%, ${vis.color}28 0%, transparent 70%)`,
            filter: 'blur(4px)',
          }} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
export default function MysteryCases() {
  const cs = useDict().home.cases;
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0A0A0F 0%, #0B0818 50%, #0A0A0F 100%)' }} />

      {/* Animated cyber grid */}
      <motion.div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,1) 1px,transparent 1px)',
          backgroundSize: '64px 64px', opacity: 0.02 }}
        animate={{ backgroundPositionY: ['0px', '64px'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} />

      {/* Fog blobs */}
      {[
        { x: '8%',  y: '30%', w: 380, h: 300, c: '#7C3AED', o: 0.06 },
        { x: '65%', y: '55%', w: 340, h: 280, c: '#FF00AA', o: 0.045 },
        { x: '45%', y: '10%', w: 500, h: 200, c: '#7C3AED', o: 0.05 },
        { x: '78%', y: '10%', w: 280, h: 260, c: '#00E5FF', o: 0.04 },
      ].map((b, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ left: b.x, top: b.y, width: b.w, height: b.h, backgroundColor: b.c,
            filter: 'blur(90px)', opacity: b.o }}
          animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
          transition={{ duration: 12 + i * 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 1.5 }} />
      ))}

      {/* Spotlight from top center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 700, height: 500,
          background: 'conic-gradient(from 270deg at 50% 0%, transparent 25%, rgba(124,58,237,0.08) 40%, rgba(124,58,237,0.14) 50%, rgba(124,58,237,0.08) 60%, transparent 75%)',
          filter: 'blur(10px)',
        }} />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)', backgroundSize: '100% 3px' }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 95% 95% at 50% 50%, transparent 50%, rgba(10,10,15,0.6) 100%)' }} />

      {/* Top divider */}
      <div className="absolute top-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(124,58,237,0.4) 35%, rgba(0,229,255,0.25) 65%, transparent 95%)' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14">

          {/* Live badge / In-dev badge */}
          {CASES_COMING_SOON ? (
            <div className="inline-flex items-center gap-2.5 mb-6 px-4 py-2 rounded-full"
              style={{ background: 'rgba(255,200,87,0.07)', border: '1px solid rgba(255,200,87,0.25)' }}>
              <motion.div className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: '#FFC857' }}
                animate={{ opacity: [1, 0.15, 1] }} transition={{ duration: 0.85, repeat: Infinity }} />
              <span className="font-pixel" style={{ fontSize: 8.5, color: 'rgba(255,200,87,0.85)', letterSpacing: '0.18em' }}>
                {cs.inDev}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full"
              style={{ background: 'rgba(255,0,170,0.07)', border: '1px solid rgba(255,0,170,0.22)' }}>
              <motion.div className="w-1.5 h-1.5 rounded-full bg-[#FF00AA]"
                animate={{ opacity: [1, 0.15, 1] }} transition={{ duration: 0.85, repeat: Infinity }} />
              <LiveTicker />
            </div>
          )}

          <h2 className="font-heading font-black text-white leading-none mb-4"
            style={{ fontSize: 'clamp(36px,5vw,64px)', letterSpacing: '-0.02em' }}>
            ARCANE{' '}
            <span style={{
              background: 'linear-gradient(90deg, #7C3AED 0%, #FF00AA 50%, #00E5FF 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              filter: 'drop-shadow(0 0 20px rgba(124,58,237,0.4))',
            }}>DROP</span>
          </h2>

          <p className="font-body mx-auto mb-2" style={{ fontSize: 15, color: '#6B7280', maxWidth: '440px', lineHeight: 1.7 }}>
            {cs.desc}
          </p>
          <motion.p className="font-pixel"
            style={{ fontSize: 8.5, color: 'rgba(124,58,237,0.5)', letterSpacing: '0.2em' }}
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }}>
            ◆ ARCANE DROP SYSTEM ◆
          </motion.p>
        </motion.div>

        {/* Machine grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
          {CASES_LIST.map((c, i) => (
            <MachineCard key={c.id} config={c} vis={MACHINE_VIS[c.id as MachineId]} index={i} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ delay: 0.5 }}
          className="text-center">
          <Link href="/cases">
            <motion.span
              className="inline-flex items-center gap-2 cursor-pointer font-pixel"
              style={{ fontSize: 9.5, color: 'rgba(124,58,237,0.5)', letterSpacing: '0.2em' }}
              whileHover={{ color: 'rgba(124,58,237,0.9)' }}
              transition={{ duration: 0.2 }}>
              {cs.seeAll} →
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
