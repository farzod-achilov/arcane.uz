'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  { at: 0,  text: 'CONNECTING TO ARCADE SYSTEM...' },
  { at: 20, text: 'VERIFYING PAYMENT...' },
  { at: 45, text: 'PROCESSING ORDER...' },
  { at: 70, text: 'RESERVING INVENTORY...' },
  { at: 88, text: 'GENERATING KEYS...' },
  { at: 98, text: 'ORDER CONFIRMED.' },
];

const PARTICLES = [
  { x: 15, y: 20, size: 2,   color: '#7C3AED', dur: 4.5, delay: 0.2, opacity: 0.5 },
  { x: 88, y: 15, size: 1.5, color: '#06B6D4', dur: 5.2, delay: 0.9, opacity: 0.4 },
  { x: 50, y:  8, size: 2.5, color: '#F59E0B', dur: 3.8, delay: 1.4, opacity: 0.45 },
  { x: 78, y: 75, size: 2,   color: '#9D60FA', dur: 4.8, delay: 0.1, opacity: 0.35 },
  { x: 22, y: 68, size: 1.5, color: '#06B6D4', dur: 5.5, delay: 2.1, opacity: 0.5 },
  { x: 60, y: 88, size: 2,   color: '#7C3AED', dur: 4.2, delay: 0.7, opacity: 0.4 },
  { x:  5, y: 45, size: 2.5, color: '#FCD34D', dur: 6.0, delay: 1.8, opacity: 0.3 },
  { x: 92, y: 52, size: 1.5, color: '#7C3AED', dur: 4.7, delay: 0.5, opacity: 0.4 },
];

interface ProcessingOverlayProps {
  onComplete: () => void;
  duration?: number;
}

export default function ProcessingOverlay({ onComplete, duration = 2800 }: ProcessingOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    let current = 0;
    const tickMs = 30;
    const totalTicks = Math.floor(duration / tickMs);
    let tick = 0;

    const id = setInterval(() => {
      tick++;
      const t = tick / totalTicks;
      const next = Math.min(100, Math.round((t < 0.6 ? t * 1.5 : 0.9 + (t - 0.6) * 0.25) * 100));
      current = next;
      setProgress(next);

      const idx = STEPS.reduce((best, s, i) => (s.at <= next ? i : best), 0);
      setMsgIdx(idx);

      if (next >= 100) {
        clearInterval(id);
        setTimeout(() => onComplete(), 500);
      }
    }, tickMs);

    return () => clearInterval(id);
  }, [duration, onComplete]);

  const msg = STEPS[msgIdx].text;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      style={{ background: 'rgba(4,3,10,0.97)', backdropFilter: 'blur(12px)' }}
    >
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.022,
        }}
      />
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)',
        }}
      />

      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -10, 0], opacity: [p.opacity, p.opacity * 0.3, p.opacity] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
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

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8 w-full max-w-sm">

        {/* Animated ring */}
        <div className="relative w-20 h-20 mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full"
            style={{
              border: '2px solid transparent',
              borderTopColor: '#7C3AED',
              borderRightColor: 'rgba(124,58,237,0.3)',
            }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2 rounded-full"
            style={{
              border: '1.5px solid transparent',
              borderBottomColor: '#06B6D4',
              borderLeftColor: 'rgba(6,182,212,0.3)',
            }}
          />
          {/* Center glow */}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className="w-6 h-6 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(124,58,237,0.8), rgba(124,58,237,0.2))',
                boxShadow: '0 0 16px rgba(124,58,237,0.6)',
              }}
            />
          </motion.div>
        </div>

        {/* Status message */}
        <motion.p
          key={msg}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="font-pixel text-[#9D60FA] mb-6"
          style={{
            fontSize: '8px',
            letterSpacing: '0.1em',
            textShadow: '0 0 10px rgba(157,96,250,0.6)',
          }}
        >
          {msg}
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.2 }}
          >
            _
          </motion.span>
        </motion.p>

        {/* Progress bar */}
        <div className="w-full">
          <div
            className="relative h-1 rounded-full overflow-hidden mb-2"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            <motion.div
              className="absolute left-0 top-0 bottom-0 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'linear', duration: 0.03 }}
              style={{
                background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
                boxShadow: '0 0 10px rgba(124,58,237,0.5)',
              }}
            />
          </div>
          <div className="flex justify-between">
            <span className="font-pixel text-[#374151]" style={{ fontSize: '7px' }}>ARCANE.UZ</span>
            <span className="font-pixel text-[#6B7280]" style={{ fontSize: '7px' }}>{progress}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
