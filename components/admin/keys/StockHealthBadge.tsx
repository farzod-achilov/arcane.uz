'use client';

import { motion } from 'framer-motion';
import type { StockHealth } from '@/lib/admin/adminKeysTypes';

const CFG: Record<StockHealth, {
  label: string; color: string; bg: string; border: string; pulse: boolean;
}> = {
  OK:       { label: 'В наличии',  color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',  pulse: false },
  LOW:      { label: 'Мало',       color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', pulse: true  },
  CRITICAL: { label: 'Критично',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',   pulse: true  },
  EMPTY:    { label: 'Нет ключей', color: '#6B7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)', pulse: false },
};

interface Props {
  health: StockHealth;
  size?: 'sm' | 'md';
}

export default function StockHealthBadge({ health, size = 'md' }: Props) {
  const c = CFG[health];
  const fs = size === 'sm' ? '9px' : '10px';
  const px = size === 'sm' ? '6px' : '8px';
  const py = size === 'sm' ? '2px' : '3px';

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-lg font-pixel"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        padding: `${py} ${px}`,
        fontSize: fs,
        color: c.color,
        letterSpacing: '0.04em',
      }}
    >
      <span className="relative flex-shrink-0" style={{ width: '6px', height: '6px' }}>
        <span
          className="absolute inset-0 rounded-full"
          style={{ background: c.color }}
        />
        {c.pulse && (
          <motion.span
            animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full"
            style={{ background: c.color }}
          />
        )}
      </span>
      {c.label.toUpperCase()}
    </div>
  );
}
