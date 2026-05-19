'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoFull from '@/components/ui/LogoFull';

/* ── Boot messages ────────────────────────────────────── */
const MESSAGES = [
  { at: 0,   text: 'INITIALIZING ARCANE SYSTEM...' },
  { at: 14,  text: 'CONNECTING TO SERVER...' },
  { at: 30,  text: 'LOADING GAME DATABASE...' },
  { at: 52,  text: 'SYNCING ARCANE COINS...' },
  { at: 70,  text: 'CALIBRATING DISPLAY...' },
  { at: 85,  text: 'INSERTING COIN...' },
  { at: 96,  text: 'PREPARE TO PLAY...' },
  { at: 100, text: 'SYSTEM READY.' },
];

/* ── Deterministic floating particles ─────────────────── */
const PARTICLES = [
  { id: 0,  x:  7, y: 18, size: 2.5, color: '#7C3AED', dur: 5.0, delay: 0.0, opacity: 0.55 },
  { id: 1,  x: 92, y: 12, size: 1.5, color: '#06B6D4', dur: 4.5, delay: 0.8, opacity: 0.40 },
  { id: 2,  x: 55, y:  5, size: 2.0, color: '#F59E0B', dur: 6.0, delay: 1.5, opacity: 0.45 },
  { id: 3,  x: 80, y: 78, size: 3.0, color: '#7C3AED', dur: 4.2, delay: 0.3, opacity: 0.35 },
  { id: 4,  x: 18, y: 72, size: 1.5, color: '#06B6D4', dur: 5.5, delay: 1.2, opacity: 0.50 },
  { id: 5,  x: 44, y: 92, size: 2.0, color: '#9D60FA', dur: 3.8, delay: 2.0, opacity: 0.45 },
  { id: 6,  x:  3, y: 48, size: 2.5, color: '#F59E0B', dur: 6.2, delay: 0.6, opacity: 0.30 },
  { id: 7,  x: 96, y: 55, size: 1.5, color: '#7C3AED', dur: 4.8, delay: 1.8, opacity: 0.40 },
  { id: 8,  x: 66, y: 32, size: 2.0, color: '#06B6D4', dur: 5.3, delay: 0.4, opacity: 0.35 },
  { id: 9,  x: 28, y: 42, size: 1.5, color: '#9D60FA', dur: 4.1, delay: 2.5, opacity: 0.50 },
  { id: 10, x: 84, y: 64, size: 2.5, color: '#F59E0B', dur: 5.8, delay: 1.1, opacity: 0.30 },
  { id: 11, x: 14, y: 88, size: 2.0, color: '#7C3AED', dur: 4.4, delay: 0.9, opacity: 0.45 },
  { id: 12, x: 50, y: 58, size: 1.5, color: '#06B6D4', dur: 6.5, delay: 3.0, opacity: 0.25 },
  { id: 13, x: 74, y: 24, size: 2.0, color: '#9D60FA', dur: 4.7, delay: 1.4, opacity: 0.40 },
  { id: 14, x: 36, y: 76, size: 3.0, color: '#7C3AED', dur: 5.2, delay: 0.2, opacity: 0.30 },
  { id: 15, x: 62, y: 16, size: 1.5, color: '#FCD34D', dur: 4.0, delay: 2.2, opacity: 0.35 },
];

interface ArcadeLoaderProps {
  onComplete?: () => void;
  /** Duration in ms. Default 3200 */
  duration?: number;
}

