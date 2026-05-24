'use client';

import { useState } from 'react';

interface Props {
  value:       number;
  onChange:    (v: number) => void;
  prefix?:     string;
  suffix?:     string;
  min?:        number;
  max?:        number;
  step?:       number;
  label:       string;
  description?: string;
  color?:      string;
}

export default function MarkupInput({
  value, onChange, prefix, suffix, min = 0, max = 9999, step = 0.1,
  label, description, color = '#7C3AED',
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{label}</label>
      <div
        className="flex items-center rounded-xl overflow-hidden transition-all duration-200"
        style={{
          background: focused ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
          border:     `1px solid ${focused ? color + '50' : 'rgba(255,255,255,0.08)'}`,
          boxShadow:  focused ? `0 0 0 2px ${color}15` : 'none',
        }}
      >
        {prefix && (
          <span
            className="font-heading font-semibold px-3 py-2.5 flex-shrink-0"
            style={{ fontSize: '13px', color, background: `${color}10`, borderRight: `1px solid ${color}20` }}
          >
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={e => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
          }}
          className="flex-1 bg-transparent font-heading font-semibold text-white outline-none px-3 py-2.5"
          style={{ fontSize: '14px', minWidth: 0 }}
        />
        {suffix && (
          <span
            className="font-heading font-semibold px-3 py-2.5 flex-shrink-0"
            style={{ fontSize: '13px', color, background: `${color}10`, borderLeft: `1px solid ${color}20` }}
          >
            {suffix}
          </span>
        )}
      </div>
      {description && (
        <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>{description}</p>
      )}
    </div>
  );
}
