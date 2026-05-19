'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

/* ── Animated dots ────────────────────────────────────── */
function LoadingDots({ color = 'white' }: { color?: string }) {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.18,
            ease: 'easeInOut',
          }}
          className="block rounded-full"
          style={{ width: '4px', height: '4px', background: color }}
        />
      ))}
    </span>
  );
}

/* ── Variant configs ──────────────────────────────────── */
const VARIANTS = {
  primary: {
    base: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 60%, #06B6D4 130%)',
    loading: 'linear-gradient(135deg, #5B21B6 0%, #4C1D95 100%)',
    ring: 'rgba(124,58,237,0.4)',
    hoverGlow: '0 0 20px rgba(124,58,237,0.5)',
    text: '#fff',
    disabledOpacity: 0.65,
  },
  secondary: {
    base: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
    loading: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)',
    ring: 'rgba(6,182,212,0.4)',
    hoverGlow: '0 0 20px rgba(6,182,212,0.45)',
    text: '#fff',
    disabledOpacity: 0.65,
  },
  danger: {
    base: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
    loading: 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)',
    ring: 'rgba(239,68,68,0.35)',
    hoverGlow: '0 0 20px rgba(239,68,68,0.45)',
    text: '#fff',
    disabledOpacity: 0.65,
  },
  ghost: {
    base: 'linear-gradient(135deg, rgba(124,58,237,0.14) 0%, rgba(76,29,149,0.09) 100%)',
    loading: 'rgba(124,58,237,0.1)',
    ring: 'rgba(124,58,237,0.42)',
    hoverGlow: '0 0 16px rgba(124,58,237,0.2)',
    text: '#C4B5FD',
    disabledOpacity: 0.5,
  },
} as const;

type Variant = keyof typeof VARIANTS;
type Size = 'sm' | 'md' | 'lg';

const SIZE_STYLES: Record<Size, { padding: string; fontSize: string; height: string; borderRadius: string }> = {
  sm: { padding: '0 14px', fontSize: '12px',   height: '36px', borderRadius: '10px' },
  md: { padding: '0 22px', fontSize: '13.5px',  height: '44px', borderRadius: '12px' },
  lg: { padding: '0 28px', fontSize: '14.5px',  height: '52px', borderRadius: '14px' },
};

interface LoadingButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'style'> {
  loading?: boolean;
  loadingText?: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
}

export default function LoadingButton({
  loading = false,
  loadingText,
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  disabled,
  onClick,
  ...rest
}: LoadingButtonProps) {
  const cfg = VARIANTS[variant];
  const sz = SIZE_STYLES[size];
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      disabled={isDisabled}
      onClick={onClick}
      className="relative inline-flex items-center justify-center gap-2.5 overflow-hidden font-heading font-semibold transition-all duration-200"
      style={{
        background: loading ? cfg.loading : cfg.base,
        border: `1px solid ${cfg.ring}`,
        borderRadius: sz.borderRadius,
        padding: sz.padding,
        height: sz.height,
        fontSize: sz.fontSize,
        letterSpacing: '0.03em',
        color: cfg.text,
        width: fullWidth ? '100%' : undefined,
        opacity: isDisabled && !loading ? cfg.disabledOpacity : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        boxShadow: loading
          ? `0 0 0 1px ${cfg.ring}, 0 0 28px ${cfg.ring}`
          : `inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 1px ${cfg.ring}`,
      }}
      {...(rest as object)}
    >
      {/* Top shine */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${cfg.text}20, transparent)`,
          opacity: loading ? 0 : 1,
        }}
      />

      {/* Loading glow sweep */}
      {loading && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ x: ['-120%', '120%'] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.3 }}
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 50%, transparent)',
            width: '80%',
          }}
        />
      )}

      {/* Hover shine */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%)',
        }}
      />

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 flex items-center gap-2"
          >
            <LoadingDots color={cfg.text} />
            {loadingText && (
              <span className="font-pixel" style={{ fontSize: '0.75em', letterSpacing: '0.08em' }}>
                {loadingText}
              </span>
            )}
          </motion.span>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 flex items-center gap-2"
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ── Preset examples ──────────────────────────────────── */
export function BuyButton({ loading, children = 'Купить' }: { loading?: boolean; children?: ReactNode }) {
  return (
    <LoadingButton loading={loading} loadingText="ОБРАБОТКА..." variant="primary">
      {children}
    </LoadingButton>
  );
}

export function CartButton({ loading, children = 'В корзину' }: { loading?: boolean; children?: ReactNode }) {
  return (
    <LoadingButton loading={loading} loadingText="ДОБАВЛЯЕМ..." variant="primary" size="sm">
      {children}
    </LoadingButton>
  );
}

export function OpenCaseButton({ loading, children = 'Открыть кейс' }: { loading?: boolean; children?: ReactNode }) {
  return (
    <LoadingButton loading={loading} loadingText="ОТКРЫВАЕМ..." variant="secondary">
      {children}
    </LoadingButton>
  );
}