export default function ArcadeLoader({ onComplete, duration = 3200 }: ArcadeLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([MESSAGES[0].text]);
  const [curMsgIdx, setCurMsgIdx] = useState(0);
  const [exiting, setExiting] = useState(false);
  const doneRef = useRef(false);

  /* ── Progress tick ── */
  useEffect(() => {
    const totalTicks = Math.floor(duration / 30);
    let tick = 0;

    const id = setInterval(() => {
      tick++;
      // Ease curve: fast start, slow middle, quick end
      const t = tick / totalTicks;
      const eased =
        t < 0.35 ? t * 2.2 :       // fast start  (0→77%)
        t < 0.85 ? 0.77 + (t - 0.35) * 0.42 : // slow middle
                   0.98 + (t - 0.85) * 0.13;   // quick finish
      const next = Math.min(100, Math.round(eased * 100));
      setProgress(next);

      if (next >= 100 && !doneRef.current) {
        doneRef.current = true;
        clearInterval(id);
        setTimeout(() => {
          setExiting(true);
          setTimeout(() => onComplete?.(), 550);
        }, 600);
      }
    }, 30);

    return () => clearInterval(id);
  }, [duration, onComplete]);

  /* ── Message tracking ── */
  useEffect(() => {
    const idx = MESSAGES.reduce(
      (best, m, i) => (m.at <= progress ? i : best),
      0,
    );
    if (idx !== curMsgIdx) {
      setCurMsgIdx(idx);
      setLog((prev) => {
        const next = [...prev, MESSAGES[idx].text];
        return next.slice(-5);
      });
    }
  }, [progress, curMsgIdx]);

  const currentMsg = MESSAGES[curMsgIdx].text;
  const isReady = progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: exiting ? 0.5 : 0.18, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#05040B' }}
    >
      {/* ── Scanlines overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)',
        }}
      />

      {/* ── Grid texture ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          opacity: 0.025,
        }}
      />

      {/* ── Vignette ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* ── Ambient center glow ── */}
      <motion.div
        animate={{ opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-[600px] h-[400px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(124,58,237,0.18) 0%, rgba(6,182,212,0.06) 50%, transparent 75%)',
          filter: 'blur(40px)',
        }}
      />

      {/* ── Floating particles ── */}
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          animate={{ y: [0, -12, 0], opacity: [p.opacity, p.opacity * 0.3, p.opacity] }}
          transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
        />
      ))}

      {/* ── Corner brackets ── */}
      {[
        'top-6 left-6 border-t-2 border-l-2 border-[#7C3AED]/40',
        'top-6 right-6 border-t-2 border-r-2 border-[#7C3AED]/40',
        'bottom-6 left-6 border-b-2 border-l-2 border-[#06B6D4]/35',
        'bottom-6 right-6 border-b-2 border-r-2 border-[#06B6D4]/35',
      ].map((cls, i) => (
        <div key={i} className={`absolute w-10 h-10 pointer-events-none ${cls}`} />
      ))}

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-8">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <motion.div
            animate={{ filter: ['drop-shadow(0 0 16px rgba(124,58,237,0.5)) drop-shadow(0 0 40px rgba(124,58,237,0.2))',
                                 'drop-shadow(0 0 24px rgba(124,58,237,0.75)) drop-shadow(0 0 60px rgba(124,58,237,0.35))',
                                 'drop-shadow(0 0 16px rgba(124,58,237,0.5)) drop-shadow(0 0 40px rgba(124,58,237,0.2))'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <LogoFull width={160} height={192} />
          </motion.div>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full mb-4"
        >
          {/* Track */}
          <div
            className="relative w-full h-1.5 rounded-full overflow-hidden mb-2"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            {/* Fill */}
            <motion.div
              className="absolute left-0 top-0 bottom-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
                boxShadow: '0 0 12px rgba(124,58,237,0.6), 0 0 24px rgba(6,182,212,0.3)',
              }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'linear', duration: 0.03 }}
            />
            {/* Shimmer on fill */}
            <motion.div
              className="absolute top-0 bottom-0 w-16 pointer-events-none"
              animate={{ left: [`${Math.max(0, progress - 15)}%`, `${progress}%`] }}
              transition={{ ease: 'linear', duration: 0.03 }}
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
              }}
            />
          </div>

          {/* Percentage */}
          <div className="flex items-center justify-between">
            <span
              className="font-pixel text-[#7C3AED]/60"
              style={{ fontSize: '7px', letterSpacing: '0.08em' }}
            >
              ARCANE.UZ
            </span>
            <motion.span
              key={progress}
              className="font-pixel text-[#9D60FA]"
              style={{
                fontSize: '8px',
                textShadow: '0 0 8px rgba(124,58,237,0.7)',
              }}
            >
              {progress}%
            </motion.span>
          </div>
        </motion.div>

        {/* Console log */}
        <div className="w-full mb-5 space-y-1">
          {log.map((msg, i) => {
            const isCurrent = i === log.length - 1;
            const age = log.length - 1 - i;
            const opacity = isCurrent ? 1 : Math.max(0.12, 0.4 - age * 0.12);
            return (
              <div key={`${msg}-${i}`} className="flex items-center gap-2">
                <span
                  className="font-pixel flex-shrink-0"
                  style={{
                    fontSize: '7px',
                    color: isCurrent ? '#06B6D4' : `rgba(6,182,212,${opacity})`,
                  }}
                >
                  {isCurrent ? '▶' : '·'}
                </span>
                <AnimatePresence mode="wait">
                  {isCurrent ? (
                    <motion.span
                      key={msg}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="font-pixel"
                      style={{
                        fontSize: '7px',
                        letterSpacing: '0.08em',
                        color: isReady && isCurrent ? '#22C55E' : '#9D60FA',
                        textShadow: isReady && isCurrent
                          ? '0 0 10px rgba(34,197,94,0.6)'
                          : '0 0 8px rgba(157,96,250,0.5)',
                      }}
                    >
                      {msg}
                      {isCurrent && !isReady && (
                        <span className="animate-blink ml-0.5">_</span>
                      )}
                    </motion.span>
                  ) : (
                    <span
                      className="font-pixel"
                      style={{
                        fontSize: '7px',
                        color: `rgba(75,85,99,${opacity})`,
                        letterSpacing: '0.06em',
                      }}
                    >
                      {msg}
                    </span>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Bottom ticker */}
        <div
          className="w-full overflow-hidden"
          style={{ borderTop: '1px solid rgba(124,58,237,0.12)', paddingTop: '12px' }}
        >
          <div
            className="flex items-center gap-0 whitespace-nowrap"
            style={{ animation: 'marqueeScroll 20s linear infinite' }}
          >
            {['ARCANE.UZ', 'PREMIUM GAMING', 'INSERT COIN', 'PLAYER 1 UP', 'HIGH SCORE: 9999999', 'ARCANE.UZ', 'PREMIUM GAMING', 'INSERT COIN', 'PLAYER 1 UP', 'HIGH SCORE: 9999999'].map((t, i) => (
              <span key={i} className="inline-flex items-center">
                <span
                  className="font-pixel"
                  style={{ fontSize: '7px', color: 'rgba(124,58,237,0.35)', letterSpacing: '0.1em' }}
                >
                  {t}
                </span>
                <span
                  className="font-pixel mx-4"
                  style={{ fontSize: '7px', color: 'rgba(6,182,212,0.25)' }}
                >
                  ◈
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
