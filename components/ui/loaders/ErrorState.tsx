'use client';

import { motion } from 'framer-motion';
import { WifiOff, CreditCard, Package, RefreshCw, ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ── Error type configs ───────────────────────────────── */
const ERROR_CONFIGS = {
  connectionLost: {
    code: 'ERR_CONNECTION_LOST',
    icon: WifiOff,
    title: 'Нет соединения',
    description: 'Не удалось подключиться к серверу. Проверьте интернет-соединение и попробуйте снова.',
    accent: '#EF4444',
    glow: 'rgba(239,68,68,0.25)',
    border: 'rgba(239,68,68,0.22)',
    pixels: ['#EF4444', '#B91C1C', '#F87171'],
  },
  paymentFailed: {
    code: 'ERR_PAYMENT_FAILED',
    icon: CreditCard,
    title: 'Ошибка оплаты',
    description: 'Платёж не прошёл. Проверьте данные карты или попробуйте другой способ оплаты.',
    accent: '#F59E0B',
    glow: 'rgba(245,158,11,0.25)',
    border: 'rgba(245,158,11,0.22)',
    pixels: ['#F59E0B', '#D97706', '#FCD34D'],
  },
  inventoryUnavailable: {
    code: 'ERR_OUT_OF_STOCK',
    icon: Package,
    title: 'Нет в наличии',
    description: 'Этот товар временно недоступен. Добавьте его в список желаний — мы сообщим о поступлении.',
    accent: '#7C3AED',
    glow: 'rgba(124,58,237,0.25)',
    border: 'rgba(124,58,237,0.28)',
    pixels: ['#7C3AED', '#9D60FA', '#C4B5FD'],
  },
  notFound: {
    code: 'ERR_404_NOT_FOUND',
    icon: WifiOff,
    title: 'Страница не найдена',
    description: 'Запрошенная страница не существует или была удалена. Вернитесь на главную.',
    accent: '#06B6D4',
    glow: 'rgba(6,182,212,0.22)',
    border: 'rgba(6,182,212,0.22)',
    pixels: ['#06B6D4', '#0891B2', '#22D3EE'],
  },
} as const;

type ErrorType = keyof typeof ERROR_CONFIGS;

/* ── Pixel glitch decoration ──────────────────────────── */
function PixelBlocks({ colors }: { colors: readonly string[] }) {
  const blocks = [
    { x: -14, y: -8,  w: 6,  h: 6,  color: 0, opacity: 0.7 },
    { x:  12, y: -12, w: 4,  h: 4,  color: 1, opacity: 0.5 },
    { x: -18, y:  10, w: 5,  h: 3,  color: 2, opacity: 0.4 },
    { x:  14, y:   8, w: 3,  h: 5,  color: 0, opacity: 0.6 },
    { x:  -8, y:  14, w: 4,  h: 4,  color: 1, opacity: 0.45 },
  ];

  return (
    <>
      {blocks.map((b, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [b.opacity, b.opacity * 0.3, b.opacity] }}
          transition={{ duration: 1.5 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
          className="absolute pointer-events-none"
          style={{
            left: `calc(50% + ${b.x}px)`,
            top: `calc(50% + ${b.y}px)`,
            width: `${b.w}px`,
            height: `${b.h}px`,
            background: colors[b.color],
          }}
        />
      ))}
    </>
  );
}

/* ── Main ErrorState component ────────────────────────── */
interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  description?: string;
  code?: string;
  onRetry?: () => void;
  onBack?: () => void;
  retryLabel?: string;
  backLabel?: string;
  compact?: boolean;
}

export default function ErrorState({
  type = 'connectionLost',
  title,
  description,
  code,
  onRetry,
  onBack,
  retryLabel = 'Попробовать снова',
  backLabel = 'Вернуться',
  compact = false,
}: ErrorStateProps) {
  const cfg = ERROR_CONFIGS[type];
  const Icon = cfg.icon as LucideIcon;
  const displayTitle = title ?? cfg.title;
  const displayDesc = description ?? cfg.description;
  const displayCode = code ?? cfg.code;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col items-center text-center ${compact ? 'py-10 px-6' : 'py-20 px-6'}`}
    >
      {/* ── Icon area ── */}
      <div className="relative mb-8">
        {/* Outer glow */}
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${cfg.glow} 0%, transparent 70%)`,
            filter: 'blur(16px)',
            transform: 'scale(2.5)',
          }}
        />

        {/* Pixel blocks decoration */}
        <PixelBlocks colors={cfg.pixels} />

        {/* Icon container */}
        <div
          className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: `${cfg.accent}12`,
            border: `1px solid ${cfg.border}`,
            boxShadow: `0 0 30px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
          }}
        >
          <Icon
            style={{ width: '32px', height: '32px', color: cfg.accent }}
          />
        </div>
      </div>

      {/* ── Error code ── */}
      <div
        className="font-pixel mb-4"
        style={{
          fontSize: '8px',
          letterSpacing: '0.12em',
          color: cfg.accent,
          opacity: 0.7,
        }}
      >
        {displayCode}
      </div>

      {/* ── Title ── */}
      <h3
        className="font-heading font-bold text-white mb-3"
        style={{ fontSize: compact ? '18px' : '24px', lineHeight: 1.2 }}
      >
        {displayTitle}
      </h3>

      {/* ── Description ── */}
      <p
        className="font-body max-w-sm mb-8"
        style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.7' }}
      >
        {displayDesc}
      </p>

      {/* ── Actions ── */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRetry}
            className="relative inline-flex items-center gap-2 rounded-xl font-heading font-semibold text-white overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${cfg.accent} 0%, ${cfg.accent}BB 100%)`,
              padding: '11px 22px',
              fontSize: '13.5px',
              letterSpacing: '0.03em',
              boxShadow: `0 0 0 1px ${cfg.border}, 0 4px 20px ${cfg.glow}`,
            }}
          >
            <span
              className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%)' }}
            />
            <RefreshCw className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{retryLabel}</span>
          </motion.button>
        )}

        {onBack && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl font-heading font-medium"
            style={{
              background: '#0D0D16',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '11px 22px',
              fontSize: '13.5px',
              color: '#6B7280',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = '#E2E8F0';
              el.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = '#6B7280';
              el.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Full-page error wrapper ──────────────────────────── */
export function ErrorPage(props: ErrorStateProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#05040B' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.02,
        }}
      />
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)',
        }}
      />
      <ErrorState {...props} />
    </div>
  );
}
