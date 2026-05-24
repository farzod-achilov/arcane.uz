'use client';

import { motion } from 'framer-motion';
import { TrendingDown, ShoppingCart, Zap, Package } from 'lucide-react';
import type { PricingStrategy } from '@/lib/smartPricing/types';
import { STRATEGY_META } from '@/lib/smartPricing/strategies';

export interface GamePricingData {
  finalPriceUsd:        number;
  finalPriceUzs:        number;
  steamPriceUsd?:       number | null;
  youSaveAmount?:       number | null;
  youSavePercent?:      number | null;
  pricingStrategy?:     PricingStrategy;
  stockCount?:          number;
}

interface Props {
  data:       GamePricingData;
  onBuy?:     () => void;
  className?: string;
}

function formatUzs(n: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n));
}

export default function GamePricingCard({ data, onBuy, className = '' }: Props) {
  const {
    finalPriceUsd, finalPriceUzs, steamPriceUsd,
    youSaveAmount, youSavePercent, pricingStrategy = 'GLOBAL', stockCount,
  } = data;

  const hasSteamCompare = steamPriceUsd != null && youSavePercent != null && youSavePercent > 0;
  const stratMeta       = STRATEGY_META[pricingStrategy];
  const inStock         = stockCount == null || stockCount > 0;
  const lowStock        = stockCount != null && stockCount > 0 && stockCount <= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(135deg, #0D0D1A, #0A0A14)',
        border:     '1px solid rgba(124,58,237,0.2)',
        boxShadow:  '0 0 40px rgba(124,58,237,0.06)',
      }}
    >
      {/* Top accent */}
      <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.5), rgba(6,182,212,0.3), transparent)' }} />

      <div className="p-5 space-y-4">
        {/* Steam compare */}
        {hasSteamCompare && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>Steam Price</span>
              <span
                className="font-heading font-semibold text-[#4B5563] line-through"
                style={{ fontSize: '15px' }}
              >
                ${steamPriceUsd!.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Final price */}
        <div className="space-y-1">
          <p className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>
            {hasSteamCompare ? 'Your Price' : 'Price'}
          </p>
          <motion.p
            key={finalPriceUsd}
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            className="font-heading font-bold text-white"
            style={{ fontSize: '32px', lineHeight: 1, textShadow: '0 0 24px rgba(124,58,237,0.5)' }}
          >
            ${finalPriceUsd.toFixed(2)}
          </motion.p>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
            {formatUzs(finalPriceUzs)} сум
          </p>
        </div>

        {/* You Save badge */}
        {hasSteamCompare && (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-between rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <TrendingDown style={{ width: '14px', height: '14px', color: '#22C55E' }} />
              <span className="font-body text-[#22C55E]" style={{ fontSize: '13px' }}>You Save</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-[#22C55E]" style={{ fontSize: '14px' }}>
                ${youSaveAmount!.toFixed(2)}
              </span>
              <span
                className="font-pixel text-white rounded-lg px-2 py-0.5"
                style={{
                  fontSize:   '8px',
                  background: '#22C55E',
                  letterSpacing: '0.04em',
                  boxShadow: '0 0 8px rgba(34,197,94,0.4)',
                }}
              >
                {youSavePercent!.toFixed(0)}% OFF
              </span>
            </div>
          </motion.div>
        )}

        {/* Stock status */}
        <div className="flex items-center gap-2">
          <Package style={{ width: '12px', height: '12px', color: inStock ? (lowStock ? '#F59E0B' : '#22C55E') : '#EF4444' }} />
          <span
            className="font-body"
            style={{ fontSize: '11px', color: inStock ? (lowStock ? '#F59E0B' : '#22C55E') : '#EF4444' }}
          >
            {!inStock
              ? 'Out of stock'
              : lowStock
              ? `Only ${stockCount} left!`
              : 'In stock · Instant delivery'}
          </span>
          {inStock && <Zap style={{ width: '11px', height: '11px', color: '#7C3AED' }} />}
        </div>

        {/* Strategy badge */}
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: stratMeta.color, boxShadow: `0 0 4px ${stratMeta.color}` }}
          />
          <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
            {stratMeta.label} pricing
          </span>
        </div>

        {/* Buy button */}
        {onBuy && (
          <motion.button
            onClick={onBuy}
            disabled={!inStock}
            whileHover={inStock ? { scale: 1.02 } : {}}
            whileTap={inStock ? { scale: 0.97 } : {}}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 font-heading font-bold transition-all duration-200"
            style={{
              background:  inStock ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : 'rgba(255,255,255,0.04)',
              border:      `1px solid ${inStock ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.06)'}`,
              color:       inStock ? '#fff' : '#374151',
              fontSize:    '14px',
              boxShadow:   inStock ? '0 0 24px rgba(124,58,237,0.35)' : 'none',
              cursor:      inStock ? 'pointer' : 'not-allowed',
            }}
          >
            <ShoppingCart style={{ width: '16px', height: '16px' }} />
            {inStock ? 'Buy Now' : 'Unavailable'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
