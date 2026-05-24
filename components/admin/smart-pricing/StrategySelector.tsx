'use client';

import { motion } from 'framer-motion';
import { STRATEGY_META } from '@/lib/smartPricing/strategies';
import type { PricingStrategy } from '@/lib/smartPricing/types';
import { useT } from '@/lib/i18n';

interface Props {
  value:    PricingStrategy;
  onChange: (v: PricingStrategy) => void;
}

const STRATEGIES: PricingStrategy[] = ['GLOBAL', 'AGGRESSIVE', 'COMPETITIVE', 'HIGH_PROFIT', 'MANUAL'];

export default function StrategySelector({ value, onChange }: Props) {
  const { t } = useT();

  const LABELS: Record<PricingStrategy, string> = {
    GLOBAL:      t.strategies.globalFull,
    AGGRESSIVE:  t.strategies.aggressiveFull,
    COMPETITIVE: t.strategies.competitiveFull,
    HIGH_PROFIT: t.strategies.highProfitFull,
    MANUAL:      t.strategies.manualFull,
  };

  const DESCS: Record<PricingStrategy, string> = {
    GLOBAL:      t.strategies.globalDesc,
    AGGRESSIVE:  t.strategies.aggressiveDesc,
    COMPETITIVE: t.strategies.competitiveDesc,
    HIGH_PROFIT: t.strategies.highProfitDesc,
    MANUAL:      t.strategies.manualDesc,
  };

  return (
    <div className="grid grid-cols-5 gap-2">
      {STRATEGIES.map(s => {
        const meta   = STRATEGY_META[s];
        const active = value === s;
        return (
          <motion.button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="relative rounded-xl p-3 text-center overflow-hidden transition-all duration-200"
            style={{
              background: active ? `${meta.color}18` : 'rgba(255,255,255,0.02)',
              border:     `1px solid ${active ? meta.color + '50' : 'rgba(255,255,255,0.07)'}`,
              boxShadow:  active ? `0 0 14px ${meta.color}20` : 'none',
            }}
          >
            {active && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at top, ${meta.color}12, transparent 70%)` }}
              />
            )}
            <div
              className="w-2 h-2 rounded-full mx-auto mb-2"
              style={{ background: meta.color, boxShadow: active ? `0 0 6px ${meta.color}` : 'none' }}
            />
            <p
              className="font-heading font-bold relative z-10"
              style={{ fontSize: '11px', color: active ? meta.color : '#4B5563' }}
            >
              {LABELS[s]}
            </p>
            <p
              className="font-body relative z-10 mt-0.5 leading-tight"
              style={{ fontSize: '9px', color: active ? meta.color + 'AA' : '#374151' }}
            >
              {DESCS[s]}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}
