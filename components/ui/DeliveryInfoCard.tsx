'use client';

import { motion } from 'framer-motion';
import {
  Zap, Gift, Send, Monitor, Package,
  Clock, CheckCircle2, MessageCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DeliveryType } from '@/lib/types';
import { DELIVERY_CONFIG, getDelivery } from '@/lib/delivery';

/* ── Icon resolver ─────────────────────────────────────── */
type DeliveryIconName = 'zap' | 'gift' | 'send' | 'monitor' | 'package';

const ICONS: Record<DeliveryIconName, LucideIcon> = {
  zap:     Zap,
  gift:    Gift,
  send:    Send,
  monitor: Monitor,
  package: Package,
};

/* ── Variant types ─────────────────────────────────────── */
type Variant = 'full' | 'compact' | 'inline';

interface DeliveryInfoCardProps {
  deliveryType: DeliveryType;
  deliveryTime?: string;
  deliveryDescription?: string;
  variant?: Variant;
  animated?: boolean;
}

/* ── Full variant (product page) ──────────────────────── */
function FullCard({
  cfg, resolvedTime, resolvedDescription, animated,
}: {
  cfg: ReturnType<typeof getDelivery>;
  resolvedTime: string;
  resolvedDescription: string;
  animated: boolean;
}) {
  const Icon = ICONS[cfg.iconName as DeliveryIconName];

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 12 } : false}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.45 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 0 20px ${cfg.glow}`,
      }}
    >
      {/* Top glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}70, transparent)` }}
      />
      {/* Ambient inner glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 60% 50% at 10% 50%, ${cfg.glow} 0%, transparent 65%)` }}
      />

      <div className="relative z-10 p-5">
        {/* Header row */}
        <div className="flex items-center gap-3 mb-3.5">
          {/* Animated icon container */}
          <motion.div
            animate={{ boxShadow: [`0 0 8px ${cfg.glow}`, `0 0 18px ${cfg.glow}`, `0 0 8px ${cfg.glow}`] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}35` }}
          >
            <Icon style={{ width: '17px', height: '17px', color: cfg.color }} />
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-heading font-bold text-white" style={{ fontSize: '14px' }}>
                {cfg.label}
              </p>
              {/* Badge */}
              <span
                className="font-pixel rounded-md px-2 py-0.5"
                style={{
                  fontSize: '7px',
                  color: cfg.color,
                  background: `${cfg.color}14`,
                  border: `1px solid ${cfg.color}30`,
                  letterSpacing: '0.07em',
                  textShadow: `0 0 8px ${cfg.glow}`,
                }}
              >
                {cfg.badge}
              </span>
            </div>
          </div>

          {/* Status pulse */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }}
            />
            <span className="font-body text-[#4B5563]" style={{ fontSize: '10.5px' }}>
              Активен
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="font-body text-[#9CA3AF] mb-4 leading-relaxed" style={{ fontSize: '13px', lineHeight: '1.6' }}>
          {resolvedDescription}
        </p>

        {/* Time + details row */}
        <div className="flex flex-wrap gap-3">
          {/* Delivery time */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Clock style={{ width: '12px', height: '12px', color: cfg.color, flexShrink: 0 }} />
            <div>
              <p className="font-body text-[#374151]" style={{ fontSize: '9.5px' }}>Среднее время</p>
              <p className="font-pixel" style={{ fontSize: '9px', color: cfg.color, letterSpacing: '0.04em' }}>
                {resolvedTime}
              </p>
            </div>
          </div>

          {/* Region */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <CheckCircle2 style={{ width: '12px', height: '12px', color: '#22C55E', flexShrink: 0 }} />
            <div>
              <p className="font-body text-[#374151]" style={{ fontSize: '9.5px' }}>Регион</p>
              <p className="font-pixel" style={{ fontSize: '9px', color: '#22C55E', letterSpacing: '0.04em' }}>
                RU / CIS
              </p>
            </div>
          </div>

          {/* Support hint for non-instant */}
          {(cfg.id === 'steam_gift' || cfg.id === 'telegram_activation' || cfg.id === 'manual_delivery') && (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <MessageCircle style={{ width: '12px', height: '12px', color: '#06B6D4', flexShrink: 0 }} />
              <div>
                <p className="font-body text-[#374151]" style={{ fontSize: '9.5px' }}>Поддержка</p>
                <p className="font-pixel" style={{ fontSize: '9px', color: '#06B6D4', letterSpacing: '0.04em' }}>
                  @arcaneuz_support
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Compact variant (checkout per-item) ──────────────── */
function CompactCard({
  cfg, resolvedTime,
}: {
  cfg: ReturnType<typeof getDelivery>;
  resolvedTime: string;
}) {
  const Icon = ICONS[cfg.iconName as DeliveryIconName];

  return (
    <div
      className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <Icon style={{ width: '13px', height: '13px', color: cfg.color, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="font-heading font-semibold" style={{ fontSize: '12px', color: cfg.color }}>
          {cfg.label}
        </p>
        <p className="font-body text-[#4B5563]" style={{ fontSize: '10.5px' }}>
          {resolvedTime}
        </p>
      </div>
      <span
        className="font-pixel rounded flex-shrink-0"
        style={{
          fontSize: '6.5px',
          color: cfg.color,
          background: `${cfg.color}14`,
          border: `1px solid ${cfg.color}28`,
          padding: '2px 6px',
          letterSpacing: '0.06em',
        }}
      >
        {cfg.badge}
      </span>
    </div>
  );
}

/* ── Inline variant (inside cart row) ────────────────── */
function InlineBadge({ cfg }: { cfg: ReturnType<typeof getDelivery> }) {
  const Icon = ICONS[cfg.iconName as DeliveryIconName];
  return (
    <div className="flex items-center gap-1">
      <Icon style={{ width: '10px', height: '10px', color: cfg.color, flexShrink: 0 }} />
      <span className="font-body" style={{ fontSize: '10.5px', color: cfg.color }}>
        {cfg.label}
      </span>
    </div>
  );
}

/* ── Main export ──────────────────────────────────────── */
export default function DeliveryInfoCard({
  deliveryType,
  deliveryTime,
  deliveryDescription,
  variant = 'full',
  animated = true,
}: DeliveryInfoCardProps) {
  const resolved = getDelivery(deliveryType, {
    time: deliveryTime,
    description: deliveryDescription,
  });

  if (variant === 'inline') {
    return <InlineBadge cfg={resolved} />;
  }

  if (variant === 'compact') {
    return (
      <CompactCard
        cfg={resolved}
        resolvedTime={resolved.resolvedTime}
      />
    );
  }

  return (
    <FullCard
      cfg={resolved}
      resolvedTime={resolved.resolvedTime}
      resolvedDescription={resolved.resolvedDescription}
      animated={animated}
    />
  );
}
