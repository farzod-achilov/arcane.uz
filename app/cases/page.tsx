'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, Users, ChevronRight, Trophy, Star } from 'lucide-react';
import Link from 'next/link';
import { CASES_LIST, type CaseConfig } from '@/lib/casesData';
import { MACHINE_VIS, type MachineId, generateLiveWins, DROP_VFX } from '@/lib/arcaneDropData';
import { formatPrice } from '@/lib/utils';

// ── Jackpot counter ───────────────────────────────────────────────────────────
function JackpotCounter() {
  const [value, setValue] = useState(87_540_000);
  useEffect(() => {
    const t = setInterval(() => setValue(v => v + Math.floor(Math.random() * 4000 + 500)), 800);
    return () => clearInterval(t);
  }, []);
  const fmt = value.toLocaleString('ru-RU');
  return (
    <span className="font-heading font-black tabular-nums"
      style={{ fontSize: 'clamp(22px,4vw,42px)', color: '#FFC857',
        textShadow: '0 0 30px rgba(255,200,87,0.7), 0 0 60px rgba(255,200,87,0.3)' }}>
      {fmt} <span style={{ fontSize: '0.5em', color: 'rgba(255,200,87,0.6)' }}>СУМ</span>
    </span>
  );
}

// ── Live mini-ticker ──────────────────────────────────────────────────────────
function LiveTicker() {
  const wins = useMemo(() => generateLiveWins(18), []);
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
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
        style={{ background: vfx.bg, border: `1px solid ${vfx.border}` }}>
        <motion.div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: vfx.color, boxShadow: `0 0 6px ${vfx.color}` }}
          animate={{ scale: [1, 1.6, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
        <span className="font-pixel" style={{ fontSize: 8.5, color: vfx.color, letterSpacing: '0.08em' }}>
          {vfx.label}
        </span>
        <span className="font-body text-white/50 text-xs">{w.user} выиграл</span>
        <span className="font-heading font-bold text-white text-xs">{w.reward}</span>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Machine card ──────────────────────────────────────────────────────────────
function MachineCard({ config, vis }: { config: CaseConfig; vis: typeof MACHINE_VIS[MachineId] }) {
  const [hovered, setHovered] = useState(false);

  const rareCounts = config.rewards.filter(r =>
    ['rare','epic','legendary','arcane'].includes(r.rarity)).length;
  const epCounts   = config.rewards.filter(r =>
    ['epic','legendary','arcane'].includes(r.rarity)).length;
  const bestReward = [...config.rewards].sort((a, b) => b.coinValue - a.coinValue)[0];

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col"
    >
      {/* Outer glow halo */}
      <motion.div className="absolute -inset-6 rounded-[36px] blur-2xl pointer-events-none"
        style={{ backgroundColor: vis.color }}
        animate={{ opacity: hovered ? 0.12 : 0.04 }}
        transition={{ duration: 0.4 }}
      />

      {/* Cabinet */}
      <div className="relative flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #0C0C20 0%, #07071A 100%)',
          border: `1px solid ${vis.color}28`,
          boxShadow: `0 0 50px ${vis.glow}, 0 24px 64px rgba(0,0,0,0.7)`,
        }}
      >
        {/* Side neon strips */}
        <div className="absolute left-0 top-[18%] bottom-[22%] w-[3px] rounded-r-full pointer-events-none"
          style={{ background: vis.color, boxShadow: `0 0 14px ${vis.color}, 0 0 28px ${vis.color}80` }} />
        <div className="absolute right-0 top-[18%] bottom-[22%] w-[3px] rounded-l-full pointer-events-none"
          style={{ background: vis.color, boxShadow: `0 0 14px ${vis.color}, 0 0 28px ${vis.color}80` }} />

        {/* Marquee header */}
        <div className="relative py-2.5 px-4 text-center overflow-hidden"
          style={{
            background: `linear-gradient(90deg, transparent, ${vis.color}10 50%, transparent)`,
            borderBottom: `1px solid ${vis.color}18`,
          }}>
          <motion.div className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${vis.color}14, transparent)` }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
          />
          <span className="font-pixel relative z-10" style={{ fontSize: 8, letterSpacing: '0.22em', color: `${vis.color}BB` }}>
            ARCANE DROP ◆ UNIT {vis.tier}
          </span>
        </div>

        {/* Screen */}
        <div className="mx-4 mt-4 rounded-xl overflow-hidden relative"
          style={{ height: 200, background: vis.screenBg, border: `1px solid ${vis.color}22`,
            boxShadow: `inset 0 0 40px ${vis.color}0D` }}>
          {/* CRT scanlines */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)', backgroundSize: '100% 3px' }} />
          {/* Screen glow */}
          <motion.div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 50% 35%, ${vis.color}14 0%, transparent 60%)` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }} />

          {/* Floating capsules */}
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              className="absolute flex items-center justify-center"
              style={{
                width: 38, height: 52, left: `${18 + i * 28}%`, top: '50%',
                borderRadius: 24,
                background: `linear-gradient(180deg, ${vis.color}20, ${vis.color}08)`,
                border: `1px solid ${vis.color}35`,
                boxShadow: `0 0 16px ${vis.color}30`,
              }}
              animate={{ y: [-20, -32, -20], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.2 + i * 0.5, repeat: Infinity, delay: i * 0.7, ease: 'easeInOut' }}
            >
              <span style={{ fontSize: 16 }}>
                {i === 0 ? '🎮' : i === 1 ? '💎' : '✨'}
              </span>
            </motion.div>
          ))}

          {/* READY pulse */}
          <div className="absolute bottom-3 inset-x-0 flex justify-center">
            <motion.span className="font-pixel" style={{ fontSize: 8, color: `${vis.color}70`, letterSpacing: '0.22em' }}
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
              ◆ READY TO DROP ◆
            </motion.span>
          </div>
        </div>

        {/* Info */}
        <div className="px-4 pt-4 pb-2">
          <h3 className="font-heading font-black text-white leading-none mb-0.5" style={{ fontSize: 20 }}>
            {vis.label}
          </h3>
          <p className="font-pixel mb-4" style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.13em' }}>
            {vis.tagline}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'ДРОПОВ', value: config.rewards.length },
              { label: 'RARE+',  value: rareCounts,  accent: vis.color },
              { label: 'EPIC+',  value: epCounts,    accent: '#FF00AA' },
            ].map(s => (
              <div key={s.label} className="rounded-lg py-2 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-pixel mb-0.5" style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em' }}>
                  {s.label}
                </p>
                <p className="font-heading font-black" style={{ fontSize: 15, color: s.accent ?? 'white' }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Best reward */}
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,200,87,0.06)', border: '1px solid rgba(255,200,87,0.15)' }}>
            <Trophy className="w-3.5 h-3.5 flex-shrink-0 text-amber-400/70" />
            <span className="font-pixel" style={{ fontSize: 7.5, color: 'rgba(255,200,87,0.6)', letterSpacing: '0.1em' }}>ЛУЧШИЙ ДРП</span>
            <span className="font-body text-white/50 text-xs ml-auto truncate">{bestReward.name}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="px-4 pb-4">
          <Link href={`/cases/${config.id}`}>
            <motion.div
              className="relative w-full h-13 rounded-xl flex items-center justify-center gap-2.5 overflow-hidden cursor-pointer"
              style={{
                height: 52,
                background: `linear-gradient(135deg, ${vis.color}22 0%, ${vis.color}10 100%)`,
                border: `1px solid ${vis.color}40`,
              }}
              animate={{
                boxShadow: [`0 0 22px ${vis.glow}`, `0 0 40px ${vis.glow}`, `0 0 22px ${vis.glow}`],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }}
                animate={{ x: ['-100%', '220%'] }}
                transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.5 }}
              />
              <Zap className="w-4 h-4 relative z-10" style={{ color: vis.color }} />
              <span className="font-heading font-black text-white relative z-10 tracking-wider" style={{ fontSize: 13 }}>
                ЗАПУСТИТЬ — {formatPrice(config.price)}
              </span>
              <ChevronRight className="w-4 h-4 relative z-10" style={{ color: `${vis.color}80` }} />
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Stats row ─────────────────────────────────────────────────────────────────
function StatBadge({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
      <div>
        <p className="font-pixel leading-none mb-0.5" style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>
          {label}
        </p>
        <p className="font-heading font-bold text-white leading-none" style={{ fontSize: 13 }}>{value}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ArcaneDropHub() {
  const machineEntries = CASES_LIST.map(c => ({
    config: c,
    vis: MACHINE_VIS[c.id as MachineId],
  }));

  return (
    <div className="min-h-screen" style={{ background: '#050816' }}>
      {/* Atmospheric background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[160px] opacity-20"
          style={{ backgroundColor: '#7C3AED' }} />
        <div className="absolute top-[30%] left-[10%] w-[400px] h-[400px] rounded-full blur-[140px] opacity-10"
          style={{ backgroundColor: '#00E5FF' }} />
        <div className="absolute top-[20%] right-[5%] w-[350px] h-[350px] rounded-full blur-[120px] opacity-10"
          style={{ backgroundColor: '#FF00AA' }} />
        {/* Scanlines */}
        <div className="absolute inset-0 opacity-[0.016]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)', backgroundSize: '100% 3px' }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.012]"
          style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,1) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* ── Hero ── */}
        <div className="pt-8 pb-12 text-center">
          {/* Live badge */}
          <motion.div className="inline-flex items-center gap-2 mb-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(255,0,170,0.08)', border: '1px solid rgba(255,0,170,0.25)' }}>
              <motion.div className="w-1.5 h-1.5 rounded-full bg-[#FF00AA]"
                animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.85, repeat: Infinity }} />
              <span className="font-pixel text-[#FF00AA]/80" style={{ fontSize: 8.5, letterSpacing: '0.16em' }}>
                LIVE — ИГРОКОВ ОНЛАЙН: 2,847
              </span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
            <h1 className="font-heading font-black leading-none mb-3"
              style={{ fontSize: 'clamp(48px,8vw,96px)', letterSpacing: '-0.02em' }}>
              <span className="text-white">ARCANE</span>{' '}
              <span style={{
                background: 'linear-gradient(90deg, #7C3AED 0%, #FF00AA 50%, #00E5FF 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                filter: 'drop-shadow(0 0 30px rgba(124,58,237,0.5))',
              }}>DROP</span>
            </h1>
            <p className="font-body text-white/40 mx-auto" style={{ fontSize: 16, maxWidth: 500, lineHeight: 1.7 }}>
              Футуристические аркадные машины с реальными наградами. Открой капсулу и получи свой дроп.
            </p>
          </motion.div>

          {/* Global jackpot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.25 }}
            className="inline-flex flex-col items-center mt-8 mb-6 px-8 py-4 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,200,87,0.08), rgba(255,200,87,0.04))',
              border: '1px solid rgba(255,200,87,0.2)',
              boxShadow: '0 0 60px rgba(255,200,87,0.1)',
            }}>
            <span className="font-pixel text-amber-400/60 mb-1" style={{ fontSize: 8, letterSpacing: '0.2em' }}>
              ◆ ГЛОБАЛЬНЫЙ ДЖЕКПОТ ◆
            </span>
            <JackpotCounter />
          </motion.div>

          {/* Live feed ticker */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <LiveTicker />
          </motion.div>
        </div>

        {/* ── Stats row ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mb-12">
          <StatBadge icon={Users}     label="ОНЛАЙН"       value="2,847"    color="#00E5FF" />
          <StatBadge icon={TrendingUp} label="ДРОПОВ СЕГОДНЯ" value="14,291"  color="#FF00AA" />
          <StatBadge icon={Trophy}    label="ЛЕГЕНД СЕГОДНЯ" value="37"       color="#FFC857" />
          <StatBadge icon={Star}      label="ARCANE ДРОПЫ"  value="8"        color="#A78BFA" />
        </motion.div>

        {/* ── Machine cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {machineEntries.map(({ config, vis }, i) => (
            <motion.div key={config.id}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}>
              <MachineCard config={config} vis={vis} />
            </motion.div>
          ))}
        </div>

        {/* ── How it works ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-16">
          <p className="font-pixel text-center mb-8" style={{ fontSize: 9, color: 'rgba(124,58,237,0.6)', letterSpacing: '0.2em' }}>
            ◆ КАК ЭТО РАБОТАЕТ ◆
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { step: '01', icon: '🪙', title: 'Вставь монету', desc: 'Используй ARC монеты для запуска машины' },
              { step: '02', icon: '⚡', title: 'Зарядка',        desc: 'Машина накапливает энергию для дропа' },
              { step: '03', icon: '💊', title: 'Капсула падает', desc: 'Аркадная капсула летит через машину' },
              { step: '04', icon: '🏆', title: 'Получи награду', desc: 'Монеты, игры или редкий ARCANE дроп' },
            ].map(s => (
              <div key={s.step} className="relative p-4 rounded-xl text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="font-pixel absolute top-3 left-3" style={{ fontSize: 7, color: 'rgba(124,58,237,0.4)' }}>
                  {s.step}
                </span>
                <div className="text-2xl mb-2 mt-1">{s.icon}</div>
                <p className="font-heading font-bold text-white text-sm mb-1">{s.title}</p>
                <p className="font-body text-white/35" style={{ fontSize: 12, lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
