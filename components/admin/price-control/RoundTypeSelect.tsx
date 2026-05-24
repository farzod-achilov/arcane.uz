'use client';

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type RoundType = '.99' | '.49' | 'integer';

const OPTIONS: { value: RoundType; label: string; description: string }[] = [
  { value: '.99',     label: 'Round to .99',   description: '$9.99  $24.99  $59.99' },
  { value: '.49',     label: 'Round to .49',   description: '$9.49  $24.49  $59.49' },
  { value: 'integer', label: 'Round to integer', description: '$10  $25  $60' },
];

interface Props {
  value:    RoundType;
  onChange: (v: RoundType) => void;
}

export default function RoundTypeSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find(o => o.value === value)!;

  return (
    <div className="relative">
      <label className="font-body text-[#9CA3AF] mb-1.5 block" style={{ fontSize: '12px' }}>
        Rounding style
      </label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200"
        style={{
          background: open ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)',
          border:     `1px solid ${open ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)'}`,
        }}
      >
        <div className="text-left">
          <p className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>{current.label}</p>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '10px' }}>{current.description}</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown style={{ width: '14px', height: '14px', color: '#4B5563' }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1.5 rounded-xl overflow-hidden"
            style={{
              background:  '#0D0D1A',
              border:      '1px solid rgba(124,58,237,0.2)',
              boxShadow:   '0 12px 32px rgba(0,0,0,0.5)',
              transformOrigin: 'top',
            }}
          >
            {OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2.5 transition-colors duration-150"
                style={{
                  background: opt.value === value ? 'rgba(124,58,237,0.1)' : 'transparent',
                }}
                onMouseEnter={e => { if (opt.value !== value) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { if (opt.value !== value) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div className="text-left">
                  <p className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>{opt.label}</p>
                  <p className="font-body text-[#374151]" style={{ fontSize: '10px' }}>{opt.description}</p>
                </div>
                {opt.value === value && (
                  <Check style={{ width: '13px', height: '13px', color: '#7C3AED', flexShrink: 0 }} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
