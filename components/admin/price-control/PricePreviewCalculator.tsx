'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, TrendingUp, Zap, Tag, ArrowRight } from 'lucide-react';
import type { PriceSettings } from '@/app/api/admin/price-settings/route';

interface Props {
  settings: PriceSettings;
}

function applyRounding(price: number, type: PriceSettings['roundType']): number {
  if (type === 'integer') return Math.ceil(price);
  const base = Math.floor(price);
  const frac = type === '.99' ? 0.99 : 0.49;
  return base + frac < price ? base + 1 + frac : base + frac;
}

interface CalcResult {
  rawPrice:     number;
  finalPrice:   number;
  profit:       number;
  profitPct:    number;
  appliedRule:  string;
  steps:        { label: string; value: string; color: string }[];
}

function calculate(supplierPrice: number, s: PriceSettings): CalcResult | null {
  if (supplierPrice <= 0) return null;

  const steps: CalcResult['steps'] = [];
  let price = supplierPrice;

  // Step 1: rule-based markup
  let appliedRule: string;
  if (supplierPrice < s.cheapGameThreshold) {
    price = supplierPrice + s.fixedMarkupForCheap;
    appliedRule = `Cheap game rule (+$${s.fixedMarkupForCheap} fixed)`;
    steps.push({ label: 'Fixed markup', value: `+$${s.fixedMarkupForCheap.toFixed(2)}`, color: '#06B6D4' });
  } else {
    price = supplierPrice * (1 + s.expensiveGamePercentMarkup / 100);
    appliedRule = `Expensive game rule (+${s.expensiveGamePercentMarkup}%)`;
    steps.push({ label: `Percent markup`, value: `+${s.expensiveGamePercentMarkup}%`, color: '#9D60FA' });
  }

  // Step 2: global markup
  if (s.globalMarkupPercent > 0) {
    price = price * (1 + s.globalMarkupPercent / 100);
    steps.push({ label: 'Global markup', value: `+${s.globalMarkupPercent}%`, color: '#7C3AED' });
  }

  const rawPrice = price;

  // Step 3: rounding
  if (s.autoRoundEnabled) {
    price = applyRounding(price, s.roundType);
    steps.push({ label: `Auto round (${s.roundType})`, value: `→ $${price.toFixed(2)}`, color: '#F59E0B' });
  }

  // Step 4: minimum profit floor
  const currentProfit = price - supplierPrice;
  if (currentProfit < s.minimumProfitUsd) {
    price = supplierPrice + s.minimumProfitUsd;
    if (s.autoRoundEnabled) price = applyRounding(price, s.roundType);
    steps.push({ label: 'Min profit floor', value: `→ $${price.toFixed(2)}`, color: '#EF4444' });
  }

  const profit    = price - supplierPrice;
  const profitPct = (profit / supplierPrice) * 100;

  return { rawPrice, finalPrice: price, profit, profitPct, appliedRule, steps };
}

