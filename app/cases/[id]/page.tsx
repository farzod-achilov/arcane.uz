'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import {
  CASES, RARITY_META, CaseReward, CaseConfig, CaseTier, Rarity,
} from '@/lib/casesData';
import { formatPrice, cn } from '@/lib/utils';
import { ThreeReels } from '@/components/cases/ThreeReels';
import { RewardReveal } from '@/components/cases/RewardReveal';
import { LiveDropFeed } from '@/components/cases/LiveDropFeed';

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase = 'idle' | 'opening' | 'spinning' | 'result';

function addToInventory(reward: CaseReward, caseId: string) {
  if (typeof window === 'undefined') return;
  try {
    const prev = JSON.parse(localStorage.getItem('arcane_inventory') ?? '[]') as object[];
    prev.unshift({ ...reward, openedAt: Date.now(), caseId });
    localStorage.setItem('arcane_inventory', JSON.stringify(prev.slice(0, 100)));
  } catch { /* ignore */ }
}

// ══════════════════════════════════════════════════════════════════════════════
// BACKGROUND
// ══════════════════════════════════════════════════════════════════════════════
function Atmosphere({ c, phase }: { c: CaseConfig; phase: Phase }) {
  const particles = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i, x: 5 + Math.random() * 90, y: 5 + Math.random() * 90,
      size: 1 + Math.random() * 2.5, duration: 6 + Math.random() * 10,
      delay: Math.random() * 8, opacity: 0.1 + Math.random() * 0.28,
    })), [],
  );
  const spinning = phase === 'spinning';
  const opening  = phase === 'opening';

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#05050E]" />

      {/* Primary glow */}
      <motion.div
        className="absolute blur-[180px] rounded-full"
        style={{ width: 900, height: 900, top: '20%', left: '50%', transform: 'translate(-50%,-50%)', backgroundColor: c.accentColor }}
        animate={{ opacity: spinning ? [0.05, 0.13, 0.05] : opening ? 0.12 : 0.05 }}
        transition={{ duration: 1.8, repeat: spinning ? Infinity : 0 }}
      />

      {/* Bottom warmth */}
      <div className="absolute blur-[200px] rounded-full"
        style={{ width: 700, height: 350, bottom: -80, left: '50%', transform: 'translateX(-50%)', backgroundColor: c.accentColor, opacity: 0.035 }}
      />

      {/* Scanlines */}
      <div className="absolute inset-0 opacity-[0.022]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)', backgroundSize: '100% 3px' }}
      />

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.012]"
        style={{ backgroundImage: `linear-gradient(${c.accentColor} 1px,transparent 1px),linear-gradient(90deg,${c.accentColor} 1px,transparent 1px)`, backgroundSize: '64px 64px' }}
      />

      {/* Vignette */}
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%,transparent 35%,rgba(5,5,14,0.88) 100%)' }}
      />

      {/* Opening pulse */}
      <AnimatePresence>
        {opening && (
          <motion.div className="absolute inset-0"
            style={{ background: `radial-gradient(circle at 50% 38%,${c.accentColor}38 0%,transparent 60%)` }}
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
          />
        )}
      </AnimatePresence>

      {/* Particles */}
      {particles.map((p) => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`, backgroundColor: c.accentColor, boxShadow: `0 0 ${p.size * 3}px ${c.accentColor}` }}
          animate={{ y: [0, -20, 0], opacity: [p.opacity, p.opacity * 0.2, p.opacity] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CENTERPIECE (idle)
// ══════════════════════════════════════════════════════════════════════════════
function Centerpiece({ c, phase, onClick }: { c: CaseConfig; phase: Phase; onClick: () => void }) {
  const idle    = phase === 'idle';
  const opening = phase === 'opening';
  const arcane  = c.id === 'arcane';
  const gold    = c.id === 'gold';

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: 300, height: 300 }}>
      {/* Energy rings */}
      {arcane && [0,1,2].map(i => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ width: 280+i*65, height: 280+i*65, border: `1px solid ${c.accentColor}` }}
          animate={{ scale: [0.88, 1.12], opacity: [0.32, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.9, ease: 'easeOut' }}
        />
      ))}
      {gold && [0,1].map(i => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ width: 290+i*50, height: 290+i*50, border: `1px solid ${c.accentColor}50` }}
          animate={{ scale: [0.9, 1.1], opacity: [0.22, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: i * 1.2, ease: 'easeOut' }}
        />
      ))}

      {/* Ambient halo */}
      <motion.div className="absolute rounded-full blur-[65px] pointer-events-none"
        style={{ width: 420, height: 420, backgroundColor: c.accentColor }}
        animate={{ opacity: [0.07, 0.16, 0.07], scale: [0.92, 1.04, 0.92] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Ground reflection */}
      <div className="absolute pointer-events-none blur-[10px]"
        style={{ bottom: -16, width: 180, height: 20, background: `radial-gradient(ellipse,${c.glowColor} 0%,transparent 70%)`, opacity: 0.55 }}
      />

      {/* Floating wrapper */}
      <motion.div className="relative" animate={idle ? { y: [0,-12,0] } : {}}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ cursor: idle ? 'pointer' : 'default' }}
        onClick={idle ? onClick : undefined}
      >
        {/* Main cube */}
        <motion.div
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            width: 248, height: 248, borderRadius: 28, border: `2px solid ${c.accentColor}42`,
            background: arcane
              ? 'linear-gradient(135deg,rgba(124,58,237,.2) 0%,rgba(6,182,212,.13) 100%)'
              : gold
              ? 'linear-gradient(135deg,rgba(245,158,11,.17) 0%,rgba(251,191,36,.08) 100%)'
              : 'linear-gradient(135deg,rgba(148,163,184,.13) 0%,rgba(100,116,139,.06) 100%)',
          }}
          animate={{ boxShadow: opening
            ? `0 0 100px ${c.glowColor},0 0 200px ${c.glowColor}`
            : [`0 0 35px ${c.glowColor},0 0 70px ${c.glowColor}55,inset 0 1px 0 rgba(255,255,255,.08)`,
               `0 0 55px ${c.glowColor},0 0 110px ${c.glowColor}38,inset 0 1px 0 rgba(255,255,255,.13)`,
               `0 0 35px ${c.glowColor},0 0 70px ${c.glowColor}55,inset 0 1px 0 rgba(255,255,255,.08)`],
          }}
          transition={{ duration: 2.6, repeat: opening ? 0 : Infinity, ease: 'easeInOut' }}
          whileHover={idle ? { scale: 1.04 } : {}} whileTap={idle ? { scale: 0.96 } : {}}
        >
          <div className="absolute inset-0 opacity-[0.24]" style={{ background: c.gradient }} />
          {arcane && (
            <motion.div className="absolute inset-0"
              style={{ background: `conic-gradient(from 0deg,transparent 0%,${c.accentColor}28 18%,transparent 38%)` }}
              animate={{ rotate: 360 }} transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
            />
          )}
          {gold && (
            <motion.div className="absolute inset-0"
              style={{ background: 'linear-gradient(120deg,transparent 25%,rgba(251,191,36,.13) 45%,rgba(255,255,255,.07) 50%,transparent 60%)' }}
              animate={{ x: [-248, 248] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.8 }}
            />
          )}
          {!arcane && !gold && (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg,rgba(255,255,255,.07) 0%,transparent 45%)' }} />
          )}

          <div className="absolute top-0 inset-x-0 h-px" style={{ background: `linear-gradient(90deg,transparent 5%,${c.accentColor}95 50%,transparent 95%)` }} />

          {/* Opening flash */}
          <AnimatePresence>
            {opening && (
              <motion.div className="absolute inset-0" style={{ backgroundColor: c.accentColor }}
                initial={{ opacity: 0 }} animate={{ opacity: [0, 0.45, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.55 }}
              />
            )}
          </AnimatePresence>

          {/* Icon */}
          <motion.span className="relative z-10 leading-none"
            style={{ fontSize: 84, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,.7))' }}
            animate={opening ? { rotate: [-10,10,-8,8,0], scale: [1,1.1,.94,1.06,1] } : {}}
            transition={{ duration: 0.55 }}
          >
            📦
          </motion.span>

          {idle && (
            <motion.p className="absolute bottom-5 text-[9px] font-black uppercase tracking-[0.22em] z-10"
              style={{ color: c.accentColor }}
              animate={{ opacity: [1, 0.22, 1] }} transition={{ duration: 2, repeat: Infinity }}
            >
              Нажмите
            </motion.p>
          )}

          {arcane && [
            { cls: 'top-3 left-3',    color: '#7C3AED', d: 0   },
            { cls: 'top-3 right-3',   color: '#06B6D4', d: 0.7 },
            { cls: 'bottom-3 left-3', color: '#06B6D4', d: 1.4 },
            { cls: 'bottom-3 right-3',color: '#7C3AED', d: 2.1 },
          ].map((dot, i) => (
            <motion.div key={i} className={cn('absolute w-2.5 h-2.5 rounded-full', dot.cls)}
              style={{ backgroundColor: dot.color, boxShadow: `0 0 8px ${dot.color}` }}
              animate={{ scale: [1, 1.7, 1], opacity: [1, 0.15, 1] }}
              transition={{ duration: 2.6, repeat: Infinity, delay: dot.d }}
            />
          ))}

          {!arcane && (
            <motion.div className="absolute top-3 right-3 w-3 h-3 rounded-full"
              style={{ backgroundColor: c.accentColor, boxShadow: `0 0 10px ${c.accentColor}` }}
              animate={{ scale: [1, 1.6, 1], opacity: [1, 0.2, 1] }} transition={{ duration: 2.4, repeat: Infinity }}
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// OPEN BUTTON
// ══════════════════════════════════════════════════════════════════════════════
function OpenButton({ c, phase, onClick }: { c: CaseConfig; phase: Phase; onClick: () => void }) {
  const opening = phase === 'opening';
  const disabled = phase !== 'idle';

  return (
    <motion.button
      className="relative w-full h-[60px] rounded-2xl overflow-hidden text-[13px] font-black uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed"
      style={{ background: c.gradient }}
      whileHover={!disabled ? { scale: 1.025 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      animate={{ boxShadow: opening
        ? `0 0 80px ${c.glowColor},0 8px 32px rgba(0,0,0,.5)`
        : [`0 0 28px ${c.glowColor},0 8px 28px rgba(0,0,0,.45)`,
           `0 0 50px ${c.glowColor},0 8px 28px rgba(0,0,0,.45)`,
           `0 0 28px ${c.glowColor},0 8px 28px rgba(0,0,0,.45)`],
      }}
      transition={{ duration: 2.2, repeat: opening ? 0 : Infinity }}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
    >
      {/* Shine */}
      <motion.div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(120deg,transparent 28%,rgba(255,255,255,.18) 46%,transparent 58%)' }}
        animate={{ x: ['-150%', '210%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
      />
      {/* Pulse ring */}
      <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ border: '1.5px solid rgba(255,255,255,.25)' }}
        animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.03, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
      />
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-3">
        {opening ? (
          <>
            <motion.div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full"
              animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
            />
            <span>Открываем...</span>
          </>
        ) : (
          <>
            <span className="text-[17px]">⚡</span>
            <span>Открыть кейс</span>
            <span className="text-xs font-normal opacity-50">· {formatPrice(c.price)}</span>
          </>
        )}
      </div>
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REWARDS PREVIEW (horizontal scroll)
// ══════════════════════════════════════════════════════════════════════════════
const RARITY_SORT: Record<Rarity, number> = { arcane: 0, legendary: 1, epic: 2, rare: 3, common: 4 };

function RewardsScroll({ rewards, c }: { rewards: CaseReward[]; c: CaseConfig }) {
  const sorted = useMemo(
    () => [...rewards].sort((a, b) => RARITY_SORT[a.rarity] - RARITY_SORT[b.rarity]),
    [rewards],
  );

  return (
    <motion.div className="w-full"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Возможные награды</p>
        <span className="text-[10px] text-white/22 font-semibold tabular-nums">{rewards.length} наград</span>
      </div>

      <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex gap-2" style={{ width: 'max-content' }}>
          {sorted.map((r, i) => {
            const meta = RARITY_META[r.rarity];
            return (
              <motion.div key={r.id}
                className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center flex-shrink-0 relative overflow-hidden cursor-default', meta.border, meta.bg)}
                style={{ width: 92, boxShadow: `0 0 12px ${meta.color}18` }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                whileHover={{ scale: 1.07, boxShadow: `0 0 22px ${meta.color}45` }}
              >
                <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: meta.color }} />
                <span className="text-[22px] leading-none">{r.icon}</span>
                <p className="text-[8.5px] font-bold text-white/90 leading-tight line-clamp-2">{r.name}</p>
                <span className={cn('text-[7px] font-black uppercase tracking-wide', meta.textColor)}>{meta.label}</span>
                <span className="text-[7px] text-white/25 tabular-nums">{r.probability}%</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function CaseOpenPage() {
  const params = useParams();
  const tier   = (params.id as CaseTier) ?? 'silver';
  const c      = CASES[tier];

  const [phase,      setPhase]      = useState<Phase>('idle');
  const [result,     setResult]     = useState<CaseReward | null>(null);
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => { if (!c) notFound(); }, [c]);
  if (!c) return null;

  const handleOpen = useCallback(async () => {
    if (phase !== 'idle') return;
    setPhase('opening');
    setResult(null);
    setShowReveal(false);

    const [, data] = await Promise.all([
      new Promise<void>(r => setTimeout(r, 700)),
      fetch(`/api/cases/${tier}/open`, { method: 'POST' }).then(r => r.json()).catch(() => ({ ok: false })),
    ]);

    if (!data.ok || !data.reward) { setPhase('idle'); return; }
    setResult(data.reward as CaseReward);
    setPhase('spinning');
  }, [phase, tier]);

  const handleComplete     = useCallback((finalReward: CaseReward) => {
    setResult(finalReward); // may differ from API result if reroll happened
    setPhase('result');
    setShowReveal(true);
  }, []);
  const handleOpenAgain    = useCallback(() => { setShowReveal(false); setResult(null); setPhase('idle'); }, []);
  const handleAddInventory = useCallback(() => { if (result) addToInventory(result, tier); handleOpenAgain(); }, [result, tier, handleOpenAgain]);
  const handleDismiss      = useCallback(() => { setShowReveal(false); setPhase('idle'); setResult(null); }, []);

  const showReels = phase === 'spinning' || phase === 'result';

  return (
    <div className="min-h-screen relative">
      <Atmosphere c={c} phase={phase} />

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 pt-5 flex items-center justify-between">
        <Link href="/cases" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors">
          <ChevronLeft size={15} />
          Все кейсы
        </Link>

        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-[0.12em]"
          style={{ color: c.accentColor, borderColor: `${c.accentColor}40`, background: `${c.accentColor}10` }}
          animate={{ boxShadow: [`0 0 8px ${c.glowColor}`,`0 0 16px ${c.glowColor}`,`0 0 8px ${c.glowColor}`] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <span>⬡</span>
          {c.subtitle}
        </motion.div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 pt-6 pb-24">

          {/* ── LEFT: main content ─────────────────────────────────── */}
          <div className="flex flex-col items-center gap-7">

            <AnimatePresence mode="wait">
              {!showReels ? (
                /* ── IDLE ──────────────────────────────────────────── */
                <motion.div key="idle" className="flex flex-col items-center gap-6 w-full"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }} transition={{ duration: 0.45 }}
                >
                  <Centerpiece c={c} phase={phase} onClick={handleOpen} />

                  {/* Title */}
                  <div className="text-center">
                    <motion.p className="text-[10px] font-black uppercase tracking-[0.22em] mb-1.5" style={{ color: `${c.accentColor}99` }}
                      animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>
                      ◆ Mystery Case ◆
                    </motion.p>
                    <h1 className="font-black text-white leading-none mb-2" style={{ fontSize: 'clamp(30px,5vw,52px)' }}>
                      {c.title}
                    </h1>
                    <p className="text-sm text-white/40 max-w-sm mx-auto leading-relaxed">{c.description}</p>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-8">
                    {[
                      { label: 'Стоимость',  value: formatPrice(c.price) },
                      { label: 'Наград',     value: `${c.rewards.length}` },
                      { label: 'Барабанов', value: '3' },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-white/28 mb-0.5">{label}</p>
                        <p className="text-sm font-black text-white">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="w-full max-w-sm">
                    <OpenButton c={c} phase={phase} onClick={handleOpen} />
                  </div>

                  {/* Rarity legend */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {(['common','rare','epic','legendary','arcane'] as Rarity[]).map(r => {
                      const meta = RARITY_META[r];
                      return (
                        <div key={r} className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color, boxShadow: `0 0 5px ${meta.color}` }} />
                          <span className={cn('text-[9px] font-bold uppercase tracking-wider', meta.textColor)}>{meta.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

              ) : (
                /* ── SPINNING / RESULT header ──────────────────────── */
                <motion.div key="spin-hdr" className="w-full text-center"
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                >
                  <h2 className="text-xl font-black text-white mb-1">{c.title}</h2>
                  <motion.p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: c.accentColor }}
                    animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 0.7, repeat: phase === 'spinning' ? Infinity : 0 }}>
                    {phase === 'spinning' ? '⚡ Барабаны крутятся...' : '✦ Результат определён'}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── THREE REELS ─────────────────────────────────────── */}
            <AnimatePresence>
              {showReels && (
                <motion.div className="w-full flex justify-center"
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4 }}
                >
                  <ThreeReels
                    rewards={c.rewards}
                    result={result}
                    spinning={phase === 'spinning'}
                    onComplete={handleComplete}
                    accentColor={c.accentColor}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Open again (after result overlay dismissed) */}
            <AnimatePresence>
              {phase === 'result' && !showReveal && (
                <motion.button
                  className="px-8 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider text-white"
                  style={{ background: c.gradient, boxShadow: `0 4px 24px ${c.glowColor}` }}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={handleOpenAgain}
                >
                  ⚡ Открыть ещё раз
                </motion.button>
              )}
            </AnimatePresence>

            {/* ── REWARDS SCROLL (idle only) ─────────────────────── */}
            <AnimatePresence>
              {phase === 'idle' && (
                <motion.div className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <RewardsScroll rewards={c.rewards} c={c} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── MOBILE LIVE DROPS ─────────────────────────────── */}
            <div className="lg:hidden w-full">
              <div className="rounded-2xl border border-white/8 p-4 backdrop-blur-sm" style={{ background: 'rgba(13,13,26,.7)' }}>
                <LiveDropFeed />
              </div>
            </div>
          </div>

          {/* ── RIGHT: live drops sidebar ────────────────────────── */}
          <div className="hidden lg:flex flex-col">
            <div className="sticky top-24 rounded-2xl border border-white/8 p-4 backdrop-blur-sm"
              style={{ background: 'rgba(13,13,26,.7)' }}>
              <LiveDropFeed />
            </div>
          </div>
        </div>
      </div>

      {/* ── Result overlay ──────────────────────────────────────── */}
      <RewardReveal
        reward={result} visible={showReveal}
        onOpenAgain={handleOpenAgain} onAddInventory={handleAddInventory} onDismiss={handleDismiss}
      />
    </div>
  );
}
