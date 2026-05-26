'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Zap, Shield, TrendingUp, Star, Trophy, Users, RotateCcw, Activity, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { CASES, type CaseReward, type CaseTier, type Rarity } from '@/lib/casesData';
import { MACHINE_VIS, DROP_VFX, generateLiveWins, type MachineId } from '@/lib/arcaneDropData';
import { formatPrice, cn } from '@/lib/utils';
import { useOverlay } from '@/lib/overlayContext';
import { useCoin } from '@/lib/coinContext';

type DropPhase = 'idle' | 'inserting' | 'charging' | 'dropping' | 'opening' | 'revealing' | 'selling' | 'sold' | 'claimed';

function timeAgo(ts: number) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return `${s}с`;
  return `${Math.round(s / 60)}м`;
}

// ── Ambient particles ─────────────────────────────────────────────────────────
function AmbientParticles({ color }: { color: string }) {
  const pts = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: 1 + Math.random() * 2.5,
    dur: 8 + Math.random() * 14,
    delay: Math.random() * 10,
    opacity: 0.12 + Math.random() * 0.22,
  })), []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pts.map(p => (
        <motion.div key={p.id}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, bottom: '-4px',
            backgroundColor: color, boxShadow: `0 0 ${p.size * 4}px ${color}` }}
          animate={{ y: [0, -(300 + Math.random() * 300)], opacity: [0, p.opacity, p.opacity, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ── Burst particles (on drop) ─────────────────────────────────────────────────
function BurstParticles({ color, count, active }: { color: string; count: number; active: boolean }) {
  const pts = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, x: 45 + Math.random() * 10, y: 45 + Math.random() * 10,
    vx: (Math.random() - 0.5) * 320, vy: -(60 + Math.random() * 260),
    size: 2 + Math.random() * 5, delay: Math.random() * 0.35,
  })), [count]);
  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[210] overflow-hidden">
      {pts.map(p => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`,
            backgroundColor: color, boxShadow: `0 0 ${p.size * 3}px ${color}` }}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{ opacity: 0, x: p.vx, y: p.vy, scale: 0.2 }}
          transition={{ duration: 1.4 + Math.random() * 0.4, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ── Coin fly cashout effect ───────────────────────────────────────────────────
function CoinFlyEffect({ active, coinValue }: { active: boolean; coinValue: number }) {
  const coins = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    startX: 40 + Math.random() * 20,
    startY: 40 + Math.random() * 20,
    vx: (Math.random() - 0.5) * 420,
    vy: -(130 + Math.random() * 350),
    size: 16 + Math.random() * 20,
    delay: i * 0.055,
    rot: (Math.random() - 0.5) * 720,
  })), []);
  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[300] overflow-hidden">
      {coins.map(c => (
        <motion.div key={c.id} className="absolute select-none"
          style={{ left: `${c.startX}%`, top: `${c.startY}%`, fontSize: c.size, lineHeight: 1 }}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{ opacity: [1, 1, 0], x: c.vx, y: c.vy, rotate: c.rot, scale: [1, 1.3, 0.5] }}
          transition={{ duration: 1.3 + Math.random() * 0.4, delay: c.delay, ease: [0.2, 0.8, 0.3, 1] }}>
          🪙
        </motion.div>
      ))}
      <motion.div className="absolute left-1/2 pointer-events-none whitespace-nowrap"
        style={{ top: '40%', transform: 'translate(-50%, -50%)' }}
        initial={{ opacity: 0, y: 0, scale: 0.4 }}
        animate={{ opacity: [0, 1, 1, 0], y: -160, scale: [0.4, 1.5, 1.3, 0.9] }}
        transition={{ duration: 2.2, ease: 'easeOut', times: [0, 0.15, 0.65, 1] }}>
        <div className="font-heading font-black text-center"
          style={{ fontSize: 42, color: '#FFC857',
            textShadow: '0 0 30px rgba(255,200,87,1), 0 0 70px rgba(255,200,87,0.7), 0 0 140px rgba(255,200,87,0.4)' }}>
          +{coinValue.toLocaleString()} ARCANE
        </div>
      </motion.div>
    </div>
  );
}

// ── ARCANE COIN balance counter (nav) ────────────────────────────────────────
function ArcBalanceCounter({ balance, showBurst, earned }: { balance: number; showBurst: boolean; earned: number }) {
  return (
    <motion.div className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full overflow-visible"
      style={{ background: 'rgba(255,200,87,0.08)', border: '1px solid rgba(255,200,87,0.28)' }}
      animate={showBurst ? {
        boxShadow: ['0 0 0px transparent', '0 0 40px rgba(255,200,87,0.9)', '0 0 20px rgba(255,200,87,0.4)', '0 0 0px transparent'],
        scale: [1, 1.14, 1.06, 1],
      } : { boxShadow: '0 0 10px rgba(255,200,87,0.12)' }}
      transition={{ duration: 0.7 }}>
      <motion.span className="text-sm"
        animate={showBurst ? { rotate: [0, 360] } : {}}
        transition={{ duration: 0.5, ease: 'easeOut' }}>🪙</motion.span>
      <motion.span key={balance} className="font-heading font-black text-amber-400 tabular-nums"
        style={{ fontSize: 14 }}
        initial={showBurst ? { scale: 1.3, color: '#ffffff' } : false}
        animate={{ scale: 1, color: '#FFC857' }}
        transition={{ duration: 0.4 }}>
        {balance.toLocaleString()}
      </motion.span>
      <span className="font-pixel" style={{ fontSize: 7, color: 'rgba(255,200,87,0.4)', letterSpacing: '0.12em' }}>ARCANE</span>
      <AnimatePresence>
        {showBurst && earned > 0 && (
          <motion.div className="absolute -top-6 right-0 pointer-events-none"
            initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -18 }}
            exit={{ opacity: 0 }} transition={{ duration: 1.3, delay: 0.4 }}>
            <span className="font-pixel font-bold text-amber-400" style={{ fontSize: 10, whiteSpace: 'nowrap',
              textShadow: '0 0 12px rgba(255,200,87,0.9)' }}>
              +{earned.toLocaleString()} ARCANE
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Machine screen content ────────────────────────────────────────────────────
function MachineScreen({ phase, vis, reward }: {
  phase: DropPhase;
  vis: typeof MACHINE_VIS[MachineId];
  reward: CaseReward | null;
}) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base screen glow */}
      <motion.div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 40%, ${vis.color}16 0%, transparent 65%)` }}
        animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />

      {/* CRT scanlines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.18) 0px,rgba(0,0,0,0.18) 1px,transparent 1px,transparent 3px)', backgroundSize: '100% 3px', zIndex: 10 }} />

      {/* Moving scanbar */}
      <motion.div className="absolute inset-x-0 h-[2px] pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${vis.color}80, transparent)`, opacity: 0.6, zIndex: 11 }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      {/* Corner indicators */}
      {[['top-2 left-2','top right'],['top-2 right-2','top left'],['bottom-2 left-2','bottom right'],['bottom-2 right-2','bottom left']].map(([pos, corner], i) => (
        <motion.div key={i} className={`absolute ${pos} w-3 h-3 pointer-events-none`}
          style={{
            borderTop: corner.includes('top') ? `1.5px solid ${vis.color}80` : 'none',
            borderBottom: corner.includes('bottom') ? `1.5px solid ${vis.color}50` : 'none',
            borderLeft: corner.includes('left') ? `1.5px solid ${vis.color}80` : 'none',
            borderRight: corner.includes('right') ? `1.5px solid ${vis.color}50` : 'none',
          }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}

      {/* ── IDLE ── */}
      {phase === 'idle' && (
        <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          {/* Floating capsule outlines */}
          <div className="relative w-full h-40 flex items-center justify-center">
            {[0,1,2].map(i => (
              <motion.div key={i}
                className="absolute flex items-center justify-center"
                style={{
                  width: 44, height: 60,
                  borderRadius: 22,
                  left: `calc(50% + ${(i - 1) * 68}px - 22px)`,
                  background: `linear-gradient(180deg, ${vis.color}18, ${vis.color}06)`,
                  border: `1px solid ${vis.color}${i === 1 ? '50' : '28'}`,
                  boxShadow: `0 0 ${i === 1 ? 24 : 10}px ${vis.color}${i === 1 ? '40' : '18'}`,
                }}
                animate={{ y: [0, i === 1 ? -14 : -8, 0], opacity: [0.5, i === 1 ? 1 : 0.7, 0.5] }}
                transition={{ duration: 2.8 + i*0.4, repeat: Infinity, delay: i*0.55, ease: 'easeInOut' }}
              >
                <span style={{ fontSize: i === 1 ? 18 : 14 }}>{i === 0 ? '🎮' : i === 1 ? '💎' : '✨'}</span>
              </motion.div>
            ))}
          </div>
          {/* System ready text */}
          <div className="flex flex-col items-center gap-1.5">
            <motion.p className="font-pixel" style={{ fontSize: 8, color: `${vis.color}90`, letterSpacing: '0.24em' }}
              animate={{ opacity: [1, 0.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
              ◆ SYSTEM READY ◆
            </motion.p>
            <p className="font-pixel" style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.16em' }}>
              INSERT COIN TO PLAY
            </p>
          </div>
          {/* Rotating indicator ring */}
          <motion.div className="w-8 h-8 rounded-full border pointer-events-none"
            style={{ borderColor: `${vis.color}30`, borderTopColor: vis.color }}
            animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}

      {/* ── INSERTING ── */}
      {phase === 'inserting' && (
        <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            className="text-4xl"
            initial={{ y: 80, opacity: 1, scale: 1.2 }}
            animate={{ y: -20, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.75, ease: 'easeIn' }}>
            🪙
          </motion.div>
          <motion.p className="font-pixel" style={{ fontSize: 8, color: '#FFC857', letterSpacing: '0.2em' }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
            COIN ACCEPTED
          </motion.p>
        </motion.div>
      )}

      {/* ── CHARGING ── */}
      {phase === 'charging' && (
        <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="text-3xl"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}>⚡</motion.div>
          <div className="w-full">
            <div className="flex justify-between mb-2">
              <span className="font-pixel" style={{ fontSize: 7.5, color: vis.color, letterSpacing: '0.14em' }}>POWER CHARGING</span>
              <motion.span className="font-pixel" style={{ fontSize: 7.5, color: vis.color }}
                animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.4, repeat: Infinity }}>▐▌</motion.span>
            </div>
            <div className="h-4 rounded-full overflow-hidden relative"
              style={{ background: `${vis.color}12`, border: `1px solid ${vis.color}25` }}>
              <motion.div className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: `linear-gradient(90deg, ${vis.color}60, ${vis.color}, #fff)` }}
                initial={{ width: '0%' }} animate={{ width: '100%' }}
                transition={{ duration: 1.4, ease: 'easeInOut' }} />
              <motion.div className="absolute inset-0 rounded-full pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent 40%, rgba(255,255,255,0.2), transparent 60%)' }}
                animate={{ x: ['-100%', '200%'] }} transition={{ duration: 0.8, repeat: Infinity }} />
            </div>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 7 }, (_, i) => (
              <motion.div key={i} className="rounded-sm"
                style={{ width: 8, height: 20 + i * 3, background: vis.color, boxShadow: `0 0 8px ${vis.color}` }}
                animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.06 }} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── DROPPING ── */}
      {phase === 'dropping' && (
        <motion.div className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            style={{
              width: 72, height: 96, borderRadius: 36,
              background: `linear-gradient(180deg, ${vis.color}30, ${vis.color}10)`,
              border: `2px solid ${vis.color}60`,
              boxShadow: `0 0 40px ${vis.color}60, 0 0 80px ${vis.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            initial={{ y: -180, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <span style={{ fontSize: 32 }}>💊</span>
          </motion.div>
          {/* Trail */}
          <motion.div className="absolute rounded-full pointer-events-none"
            style={{ width: 4, height: 120, background: `linear-gradient(180deg, transparent, ${vis.color}80, transparent)`, top: '10%', left: '50%', marginLeft: -2 }}
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.6 }} />
        </motion.div>
      )}

      {/* ── OPENING ── */}
      {phase === 'opening' && (
        <motion.div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            style={{ width: 72, height: 96, borderRadius: 36, background: `${vis.color}20`,
              border: `2px solid ${vis.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            animate={{ scale: [1, 1.3, 0], opacity: [1, 1, 0], rotate: [0, 15, -15] }}
            transition={{ duration: 0.65, ease: 'easeIn' }}>
            <span style={{ fontSize: 32 }}>💊</span>
          </motion.div>
          <motion.div className="absolute rounded-full pointer-events-none"
            style={{ backgroundColor: vis.color }}
            animate={{ width: [0, 300], height: [0, 300], opacity: [0.5, 0] }}
            transition={{ duration: 0.5 }} />
        </motion.div>
      )}

      {/* ── REVEALING ── */}
      {(phase === 'revealing' || phase === 'claimed') && reward && (() => {
        const vfx = DROP_VFX[reward.rarity];
        return (
          <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <motion.div className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
              style={{ backgroundColor: vfx.color, margin: '20%' }}
              animate={{ opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <motion.span style={{ fontSize: 48, filter: `drop-shadow(0 0 24px ${vfx.color})` }}
              animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.8, repeat: Infinity }}>
              {reward.icon}
            </motion.span>
            <motion.p className="font-pixel" style={{ fontSize: 8, color: vfx.color, letterSpacing: '0.22em' }}
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.7, repeat: Infinity }}>
              ◆ {vfx.label} ◆
            </motion.p>
          </motion.div>
        );
      })()}
    </div>
  );
}

// ── Arcade Machine ────────────────────────────────────────────────────────────
function ArcadeMachine({ vis, phase, reward, alarmActive }: {
  vis: typeof MACHINE_VIS[MachineId];
  phase: DropPhase; reward: CaseReward | null; alarmActive: boolean;
}) {
  const active   = phase !== 'idle';
  const charging = phase === 'charging';

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Spotlight from above */}
      <div className="absolute pointer-events-none"
        style={{
          top: -180, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 400,
          background: `conic-gradient(from 270deg at 50% 0%, transparent 20%, ${vis.color}10 35%, ${vis.color}18 50%, ${vis.color}10 65%, transparent 80%)`,
          filter: 'blur(8px)',
        }} />

      {/* Outer ambient glow */}
      <motion.div className="absolute rounded-full blur-[100px] pointer-events-none"
        style={{ width: 560, height: 560, top: '5%', left: '50%', transform: 'translateX(-50%)', backgroundColor: vis.color }}
        animate={{ opacity: active ? [0.07, 0.16, 0.07] : 0.05 }}
        transition={{ duration: 1.8, repeat: Infinity }} />

      {/* Alarm lights */}
      {alarmActive && ['left-8 top-6', 'right-8 top-6'].map((pos, i) => (
        <motion.div key={i} className={`absolute ${pos} w-5 h-5 rounded-full pointer-events-none`}
          style={{ backgroundColor: i === 0 ? '#FFC857' : '#FF00AA' }}
          animate={{ opacity: [1, 0, 1], boxShadow: [
            `0 0 24px ${i === 0 ? '#FFC857' : '#FF00AA'}, 0 0 48px ${i === 0 ? '#FFC857' : '#FF00AA'}`,
            '0 0 0px transparent', `0 0 24px ${i === 0 ? '#FFC857' : '#FF00AA'}, 0 0 48px ${i === 0 ? '#FFC857' : '#FF00AA'}`,
          ]}}
          transition={{ duration: 0.45, repeat: Infinity, delay: i * 0.22 }} />
      ))}

      {/* Cabinet */}
      <motion.div
        style={{ width: 360, position: 'relative' }}
        animate={alarmActive ? { x: [-2, 2, -2, 2, 0] } : {}}
        transition={{ duration: 0.1, repeat: alarmActive ? Infinity : 0 }}
      >
        {/* ── BODY ── */}
        <div style={{
          borderRadius: '28px 28px 14px 14px',
          background: 'linear-gradient(160deg, #161630 0%, #0D0D22 35%, #08081A 70%, #0C0C26 100%)',
          border: `1.5px solid ${vis.color}28`,
          boxShadow: `
            0 0 60px ${vis.glow},
            0 0 120px ${vis.glow}50,
            0 40px 100px rgba(0,0,0,0.95),
            inset 0 1px 0 rgba(255,255,255,0.07),
            inset 0 -2px 0 rgba(0,0,0,0.6),
            inset 1px 0 0 rgba(255,255,255,0.03),
            inset -1px 0 0 rgba(255,255,255,0.03)
          `,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Metal sheen at top */}
          <div className="absolute top-0 inset-x-0 h-20 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.055) 0%, transparent 100%)' }} />

          {/* Subtle grid texture */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: `linear-gradient(${vis.color} 1px, transparent 1px), linear-gradient(90deg, ${vis.color} 1px, transparent 1px)`,
              backgroundSize: '28px 28px', opacity: 0.018 }} />

          {/* Moving energy lines */}
          <motion.div className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(180deg, transparent 0%, ${vis.color}06 50%, transparent 100%)` }}
            animate={{ backgroundPositionY: ['0%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />

          {/* Left neon tube */}
          <motion.div className="absolute pointer-events-none" style={{ left: -3, top: '10%', bottom: '16%', width: 5, borderRadius: 3 }}
            animate={{ boxShadow: active
              ? [`0 0 16px ${vis.color}, 0 0 32px ${vis.color}, 0 0 64px ${vis.color}80`, `0 0 24px ${vis.color}, 0 0 48px ${vis.color}, 0 0 96px ${vis.color}60`, `0 0 16px ${vis.color}, 0 0 32px ${vis.color}, 0 0 64px ${vis.color}80`]
              : `0 0 8px ${vis.color}80, 0 0 16px ${vis.color}40`
            }}
            transition={{ duration: 1.2, repeat: active ? Infinity : 0 }}
          >
            <div style={{ position: 'absolute', inset: 0, borderRadius: 3,
              background: `linear-gradient(180deg, ${vis.color}60 0%, ${vis.color} 40%, ${vis.color} 60%, ${vis.color}60 100%)` }} />
          </motion.div>

          {/* Right neon tube */}
          <motion.div className="absolute pointer-events-none" style={{ right: -3, top: '10%', bottom: '16%', width: 5, borderRadius: 3 }}
            animate={{ boxShadow: active
              ? [`0 0 16px ${vis.color}, 0 0 32px ${vis.color}, 0 0 64px ${vis.color}80`, `0 0 24px ${vis.color}, 0 0 48px ${vis.color}, 0 0 96px ${vis.color}60`, `0 0 16px ${vis.color}, 0 0 32px ${vis.color}, 0 0 64px ${vis.color}80`]
              : `0 0 8px ${vis.color}80, 0 0 16px ${vis.color}40`
            }}
            transition={{ duration: 1.2, repeat: active ? Infinity : 0, delay: 0.6 }}
          >
            <div style={{ position: 'absolute', inset: 0, borderRadius: 3,
              background: `linear-gradient(180deg, ${vis.color}60 0%, ${vis.color} 40%, ${vis.color} 60%, ${vis.color}60 100%)` }} />
          </motion.div>

          <div className="relative z-10 flex flex-col" style={{ padding: '0 16px 16px' }}>
            {/* ── MARQUEE ── */}
            <div className="relative h-10 mt-3 rounded-xl overflow-hidden flex items-center justify-center mb-4"
              style={{ background: `linear-gradient(90deg, transparent, ${vis.color}12 50%, transparent)`,
                border: `1px solid ${vis.color}20` }}>
              <motion.div className="absolute inset-0 pointer-events-none"
                style={{ background: `linear-gradient(90deg, transparent, ${vis.color}18, transparent)` }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }} />
              <div className="flex items-center gap-3 relative z-10">
                <motion.div className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: vis.color }}
                  animate={{ opacity: [1, 0.2, 1], boxShadow: [`0 0 6px ${vis.color}`, `0 0 12px ${vis.color}`, `0 0 6px ${vis.color}`] }}
                  transition={{ duration: 1.1, repeat: Infinity }} />
                <span className="font-pixel" style={{ fontSize: 7.5, letterSpacing: '0.24em', color: `${vis.color}CC` }}>
                  ARCANE DROP ◆ {vis.label}
                </span>
                <motion.div className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: vis.color }}
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: 0.55 }} />
              </div>
            </div>

            {/* ── SCREEN ── */}
            <div className="relative rounded-2xl overflow-hidden"
              style={{
                height: 310,
                background: vis.screenBg,
                border: `1.5px solid ${vis.color}20`,
                boxShadow: `inset 0 4px 24px rgba(0,0,0,0.9), inset 0 0 50px ${vis.color}0C, 0 0 0 1px ${vis.color}10`,
              }}>
              {/* Screen glass reflection */}
              <div className="absolute top-0 left-0 w-1/2 h-1/3 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 70%)', borderRadius: '0 0 60% 0' }} />
              <MachineScreen phase={phase} vis={vis} reward={reward} />
            </div>

            {/* ── COIN SLOT SECTION ── */}
            <div className="flex items-center justify-center gap-4 my-4">
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${vis.color}30)` }} />
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                style={{ background: `${vis.color}0A`, border: `1px solid ${vis.color}22` }}>
                <motion.div className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: vis.color }}
                  animate={{ opacity: [1, 0.2, 1], boxShadow: [`0 0 6px ${vis.color}`, `0 0 14px ${vis.color}`, `0 0 6px ${vis.color}`] }}
                  transition={{ duration: 1.8, repeat: Infinity }} />
                <span className="font-pixel" style={{ fontSize: 7, color: `${vis.color}80`, letterSpacing: '0.16em' }}>COIN SLOT</span>
              </div>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${vis.color}30, transparent)` }} />
            </div>

            {/* ── CONTROL PANEL BUTTONS ── */}
            <div className="flex items-center justify-center gap-3">
              {[vis.color, '#FF00AA', '#FFC857', vis.color].map((c, i) => (
                <motion.div key={i}
                  className="rounded-full"
                  style={{ width: i === 1 ? 20 : 14, height: i === 1 ? 20 : 14, background: c,
                    boxShadow: `0 0 10px ${c}, 0 0 20px ${c}60` }}
                  animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.6 + i*0.2, repeat: Infinity, delay: i * 0.28 }} />
              ))}
            </div>
          </div>
        </div>

        {/* ── FLOOR REFLECTION ── */}
        <div className="relative pointer-events-none" style={{ height: 70, marginTop: -8 }}>
          {/* Glossy surface */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '90%', height: 2,
            background: `linear-gradient(90deg, transparent 5%, ${vis.color}40 30%, ${vis.color}60 50%, ${vis.color}40 70%, transparent 95%)`,
          }} />
          {/* Color spill reflection */}
          <motion.div style={{
            position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
            width: 320, height: 60,
            background: `radial-gradient(ellipse at 50% 0%, ${vis.color}35 0%, ${vis.color}15 30%, transparent 70%)`,
            filter: 'blur(8px)',
          }}
            animate={{ opacity: active ? [0.7, 1, 0.7] : 0.5 }}
            transition={{ duration: 2, repeat: Infinity }} />
          {/* Neon line reflections */}
          <div style={{
            position: 'absolute', top: 2, left: '10%', width: 6, height: 50,
            background: `linear-gradient(180deg, ${vis.color}40, transparent)`,
            filter: 'blur(4px)',
          }} />
          <div style={{
            position: 'absolute', top: 2, right: '10%', width: 6, height: 50,
            background: `linear-gradient(180deg, ${vis.color}40, transparent)`,
            filter: 'blur(4px)',
          }} />
        </div>
      </motion.div>
    </div>
  );
}

// ── Player panel ──────────────────────────────────────────────────────────────
function PlayerPanel({ machineColor, arcBalance }: { machineColor: string; arcBalance: number }) {
  return (
    <motion.aside initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="hidden lg:flex flex-col gap-3">

      {/* Profile */}
      <div className="rounded-2xl p-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, rgba(14,12,32,0.95), rgba(8,8,20,0.98))',
          border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 40px rgba(0,0,0,0.6)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,1) 1px,transparent 1px)',
            backgroundSize: '24px 24px', opacity: 0.02 }} />
        {/* Top accent */}
        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${machineColor}50, transparent)` }} />

        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-heading font-black text-white"
              style={{ background: `linear-gradient(135deg, ${machineColor}30, ${machineColor}10)`,
                border: `1px solid ${machineColor}40`, fontSize: 15 }}>P1</div>
            <motion.div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
              style={{ background: '#22C55E', border: '2px solid #050816' }}
              animate={{ boxShadow: ['0 0 6px #22C55E', '0 0 14px #22C55E', '0 0 6px #22C55E'] }}
              transition={{ duration: 2, repeat: Infinity }} />
          </div>
          <div>
            <p className="font-heading font-black text-white text-sm">PLAYER_ONE</p>
            <p className="font-pixel" style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em' }}>АРКАДНЫЙ ОХОТНИК</p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between mb-1.5">
            <span className="font-pixel" style={{ fontSize: 7.5, color: machineColor, letterSpacing: '0.1em' }}>УРОВЕНЬ 24</span>
            <span className="font-pixel" style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.25)' }}>7,240 / 10K XP</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${machineColor}80, ${machineColor})`, width: '72%' }}
              initial={{ width: 0 }} animate={{ width: '72%' }}
              transition={{ duration: 1.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }} />
          </div>
        </div>

        <motion.div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,200,87,0.07)', border: '1px solid rgba(255,200,87,0.18)' }}
          animate={{ boxShadow: ['0 0 0px transparent', '0 0 16px rgba(255,200,87,0.15)', '0 0 0px transparent'] }}
          transition={{ duration: 3, repeat: Infinity }}>
          <span className="text-sm">🪙</span>
          <motion.span key={arcBalance} className="font-heading font-black text-amber-400 text-sm tabular-nums"
            initial={{ scale: 1.2, color: '#ffffff' }} animate={{ scale: 1, color: '#FFC857' }}
            transition={{ duration: 0.35 }}>
            {arcBalance.toLocaleString()}
          </motion.span>
          <span className="font-pixel ml-auto" style={{ fontSize: 7, color: 'rgba(255,200,87,0.4)', letterSpacing: '0.12em' }}>ARCANE</span>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="rounded-2xl p-4"
        style={{ background: 'linear-gradient(145deg, rgba(14,12,32,0.95), rgba(8,8,20,0.98))',
          border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="font-pixel mb-3" style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.16em' }}>
          ◆ СТАТИСТИКА
        </p>
        {[
          { label: 'Всего дропов', value: '142', icon: Zap, color: machineColor },
          { label: 'Легендарных',  value: '3',   icon: Trophy, color: '#FFC857' },
          { label: 'Серия',        value: '7',   icon: TrendingUp, color: '#22C55E' },
          { label: 'Игр получено', value: '28',  icon: Star, color: '#A78BFA' },
        ].map(s => (
          <div key={s.label} className="flex items-center justify-between py-2.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-2">
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              <span className="font-body text-white/40 text-xs">{s.label}</span>
            </div>
            <span className="font-heading font-bold text-white text-sm">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Streak */}
      <div className="rounded-2xl p-4"
        style={{ background: 'linear-gradient(145deg, rgba(14,12,32,0.95), rgba(8,8,20,0.98))',
          border: '1px solid rgba(255,200,87,0.14)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-pixel" style={{ fontSize: 7.5, color: 'rgba(255,200,87,0.55)', letterSpacing: '0.12em' }}>СЕРИЯ ДРОПОВ</p>
          <motion.span className="font-heading font-black text-amber-400" style={{ fontSize: 13 }}
            animate={{ textShadow: ['0 0 8px rgba(255,200,87,0)', '0 0 16px rgba(255,200,87,0.8)', '0 0 8px rgba(255,200,87,0)'] }}
            transition={{ duration: 1.5, repeat: Infinity }}>🔥 ×7</motion.span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }, (_, i) => (
            <motion.div key={i} className="flex-1 h-2 rounded-full"
              style={{ background: '#FFC857', boxShadow: '0 0 6px rgba(255,200,87,0.5)' }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }} />
          ))}
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
        <p className="font-pixel mt-2" style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>3 ДО БОНУСА</p>
      </div>
    </motion.aside>
  );
}

