'use client';

import { motion } from 'framer-motion';

interface Props {
  enabled:  boolean;
  onChange: (v: boolean) => void;
  color?:   string;
  size?:    'sm' | 'md';
}

export default function ToggleSwitch({ enabled, onChange, color = '#7C3AED', size = 'md' }: Props) {
  const w = size === 'sm' ? 36 : 44;
  const h = size === 'sm' ? 20 : 24;
  const d = size === 'sm' ? 14 : 18;
  const pad = 3;

  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="relative flex-shrink-0 rounded-full transition-all duration-300 focus:outline-none"
      style={{
        width:      `${w}px`,
        height:     `${h}px`,
        background: enabled
          ? `linear-gradient(135deg, ${color}, ${color}CC)`
          : 'rgba(255,255,255,0.06)',
        border:     `1px solid ${enabled ? color + '60' : 'rgba(255,255,255,0.1)'}`,
        boxShadow:  enabled ? `0 0 12px ${color}40` : 'none',
      }}
    >
      <motion.div
        animate={{ x: enabled ? w - d - pad * 2 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute rounded-full"
        style={{
          width:      `${d}px`,
          height:     `${d}px`,
          top:        `${pad - 1}px`,
          left:       `${pad}px`,
          background: enabled ? '#fff' : 'rgba(255,255,255,0.3)',
          boxShadow:  enabled ? `0 2px 6px rgba(0,0,0,0.3)` : 'none',
        }}
      />
    </button>
  );
}