export default function PricePreviewCalculator({ settings }: Props) {
  const [supplierPrice, setSupplierPrice] = useState<string>('15');
  const [focused, setFocused] = useState(false);

  const price  = parseFloat(supplierPrice);
  const result = useMemo(() => calculate(price, settings), [price, settings]);

  const profitColor = !result
    ? '#4B5563'
    : result.profitPct >= 15 ? '#22C55E'
    : result.profitPct >= 5  ? '#F59E0B'
    : '#EF4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#0D0D1A',
        border:     '1px solid rgba(124,58,237,0.18)',
        boxShadow:  '0 0 40px rgba(124,58,237,0.06)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{
          background:   'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.06))',
          borderBottom: '1px solid rgba(124,58,237,0.15)',
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #7C3AED22, #06B6D422)',
            border:     '1px solid rgba(124,58,237,0.3)',
            boxShadow:  '0 0 14px rgba(124,58,237,0.2)',
          }}
        >
          <Calculator style={{ width: '15px', height: '15px', color: '#7C3AED' }} />
        </div>
        <div>
          <p className="font-heading font-bold text-white" style={{ fontSize: '13px' }}>Price Preview</p>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>Live calculation</p>
        </div>
        <div
          className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="font-pixel text-green-400" style={{ fontSize: '7px', letterSpacing: '0.06em' }}>LIVE</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Supplier price input */}
        <div>
          <label className="font-body text-[#9CA3AF] mb-1.5 block" style={{ fontSize: '12px' }}>
            Supplier Price (USD)
          </label>
          <div
            className="flex items-center rounded-xl overflow-hidden transition-all duration-200"
            style={{
              background: focused ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
              border:     `1px solid ${focused ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`,
              boxShadow:  focused ? '0 0 0 2px rgba(124,58,237,0.15)' : 'none',
            }}
          >
            <span
              className="font-heading font-bold px-3 py-3 flex-shrink-0"
              style={{ fontSize: '14px', color: '#7C3AED', background: 'rgba(124,58,237,0.08)', borderRight: '1px solid rgba(124,58,237,0.15)' }}
            >
              $
            </span>
            <input
              type="number"
              value={supplierPrice}
              min={0}
              step={0.01}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={e => setSupplierPrice(e.target.value)}
              className="flex-1 bg-transparent font-heading font-bold text-white outline-none px-3 py-3"
              style={{ fontSize: '16px' }}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {/* Applied rule badge */}
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}
              >
                <Tag style={{ width: '11px', height: '11px', color: '#7C3AED', flexShrink: 0 }} />
                <span className="font-body text-[#9CA3AF]" style={{ fontSize: '11px' }}>{result.appliedRule}</span>
              </div>

              {/* Calculation steps */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>Supplier price</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  <span className="font-heading font-semibold text-[#6B7280]" style={{ fontSize: '12px' }}>
                    ${parseFloat(supplierPrice).toFixed(2)}
                  </span>
                </div>
                {result.steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <ArrowRight style={{ width: '10px', height: '10px', color: step.color, flexShrink: 0 }} />
                    <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>{step.label}</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    <span className="font-heading font-semibold" style={{ fontSize: '12px', color: step.color }}>
                      {step.value}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

              {/* Final price */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>Final Price</p>
                  <motion.p
                    key={result.finalPrice}
                    initial={{ scale: 0.95, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-heading font-bold text-white"
                    style={{ fontSize: '28px', textShadow: '0 0 20px rgba(124,58,237,0.4)' }}
                  >
                    ${result.finalPrice.toFixed(2)}
                  </motion.p>
                </div>

                {/* Profit badge */}
                <div
                  className="rounded-xl px-3 py-2 text-right"
                  style={{
                    background: `${profitColor}12`,
                    border:     `1px solid ${profitColor}25`,
                  }}
                >
                  <div className="flex items-center gap-1.5 justify-end mb-0.5">
                    <TrendingUp style={{ width: '11px', height: '11px', color: profitColor }} />
                    <span className="font-body" style={{ fontSize: '10px', color: profitColor }}>Profit</span>
                  </div>
                  <p className="font-heading font-bold" style={{ fontSize: '14px', color: profitColor }}>
                    +${result.profit.toFixed(2)}
                  </p>
                  <p className="font-body" style={{ fontSize: '10px', color: profitColor + 'AA' }}>
                    {result.profitPct.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Threshold indicator */}
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{
                  background: price < settings.cheapGameThreshold
                    ? 'rgba(6,182,212,0.06)'
                    : 'rgba(157,96,250,0.06)',
                  border: `1px solid ${price < settings.cheapGameThreshold
                    ? 'rgba(6,182,212,0.15)'
                    : 'rgba(157,96,250,0.15)'}`,
                }}
              >
                <Zap style={{ width: '11px', height: '11px', color: price < settings.cheapGameThreshold ? '#06B6D4' : '#9D60FA', flexShrink: 0 }} />
                <span className="font-body" style={{ fontSize: '11px', color: price < settings.cheapGameThreshold ? '#06B6D4' : '#9D60FA' }}>
                  {price < settings.cheapGameThreshold
                    ? `Cheap game — below $${settings.cheapGameThreshold} threshold`
                    : `Expensive game — above $${settings.cheapGameThreshold} threshold`}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <Calculator style={{ width: '28px', height: '28px', color: '#1F2937', marginBottom: '8px' }} />
              <p className="font-body text-[#374151]" style={{ fontSize: '12px' }}>
                Enter a supplier price to preview
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