// ── Right panel ───────────────────────────────────────────────────────────────
function RightPanel({ config, vis }: {
  config: import('@/lib/casesData').CaseConfig;
  vis: typeof MACHINE_VIS[MachineId];
}) {
  const wins = useMemo(() => generateLiveWins(18), []);
  const [liveWin, setLiveWin] = useState(wins[0]);
  const [machineTemp, setMachineTemp] = useState(42);
  const [luckyMeter, setLuckyMeter] = useState(67);

  useEffect(() => {
    let i = 1;
    const t1 = setInterval(() => {
      setLiveWin({ ...wins[i % wins.length], id: Date.now(), time: Date.now() });
      i++;
    }, 3400);
    const t2 = setInterval(() => {
      setMachineTemp(v => Math.min(99, Math.max(30, v + (Math.random() - 0.4) * 8)));
      setLuckyMeter(v => Math.min(99, Math.max(10, v + (Math.random() - 0.5) * 12)));
    }, 1800);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [wins]);

  const RARITY_ORDER: Record<Rarity, number> = { arcane: 0, legendary: 1, epic: 2, rare: 3, common: 4 };
  const sortedRewards = useMemo(() =>
    [...config.rewards].sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]),
    [config.rewards]);

  const tempColor = machineTemp > 75 ? '#FF4444' : machineTemp > 55 ? '#FF8C00' : '#00E5FF';

  return (
    <motion.aside initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="hidden lg:flex flex-col gap-3">

      {/* ── ARCADE MACHINE STATUS ── */}
      <div className="rounded-2xl p-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, rgba(14,12,32,0.95), rgba(8,8,20,0.98))',
          border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${vis.color}50, transparent)` }} />

        <p className="font-pixel mb-3" style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.16em' }}>
          ◆ MACHINE STATUS
        </p>

        {/* Online indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div className="w-2 h-2 rounded-full bg-green-400"
              animate={{ boxShadow: ['0 0 6px #4ade80','0 0 14px #4ade80','0 0 6px #4ade80'] }}
              transition={{ duration: 2, repeat: Infinity }} />
            <span className="font-pixel" style={{ fontSize: 7.5, color: '#4ade80', letterSpacing: '0.1em' }}>ONLINE</span>
          </div>
          <span className="font-pixel" style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.3)' }}>2,847 ИГРОКОВ</span>
        </div>

        {/* Machine temp */}
        <div className="mb-3">
          <div className="flex justify-between mb-1.5">
            <span className="font-pixel" style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
              ТЕМПЕРАТУРА
            </span>
            <motion.span className="font-pixel" style={{ fontSize: 7, color: tempColor, letterSpacing: '0.08em' }}
              animate={{ opacity: machineTemp > 75 ? [1, 0.3, 1] : 1 }}
              transition={{ duration: 0.5, repeat: machineTemp > 75 ? Infinity : 0 }}>
              {Math.round(machineTemp)}°C {machineTemp > 75 ? '⚠' : ''}
            </motion.span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, #00E5FF, ${tempColor})` }}
              animate={{ width: `${machineTemp}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }} />
          </div>
        </div>

        {/* Lucky meter */}
        <div className="mb-3">
          <div className="flex justify-between mb-1.5">
            <span className="font-pixel" style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
              LUCKY METER
            </span>
            <motion.span className="font-pixel" style={{ fontSize: 7, color: vis.color, letterSpacing: '0.08em' }}>
              {Math.round(luckyMeter)}%
            </motion.span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div className="h-full rounded-full relative overflow-hidden"
              style={{ background: `linear-gradient(90deg, ${vis.color}80, ${vis.color})` }}
              animate={{ width: `${luckyMeter}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}>
              <motion.div className="absolute inset-0"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
                animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.5, repeat: Infinity }} />
            </motion.div>
          </div>
        </div>

        {/* Live win ticker */}
        <AnimatePresence mode="wait">
          <motion.div key={liveWin.id}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: DROP_VFX[liveWin.rarity].bg, border: `1px solid ${DROP_VFX[liveWin.rarity].border}` }}>
            <motion.div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: DROP_VFX[liveWin.rarity].color }}
              animate={{ scale: [1, 1.6, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
            <p className="font-body text-white/50 truncate text-xs">
              <span className="text-white/70">{liveWin.user}</span> · {liveWin.reward}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── JACKPOT ── */}
      <div className="rounded-2xl p-4 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(255,200,87,0.08), rgba(255,200,87,0.03))',
          border: '1px solid rgba(255,200,87,0.18)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,200,87,0.12), transparent 60%)' }} />
        <p className="font-pixel mb-1 relative z-10" style={{ fontSize: 7.5, color: 'rgba(255,200,87,0.5)', letterSpacing: '0.16em' }}>
          ◆ ДЖЕКПОТ ◆
        </p>
        <motion.p className="font-heading font-black text-amber-400 relative z-10" style={{ fontSize: 22 }}
          animate={{ textShadow: ['0 0 20px rgba(255,200,87,0.4)', '0 0 40px rgba(255,200,87,0.8)', '0 0 20px rgba(255,200,87,0.4)'] }}
          transition={{ duration: 2, repeat: Infinity }}>
          87,540,000
        </motion.p>
        <p className="font-pixel text-amber-400/30 mt-0.5 relative z-10" style={{ fontSize: 7 }}>СУМ</p>
      </div>

      {/* ── POSSIBLE REWARDS LIST ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(145deg, rgba(14,12,32,0.95), rgba(8,8,20,0.98))',
          border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" style={{ color: vis.color }} />
            <p className="font-pixel" style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.14em' }}>
              POSSIBLE REWARDS
            </p>
          </div>
          <span className="font-pixel" style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)' }}>
            {config.rewards.length}
          </span>
        </div>

        <div className="p-2 space-y-1" style={{ maxHeight: 360, overflowY: 'auto' }}>
          {sortedRewards.map((reward, i) => {
            const vfx = DROP_VFX[reward.rarity as Rarity];
            return (
              <motion.div key={reward.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.025 }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl relative overflow-hidden"
                style={{ background: vfx.bg, border: `1px solid ${vfx.border}` }}
                whileHover={{ scale: 1.015, transition: { duration: 0.15 } }}>
                {/* Left rarity bar */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
                  style={{ background: vfx.color, boxShadow: `0 0 6px ${vfx.color}` }} />
                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0,
                  filter: `drop-shadow(0 0 6px ${vfx.color}70)` }}>
                  {reward.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-white truncate" style={{ fontSize: 12 }}>
                    {reward.name}
                  </p>
                  <span className="font-pixel" style={{ fontSize: 6.5, color: vfx.color, letterSpacing: '0.08em' }}>
                    {vfx.label}
                  </span>
                </div>
                <span className="font-pixel flex-shrink-0"
                  style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
                  {reward.probability}%
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.aside>
  );
}

