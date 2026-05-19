'use client';

import { useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import type { ReactNode, InputHTMLAttributes } from 'react';

interface CheckoutInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  icon?: ReactNode;
  error?: string;
  success?: boolean;
  hint?: string;
}

export default function CheckoutInput({
  label,
  icon,
  error,
  success,
  hint,
  id,
  ...rest
}: CheckoutInputProps) {
  const [focused, setFocused] = useState(false);
  const inputId = id ?? label.toLowerCase().replace(/\s/g, '-');

  const borderColor = error
    ? 'rgba(239,68,68,0.5)'
    : success
    ? 'rgba(34,197,94,0.45)'
    : focused
    ? 'rgba(124,58,237,0.5)'
    : 'rgba(255,255,255,0.08)';

  const shadowColor = error
    ? '0 0 0 3px rgba(239,68,68,0.08)'
    : success
    ? '0 0 0 3px rgba(34,197,94,0.07)'
    : focused
    ? '0 0 0 3px rgba(124,58,237,0.1)'
    : 'none';

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label */}
      <label
        htmlFor={inputId}
        className="font-body"
        style={{ fontSize: '11.5px', color: '#6B7280', letterSpacing: '0.04em' }}
      >
        {label}
      </label>

      {/* Input wrapper */}
      <div className="relative">
        {/* Left icon */}
        {icon && (
          <div
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: focused ? '#9D60FA' : '#4B5563' }}
          >
            {icon}
          </div>
        )}

        <input
          id={inputId}
          className="w-full font-body text-white placeholder:text-[#2D2D44] outline-none transition-all duration-200"
          style={{
            background: '#07070D',
            border: `1px solid ${borderColor}`,
            borderRadius: '12px',
            padding: `12px ${success || error ? '42px' : '14px'} 12px ${icon ? '42px' : '14px'}`,
            fontSize: '14px',
            boxShadow: shadowColor,
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />

        {/* Right status icon */}
        {(success || error) && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            {success ? (
              <Check style={{ width: '15px', height: '15px', color: '#22C55E' }} />
            ) : (
              <AlertCircle style={{ width: '15px', height: '15px', color: '#EF4444' }} />
            )}
          </div>
        )}
      </div>

      {/* Error / hint */}
      {error && (
        <p className="font-body text-[#F87171]" style={{ fontSize: '11px' }}>{error}</p>
      )}
      {hint && !error && (
        <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>{hint}</p>
      )}
    </div>
  );
}