// ── Reward overlay ────────────────────────────────────────────────────────────
function RewardOverlay({ reward, phase, vfx, arcBalance, onClaim, onSell, onReset }: {
  reward: CaseReward; phase: DropPhase;
  vfx: typeof DROP_VFX[Rarity]; arcBalance: number;
  onClaim: () => void; onSell: () => void; onReset: () => void;
}) {
  const isLegendary = reward.rarity === 'legendary' || reward.rarity === 'arcane';
  const isSelling   = phase === 'selling';
  const isSold      = phase === 'sold';
  const isClaimed   = phase === 'claimed';
  const goldBorder  = isSelling || isSold;

  const dissolveCoins = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    id: i,
    vx: (Math.random() - 0.5) * 200,
    vy: (Math.random() - 0.5) * 200,
    size: 4 + Math.random() * 7,
    delay: Math.random() * 0.28,
  })), []);

  return (
    <motion.div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

      {/* Backdrop */}
      <motion.div className="absolute inset-0"
        style={{ background: goldBorder
          ? 'radial-gradient(ellipse at 50% 40%, rgba(255,200,87,0.14) 0%, rgba(5,8,22,0.6) 70%)'
          : `radial-gradient(ellipse at 50% 40%, ${vfx.color}18 0%, rgba(5,8,22,0.55) 70%)`,
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
        onClick={isClaimed || isSold ? onReset : undefined} />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)', backgroundSize: '100% 3px' }} />

      {/* Legendary strobe */}
      {isLegendary && !goldBorder && (
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${vfx.color}18, transparent 55%)` }}
          animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.45, repeat: Infinity }} />
      )}

      {/* Gold sell strobe */}
      {isSelling && (
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(255,200,87,0.16), transparent 60%)' }}
          animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.3, repeat: Infinity }} />
      )}

      {/* Screen flash */}
      <motion.div className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: goldBorder ? '#FFC857' : vfx.color }}
        initial={{ opacity: goldBorder ? 0 : 0.3 }}
        animate={{ opacity: isSold ? [0.35, 0] : 0 }}
        transition={{ duration: 0.6 }} />

      {/* ARC balance display — top right, above overlay */}
      <motion.div className="fixed top-5 right-5 z-[210] flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{ background: 'rgba(255,200,87,0.1)', border: '1px solid rgba(255,200,87,0.35)' }}
        animate={isSold ? {
          boxShadow: ['0 0 0px transparent', '0 0 50px rgba(255,200,87,0.95)', '0 0 25px rgba(255,200,87,0.5)', '0 0 8px rgba(255,200,87,0.2)'],
          scale: [1, 1.18, 1.05, 1],
        } : { boxShadow: '0 0 12px rgba(255,200,87,0.15)' }}
        transition={{ duration: 0.7 }}>
        <motion.span className="text-sm"
          animate={isSold ? { rotate: [0, 360] } : {}}
          transition={{ duration: 0.55 }}>🪙</motion.span>
        <motion.span key={arcBalance} className="font-heading font-black text-amber-400 tabular-nums"
          style={{ fontSize: 14 }}
          initial={isSold ? { scale: 1.4, color: '#fff' } : false}
          animate={{ scale: 1, color: '#FFC857' }}
          transition={{ duration: 0.4 }}>
          {arcBalance.toLocaleString()}
        </motion.span>
        <span className="font-pixel" style={{ fontSize: 7, color: 'rgba(255,200,87,0.4)', letterSpacing: '0.12em' }}>ARCANE</span>
      </motion.div>

      {/* Card */}
      <motion.div className="relative z-10 w-full max-w-sm"
        initial={{ y: '-110vh', rotate: -4, scale: 0.82 }}
        animate={{ y: 0, rotate: 0, scale: 1 }}
        exit={{ y: '-110vh', scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 85, damping: 15, mass: 1.15 }}>

        <motion.div className="absolute -inset-8 rounded-[40px] blur-3xl pointer-events-none"
          style={{ backgroundColor: goldBorder ? '#FFC857' : vfx.color }}
          animate={{ opacity: isSelling ? [0.35, 0.75, 0.35] : isSold ? [0.4, 0.65, 0.4] : [0.18, 0.38, 0.18] }}
          transition={{ duration: isSelling ? 0.38 : 1.6, repeat: Infinity }} />

        <div className="relative rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(160deg, rgba(12,10,30,0.98) 0%, rgba(5,5,18,0.99) 100%)',
            border: `1.5px solid ${goldBorder ? 'rgba(255,200,87,0.65)' : vfx.border}`,
            boxShadow: goldBorder
              ? '0 0 80px rgba(255,200,87,0.75), 0 40px 80px rgba(0,0,0,0.8)'
              : `0 0 80px ${vfx.glow}, 0 40px 80px rgba(0,0,0,0.8)` }}>

          <motion.div className="h-[4px]"
            style={{ background: goldBorder
              ? 'linear-gradient(90deg, transparent, #FFC857, transparent)'
              : `linear-gradient(90deg, transparent, ${vfx.color}, transparent)` }}
            animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.2, repeat: Infinity }} />

          {/* Corner brackets */}
          {[['top-4 left-4','borderTop borderLeft'],['top-4 right-4','borderTop borderRight'],['bottom-4 left-4','borderBottom borderLeft'],['bottom-4 right-4','borderBottom borderRight']].map(([pos, borders], i) => {
            const bc = goldBorder ? '#FFC857' : vfx.color;
            return (
              <div key={i} className={`absolute ${pos} w-5 h-5 pointer-events-none`}
                style={{
                  borderTop:    borders.includes('borderTop')    ? `2px solid ${bc}${i < 2 ? '70' : '40'}` : 'none',
                  borderBottom: borders.includes('borderBottom') ? `2px solid ${bc}40` : 'none',
                  borderLeft:   borders.includes('borderLeft')   ? `2px solid ${bc}${i % 2 === 0 ? '70' : '40'}` : 'none',
                  borderRight:  borders.includes('borderRight')  ? `2px solid ${bc}${i % 2 === 1 ? '70' : '40'}` : 'none',
                }} />
            );
          })}

          <div className="px-7 py-7 text-center">

            {/* ── Rarity / state badge ── */}
            <AnimatePresence mode="wait">
              {!isSelling && !isSold && (
                <motion.div key="rarity-badge"
                  className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full"
                  style={{ background: vfx.bg, border: `1px solid ${vfx.border}` }}
                  animate={{ boxShadow: [`0 0 14px ${vfx.glow}`, `0 0 28px ${vfx.glow}`, `0 0 14px ${vfx.glow}`] }}
                  transition={{ duration: 1, repeat: Infinity }}>
                  <motion.div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: vfx.color }}
                    animate={{ scale: [1, 1.8, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                  <span className="font-pixel" style={{ fontSize: 9, color: vfx.color, letterSpacing: '0.2em' }}>◆ {vfx.label} DROP ◆</span>
                </motion.div>
              )}
              {isSelling && (
                <motion.div key="selling-badge"
                  initial={{ opacity: 0, scale: 0.6, boxShadow: '0 0 0px transparent' }}
                  animate={{ opacity: 1, scale: 1, boxShadow: ['0 0 20px rgba(255,200,87,0.55)', '0 0 55px rgba(255,200,87,0.95)', '0 0 20px rgba(255,200,87,0.55)'] }}
                  transition={{ duration: 0.38, repeat: Infinity }}
                  className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,200,87,0.12)', border: '1px solid rgba(255,200,87,0.5)' }}>
                  <motion.span className="text-base" animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}>🪙</motion.span>
                  <span className="font-pixel" style={{ fontSize: 9, color: '#FFC857', letterSpacing: '0.2em' }}>◆ CONVERTING ◆</span>
                </motion.div>
              )}
              {isSold && (
                <motion.div key="sold-badge"
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1, boxShadow: ['0 0 30px rgba(255,200,87,0.65)', '0 0 75px rgba(255,200,87,1)', '0 0 30px rgba(255,200,87,0.65)'] }}
                  transition={{ duration: 0.65, repeat: Infinity }}
                  className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,200,87,0.2)', border: '2px solid rgba(255,200,87,0.75)' }}>
                  <span style={{ fontSize: 12 }}>🏆</span>
                  <span className="font-pixel" style={{ fontSize: 9, color: '#FFC857', letterSpacing: '0.2em' }}>◆ ПРОДАНО ◆</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Icon / dissolve / sold coin ── */}
            <AnimatePresence mode="wait">
              {!isSelling && !isSold && (
                <motion.div key="reward-icon" className="relative inline-block mb-5"
                  initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 200, opacity: 0, filter: 'brightness(4)' }}
                  transition={{ type: 'spring', stiffness: 160, damping: 12, delay: isClaimed ? 0 : 0.25 }}>
                  <motion.div className="absolute inset-0 rounded-full blur-2xl pointer-events-none"
                    style={{ backgroundColor: vfx.color, transform: 'scale(1.8)' }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
                  <motion.span className="relative block"
                    style={{ fontSize: 72, lineHeight: 1, filter: `drop-shadow(0 0 24px ${vfx.color})` }}
                    animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    {reward.icon}
                  </motion.span>
                </motion.div>
              )}

              {isSelling && (
                <motion.div key="dissolving-icon" className="relative inline-block mb-5">
                  {/* Dissolve particle burst */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {dissolveCoins.map(p => (
                      <motion.div key={p.id} className="absolute rounded-full"
                        style={{ width: p.size, height: p.size, backgroundColor: '#FFC857',
                          boxShadow: `0 0 ${p.size * 2.5}px #FFC857` }}
                        initial={{ opacity: 1, x: 0, y: 0 }}
                        animate={{ opacity: 0, x: p.vx, y: p.vy }}
                        transition={{ duration: 0.75 + Math.random() * 0.35, delay: p.delay, ease: 'easeOut' }} />
                    ))}
                  </div>
                  <motion.span
                    style={{ fontSize: 72, lineHeight: 1, display: 'block',
                      filter: 'drop-shadow(0 0 40px #FFC857) brightness(2)' }}
                    initial={{ scale: 1, opacity: 1, rotate: 0 }}
                    animate={{ scale: 0, opacity: 0, rotate: 180, filter: ['brightness(2)', 'brightness(5)', 'brightness(0)'] }}
                    transition={{ duration: 0.85, ease: 'easeIn' }}>
                    {reward.icon}
                  </motion.span>
                </motion.div>
              )}

              {isSold && (
                <motion.div key="sold-coin" className="relative inline-block mb-5"
                  initial={{ scale: 0, y: 40 }} animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 13 }}>
                  <motion.div className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
                    style={{ backgroundColor: '#FFC857', transform: 'scale(2.8)' }}
                    animate={{ opacity: [0.45, 0.85, 0.45] }} transition={{ duration: 0.75, repeat: Infinity }} />
                  <motion.span className="relative block"
                    style={{ fontSize: 82, lineHeight: 1,
                      filter: 'drop-shadow(0 0 32px #FFC857) drop-shadow(0 0 64px rgba(255,200,87,0.6))' }}
                    animate={{ rotateY: [0, 360] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}>
                    🪙
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Title / amount ── */}
            <AnimatePresence mode="wait">
              {!isSold && (
                <motion.h2 key="title" className="font-heading font-black text-white mb-2 leading-tight"
                  style={{ fontSize: 'clamp(20px,4vw,28px)' }}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: isSelling ? 0 : 0.35 }}>
                  {isSelling ? 'КОНВЕРТАЦИЯ...' : reward.name}
                </motion.h2>
              )}
              {isSold && (
                <motion.div key="sold-amount"
                  initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 180, delay: 0.1 }}>
                  <motion.h2 className="font-heading font-black leading-none mb-1"
                    style={{ fontSize: 46, color: '#FFC857',
                      textShadow: '0 0 30px rgba(255,200,87,0.95), 0 0 80px rgba(255,200,87,0.55)' }}
                    animate={{ textShadow: ['0 0 30px rgba(255,200,87,0.7)', '0 0 90px rgba(255,200,87,1)', '0 0 30px rgba(255,200,87,0.7)'] }}
                    transition={{ duration: 0.8, repeat: Infinity }}>
                    +{reward.coinValue.toLocaleString()}
                  </motion.h2>
                  <p className="font-pixel mb-3" style={{ fontSize: 14, color: 'rgba(255,200,87,0.7)', letterSpacing: '0.18em' }}>
                    ARCANE COIN
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Description / status ── */}
            <AnimatePresence mode="wait">
              {!isSelling && !isSold && (
                <motion.p key="desc" className="font-body mb-5"
                  style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ delay: 0.45 }}>
                  {reward.description}
                </motion.p>
              )}
              {isSelling && (
                <motion.p key="converting" className="font-pixel mb-5"
                  style={{ fontSize: 9, color: 'rgba(255,200,87,0.5)', letterSpacing: '0.16em' }}
                  animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 0.45, repeat: Infinity }}>
                  ПЕРЕВОДИМ В ARCANE COIN...
                </motion.p>
              )}
              {isSold && (
                <motion.p key="sold-desc" className="font-body mb-5"
                  style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)' }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}>
                  Монеты добавлены на баланс
                </motion.p>
              )}
            </AnimatePresence>

            {/* Value badge */}
            {!isSelling && !isSold && (
              <motion.div className="inline-block mb-6 px-4 py-1.5 rounded-full font-pixel"
                style={{ fontSize: 9, letterSpacing: '0.14em', background: vfx.bg, border: `1px solid ${vfx.border}`, color: vfx.color }}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}>
                {reward.displayValue}
              </motion.div>
            )}

            {/* ── ACTION BUTTONS ── */}
            <AnimatePresence mode="wait">

              {/* Revealing: two premium buttons */}
              {phase === 'revealing' && (
                <motion.div key="reveal-btns" className="space-y-3"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }} transition={{ delay: 0.55 }}>

                  {/* CLAIM GAME — purple glassmorphism */}
                  <motion.button onClick={onClaim}
                    className="w-full h-14 rounded-2xl font-heading font-black text-white overflow-hidden relative flex items-center justify-center gap-3"
                    style={{
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.32) 0%, rgba(109,40,217,0.18) 100%)',
                      border: '1.5px solid rgba(124,58,237,0.72)',
                      boxShadow: '0 0 40px rgba(124,58,237,0.45), 0 0 80px rgba(124,58,237,0.18), inset 0 1px 0 rgba(255,255,255,0.1)',
                      letterSpacing: '0.1em', fontSize: 14,
                    }}
                    whileHover={{ scale: 1.035, y: -2,
                      boxShadow: '0 0 65px rgba(124,58,237,0.85), 0 0 130px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.18)' }}
                    whileTap={{ scale: 0.97 }}>
                    {/* Holographic shimmer */}
                    <motion.div className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 48%, rgba(167,139,250,0.22) 55%, transparent 70%)' }}
                      animate={{ x: ['-110%', '210%'] }}
                      transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.4 }} />
                    {/* Top edge highlight */}
                    <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.9), transparent)' }} />
                    {/* Bottom depth */}
                    <div className="absolute bottom-0 inset-x-0 h-px pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.55), transparent)' }} />
                    <Gamepad2 className="w-5 h-5 relative z-10 flex-shrink-0" style={{ color: '#A78BFA' }} />
                    <span className="relative z-10">CLAIM GAME</span>
                  </motion.button>

                  {/* SELL FOR ARC — gold neon */}
                  <motion.button onClick={onSell}
                    className="w-full h-14 rounded-2xl font-heading font-black overflow-hidden relative flex items-center justify-center gap-3"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,200,87,0.17) 0%, rgba(251,146,60,0.1) 100%)',
                      border: '1.5px solid rgba(255,200,87,0.62)',
                      boxShadow: '0 0 38px rgba(255,200,87,0.42), 0 0 75px rgba(255,200,87,0.16), inset 0 1px 0 rgba(255,255,255,0.08)',
                      color: '#FFC857', letterSpacing: '0.1em', fontSize: 14,
                    }}
                    whileHover={{ scale: 1.035, y: -2,
                      boxShadow: '0 0 65px rgba(255,200,87,0.85), 0 0 130px rgba(255,200,87,0.42), inset 0 1px 0 rgba(255,255,255,0.14)' }}
                    whileTap={{ scale: 0.97 }}>
                    {/* Sweeping coin glow */}
                    <motion.div className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(105deg, transparent 28%, rgba(255,200,87,0.22) 48%, transparent 68%)' }}
                      animate={{ x: ['-110%', '210%'] }}
                      transition={{ duration: 1.9, repeat: Infinity, repeatDelay: 0.55 }} />
                    {/* Border pulse */}
                    <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{ border: '1px solid rgba(255,200,87,0.4)' }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.1, repeat: Infinity }} />
                    {/* Top edge */}
                    <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(255,200,87,0.95), transparent)' }} />
                    <motion.span className="relative z-10 text-xl flex-shrink-0"
                      animate={{ rotate: [0, 18, -18, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>🪙</motion.span>
                    <span className="relative z-10">SELL FOR {reward.coinValue.toLocaleString()} ARCANE</span>
                  </motion.button>

                  {/* Skip — subtle ghost */}
                  <motion.button onClick={onReset}
                    className="w-full h-9 rounded-xl font-heading font-semibold text-xs tracking-wider flex items-center justify-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                      color: 'rgba(255,255,255,0.28)' }}
                    whileHover={{ color: 'rgba(255,255,255,0.65)', backgroundColor: 'rgba(255,255,255,0.07)' }}
                    whileTap={{ scale: 0.97 }}>
                    <RotateCcw className="w-3 h-3" />
                    ЕЩЁ РАЗ
                  </motion.button>
                </motion.div>
              )}

              {/* Selling: arcade processing bars */}
              {isSelling && (
                <motion.div key="selling-state"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3 pt-2">
                  <div className="flex gap-1.5">
                    {Array.from({ length: 7 }, (_, i) => (
                      <motion.div key={i} className="w-2 rounded-sm"
                        style={{ height: 22, background: '#FFC857', boxShadow: '0 0 10px #FFC857' }}
                        animate={{ scaleY: [0.25, 1, 0.25], opacity: [0.35, 1, 0.35] }}
                        transition={{ duration: 0.38, repeat: Infinity, delay: i * 0.06 }} />
                    ))}
                  </div>
                  <motion.p className="font-pixel" style={{ fontSize: 8, color: 'rgba(255,200,87,0.38)', letterSpacing: '0.18em' }}
                    animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.4, repeat: Infinity }}>
                    PROCESSING...
                  </motion.p>
                </motion.div>
              )}

              {/* Sold / Claimed: play again */}
              {(isSold || isClaimed) && (
                <motion.div key="post-action" className="space-y-3"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}>
                  <motion.button onClick={onReset}
                    className="w-full h-14 rounded-2xl font-heading font-black text-white overflow-hidden relative flex items-center justify-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}
                    whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.13)' }}
                    whileTap={{ scale: 0.97 }}>
                    <RotateCcw className="w-4 h-4" />
                    ЕЩЁ РАЗ
                  </motion.button>
                  <motion.p className="font-pixel" style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.14em' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
                    Нажми куда угодно, чтобы продолжить
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-[2px]" style={{ background: goldBorder
            ? 'linear-gradient(90deg, transparent 10%, rgba(255,200,87,0.6) 50%, transparent 90%)'
            : `linear-gradient(90deg, transparent 10%, ${vfx.color}60 50%, transparent 90%)` }} />
        </div>
      </motion.div>

      {/* Legendary banner */}
      {isLegendary && !goldBorder && (
        <motion.div className="relative z-10 mt-4 text-center"
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}>
          <motion.p className="font-pixel"
            style={{ fontSize: 10, letterSpacing: '0.22em', color: vfx.color,
              textShadow: `0 0 20px ${vfx.color}, 0 0 40px ${vfx.color}` }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
            ◆◆◆ РЕДКОЕ ВЫПАДЕНИЕ — ПОЗДРАВЛЯЕМ ◆◆◆
          </motion.p>
        </motion.div>
      )}

      {/* Sold cashout banner */}
      {isSold && (
        <motion.div className="relative z-10 mt-4 text-center"
          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, type: 'spring' }}>
          <motion.p className="font-pixel"
            style={{ fontSize: 10, letterSpacing: '0.22em', color: '#FFC857',
              textShadow: '0 0 20px rgba(255,200,87,0.9), 0 0 45px rgba(255,200,87,0.5)' }}
            animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 0.75, repeat: Infinity }}>
            ◆◆◆ ARCANE CASHOUT — МОНЕТЫ ЗАЧИСЛЕНЫ ◆◆◆
          </motion.p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Rewards pool ─────────────────────────────────────────────────────────────
function RewardsPool({ config, vis }: {
  config: import('@/lib/casesData').CaseConfig;
  vis: typeof MACHINE_VIS[MachineId];
}) {
  const RARITY_ORDER: Record<Rarity, number> = { arcane: 0, legendary: 1, epic: 2, rare: 3, common: 4 };
  const sorted = useMemo(() =>
    [...config.rewards].sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]),
    [config.rewards]);

  return (
    <motion.div className="w-full"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-px w-6" style={{ background: `linear-gradient(90deg, transparent, ${vis.color})` }} />
          <span className="font-pixel" style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.18em' }}>
            POSSIBLE REWARDS
          </span>
          <div className="h-px w-6" style={{ background: `linear-gradient(90deg, ${vis.color}, transparent)` }} />
        </div>
        <span className="font-pixel" style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.1em' }}>
          {config.rewards.length} ДРОПОВ
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {sorted.map((reward, i) => {
          const vfx = DROP_VFX[reward.rarity];
          return (
            <motion.div key={reward.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.45 + i * 0.03 }}
              whileHover={{ scale: 1.06, y: -2 }}
              className="relative flex flex-col items-center p-2.5 rounded-xl text-center overflow-hidden cursor-default"
              style={{
                background: vfx.bg,
                border: `1px solid ${vfx.border}`,
                boxShadow: `0 0 12px ${vfx.color}12`,
              }}>
              {/* Top rarity line */}
              <div className="absolute top-0 inset-x-0 h-[2px]"
                style={{ background: vfx.color }} />

              {/* Rarity glow */}
              <motion.div className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 50% 0%, ${vfx.color}18, transparent 70%)` }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.5 + i * 0.1, repeat: Infinity, ease: 'easeInOut' }} />

              <span className="relative z-10 mb-1.5" style={{ fontSize: 22, lineHeight: 1,
                filter: `drop-shadow(0 0 8px ${vfx.color}80)` }}>
                {reward.icon}
              </span>

              <p className="font-heading font-bold text-white leading-tight relative z-10 mb-1"
                style={{ fontSize: 10, lineHeight: 1.3 }}>
                {reward.name}
              </p>

              <span className="font-pixel relative z-10"
                style={{ fontSize: 6.5, color: vfx.color, letterSpacing: '0.08em' }}>
                {reward.probability}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ArcaneDropPage() {
  const params = useParams();
  const tier   = params.id as CaseTier;
  const config = CASES[tier];

  const [phase,        setPhase]        = useState<DropPhase>('idle');
  const [reward,       setReward]       = useState<CaseReward | null>(null);
  const [particles,    setParticles]    = useState(false);
  const [earnedArc,    setEarnedArc]    = useState(0);
  const [showCoinBurst, setShowCoinBurst] = useState(false);
  const [dropError,    setDropError]    = useState<string | null>(null);
  const { setFullscreenOverlay }        = useOverlay();
  const { balance: arcBalance, addCoins, spendCoins } = useCoin();

  useEffect(() => { if (!config) notFound(); }, [config]);
  if (!config) return null;

  const vis     = MACHINE_VIS[tier as MachineId];
  const vfx     = reward ? DROP_VFX[reward.rarity] : null;
  const alarmOn = !!(reward && vfx?.alarm && phase === 'revealing');

  const handleDrop = useCallback(async () => {
    if (phase !== 'idle') return;
    setDropError(null);
    setPhase('inserting');
    await new Promise(r => setTimeout(r, 800));
    setPhase('charging');
    await new Promise(r => setTimeout(r, 1600));
    setPhase('dropping');
    const [, data] = await Promise.all([
      new Promise(r => setTimeout(r, 1000)),
      fetch(`/api/cases/${tier}/open`, { method: 'POST' }).then(r => r.json()).catch(() => ({ ok: false })),
    ]);
    if (!data.ok || !data.reward) {
      setPhase('idle');
      if (data.code === 'INSUFFICIENT_COINS') {
        setDropError(`Недостаточно монет. Нужно ${formatPrice(config.price)}, а у вас ${arcBalance.toLocaleString()} ARCANE.`);
      } else if (data.error === 'Unauthorized' || data.status === 401) {
        setDropError('Войдите в аккаунт, чтобы открыть кейс.');
      } else {
        setDropError('Ошибка при открытии кейса. Попробуйте ещё раз.');
      }
      return;
    }
    spendCoins(config.price, `Открытие: ${config.title}`);
    setPhase('opening');
    await new Promise(r => setTimeout(r, 700));
    setReward(data.reward);
    setPhase('revealing');
    setFullscreenOverlay(true);
    setParticles(true);
    setTimeout(() => setParticles(false), 1800);
  }, [phase, tier, setFullscreenOverlay, spendCoins, config, arcBalance]);

  const handleClaim = useCallback(() => setPhase('claimed'), []);

  const handleSell = useCallback(() => {
    if (!reward) return;
    const earned = reward.coinValue;
    setEarnedArc(earned);
    setPhase('selling');
    setTimeout(() => {
      setPhase('sold');
      addCoins(earned, `Продано: ${reward.name}`);
      setShowCoinBurst(true);
      setTimeout(() => setShowCoinBurst(false), 2600);
      setTimeout(() => {
        setPhase('idle');
        setReward(null);
        setParticles(false);
        setFullscreenOverlay(false);
      }, 3000);
    }, 1450);
  }, [reward, addCoins, setFullscreenOverlay]);

  const handleReset = useCallback(() => {
    setPhase('idle'); setReward(null); setParticles(false);
    setShowCoinBurst(false); setEarnedArc(0);
    setFullscreenOverlay(false);
  }, [setFullscreenOverlay]);  // arcBalance теперь из useCoin() — глобальный контекст

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#050816' }}>

      {/* ── Atmosphere ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(11,16,32,1) 0%, #050816 70%)' }} />

        {/* Spotlight cone on machine */}
        <div className="absolute pointer-events-none"
          style={{
            top: 60, left: '50%', transform: 'translateX(-50%)',
            width: 500, height: 600,
            background: `conic-gradient(from 270deg at 50% 0%, transparent 22%, ${vis.color}0C 38%, ${vis.color}14 50%, ${vis.color}0C 62%, transparent 78%)`,
            filter: 'blur(12px)',
          }} />

        {/* Animated cyber grid */}
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(${vis.color} 1px, transparent 1px), linear-gradient(90deg, ${vis.color} 1px, transparent 1px)`,
            backgroundSize: '72px 72px', opacity: 0.022,
          }}
          animate={{ backgroundPositionY: ['0px', '72px'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} />

        {/* Ambient fog blobs */}
        {[
          { x: '15%', y: '25%', w: 400, h: 300, color: vis.color, opacity: 0.055 },
          { x: '70%', y: '60%', w: 350, h: 280, color: '#FF00AA', opacity: 0.04 },
          { x: '80%', y: '15%', w: 300, h: 250, color: '#00E5FF', opacity: 0.035 },
          { x: '20%', y: '70%', w: 380, h: 300, color: vis.color, opacity: 0.04 },
        ].map((b, i) => (
          <motion.div key={i} className="absolute rounded-full pointer-events-none"
            style={{ left: b.x, top: b.y, width: b.w, height: b.h, backgroundColor: b.color,
              filter: 'blur(80px)', opacity: b.opacity }}
            animate={{ x: [0, 20, 0], y: [0, -15, 0], opacity: [b.opacity, b.opacity * 1.5, b.opacity] }}
            transition={{ duration: 10 + i * 3, repeat: Infinity, ease: 'easeInOut', delay: i * 2 }} />
        ))}

        {/* Scanlines */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)', backgroundSize: '100% 3px' }} />

        {/* Vignette */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, rgba(5,8,22,0.7) 100%)' }} />

        {/* Alarm */}
        {alarmOn && (
          <motion.div className="absolute inset-0"
            style={{ background: `radial-gradient(ellipse at 50% 0%, ${vfx!.color}14, transparent 55%)` }}
            animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.45, repeat: Infinity }} />
        )}
      </div>

      {/* Ambient particles */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        <AmbientParticles color={vis.color} />
      </div>

      {/* Burst particles */}
      {vfx && <BurstParticles color={vfx.color} count={vfx.particles} active={particles} />}

      {/* Coin cashout fly effect */}
      <CoinFlyEffect active={showCoinBurst} coinValue={earnedArc} />

      {/* Reward overlay */}
      <AnimatePresence>
        {(phase === 'revealing' || phase === 'selling' || phase === 'sold' || phase === 'claimed') && reward && vfx && (
          <RewardOverlay
            reward={reward} phase={phase} vfx={vfx} arcBalance={arcBalance}
            onClaim={handleClaim} onSell={handleSell} onReset={handleReset}
          />
        )}
      </AnimatePresence>

      {/* ── Nav ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between">
        <Link href="/cases"
          className="inline-flex items-center gap-1.5 font-body text-sm text-white/35 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Все машины
        </Link>
        <div className="flex items-center gap-3">
          <ArcBalanceCounter balance={arcBalance} showBurst={showCoinBurst} earned={earnedArc} />
          <motion.div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: `${vis.color}10`, border: `1px solid ${vis.color}28` }}
            animate={{ boxShadow: [`0 0 10px ${vis.glow}`, `0 0 22px ${vis.glow}`, `0 0 10px ${vis.glow}`] }}
            transition={{ duration: 2.5, repeat: Infinity }}>
            <Shield className="w-3.5 h-3.5" style={{ color: vis.color }} />
            <span className="font-pixel" style={{ fontSize: 8, color: vis.color, letterSpacing: '0.12em' }}>
              {vis.label} ◆ UNIT {vis.tier}
            </span>
          </motion.div>
        </div>
      </div>

      {/* ── 3-col layout ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-6 items-start">

          <PlayerPanel machineColor={vis.color} arcBalance={arcBalance} />

          {/* Center */}
          <div className="flex flex-col items-center gap-5">
            {/* Title */}
            <motion.div className="text-center"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <motion.p className="font-pixel mb-1"
                style={{ fontSize: 8.5, color: `${vis.color}70`, letterSpacing: '0.24em' }}
                animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }}>
                ◆ ARCANE DROP SYSTEM ◆
              </motion.p>
              <h1 className="font-heading font-black text-white leading-none"
                style={{ fontSize: 'clamp(22px,3.5vw,38px)', textShadow: `0 0 40px ${vis.color}40` }}>
                {config.title.toUpperCase()}
              </h1>
            </motion.div>

            {/* Machine */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
              <ArcadeMachine vis={vis} phase={phase} reward={reward} alarmActive={alarmOn} />
            </motion.div>

            {/* CTA / Status */}
            <motion.div className="w-full max-w-[360px]"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>

              {phase === 'idle' && (
                <>
                  <motion.button onClick={handleDrop}
                    className="relative w-full rounded-2xl font-heading font-black text-white overflow-hidden"
                    style={{
                      height: 64, fontSize: 15, letterSpacing: '0.12em',
                      background: `linear-gradient(135deg, ${vis.color}35 0%, ${vis.color}18 100%)`,
                      border: `1.5px solid ${vis.color}55`,
                    }}
                    animate={{ boxShadow: [
                      `0 0 30px ${vis.glow}, 0 0 60px ${vis.glow}40, 0 8px 32px rgba(0,0,0,0.6)`,
                      `0 0 55px ${vis.glow}, 0 0 100px ${vis.glow}50, 0 8px 32px rgba(0,0,0,0.6)`,
                      `0 0 30px ${vis.glow}, 0 0 60px ${vis.glow}40, 0 8px 32px rgba(0,0,0,0.6)`,
                    ]}}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    whileHover={{ scale: 1.025, y: -3 }}
                    whileTap={{ scale: 0.97, y: 0 }}>
                    {/* Animated border energy */}
                    <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{ border: `1px solid ${vis.color}` }}
                      animate={{ opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    {/* Shine sweep */}
                    <motion.div className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%)' }}
                      animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.8 }} />
                    {/* Top glow line */}
                    <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
                      style={{ background: `linear-gradient(90deg, transparent, ${vis.color}, transparent)` }} />
                    <div className="relative z-10 flex items-center justify-center gap-3">
                      <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
                        <Zap className="w-5 h-5" style={{ color: vis.color }} />
                      </motion.div>
                      <span>ВСТАВИТЬ МОНЕТУ</span>
                      <span className="font-normal text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {formatPrice(config.price)}
                      </span>
                    </div>
                  </motion.button>

                  {/* Rarity odds */}
                  <div className="flex items-center justify-center gap-4 mt-3">
                    {(['common','rare','epic','legendary','arcane'] as Rarity[]).map(r => {
                      const v = DROP_VFX[r];
                      const prob = config.rewards.filter(rw => rw.rarity === r).reduce((s, rw) => s + rw.probability, 0);
                      return prob > 0 ? (
                        <div key={r} className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: v.color, boxShadow: `0 0 5px ${v.color}` }} />
                          <span className="font-pixel" style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em' }}>{prob}%</span>
                        </div>
                      ) : null;
                    })}
                  </div>

                  {/* Error message */}
                  <AnimatePresence>
                    {dropError && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="mt-3 px-4 py-3 rounded-xl text-center"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <p className="font-body" style={{ fontSize: 13, color: '#F87171' }}>{dropError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {(phase === 'inserting' || phase === 'charging' || phase === 'dropping' || phase === 'opening') && (
                <motion.div className="flex items-center justify-center gap-3 h-16"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <motion.div className="w-5 h-5 border-2 rounded-full"
                    style={{ borderColor: vis.color, borderTopColor: 'transparent' }}
                    animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />
                  <span className="font-pixel" style={{ fontSize: 9.5, color: vis.color, letterSpacing: '0.18em' }}>
                    {phase === 'inserting' ? 'АКТИВАЦИЯ...' : phase === 'charging' ? 'ЗАРЯДКА...' : phase === 'dropping' ? 'КАПСУЛА ПАДАЕТ...' : 'ОТКРЫТИЕ...'}
                  </span>
                </motion.div>
              )}
            </motion.div>

          </div>

          <RightPanel config={config} vis={vis} />
        </div>
      </div>
    </div>
  );
}
