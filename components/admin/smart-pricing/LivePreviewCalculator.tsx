'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence }  from 'framer-motion';
import { Calculator, Zap, TrendingUp, DollarSign, Tag, ArrowRight, RefreshCw } from 'lucide-react';
import type { PricingStrategy, SmartMarkupType, PriceCalculationResult } from '@/lib/smartPricing/types';
import { STRATEGY_META } from '@/lib/smartPricing/strategies';
import StrategySelector from './StrategySelector';
import { useT } from '@/lib/i18n';

function NumInput({
  label, value, onChange, prefix, suffix, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  prefix?: string; suffix?: string; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1">
      <label className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>{label}</label>
      <div
        className="flex items-center rounded-xl overflow-hidden transition-all duration-200"
        style={{
          background: focused ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
          border:     `1px solid ${focused ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow:  focused ? '0 0 0 2px rgba(124,58,237,0.12)' : 'none',
        }}
      >
        {prefix && (
          <span className="px-2.5 py-2 font-heading font-semibold text-[#7C3AED] flex-shrink-0"
                style={{ fontSize: '12px', background: 'rgba(124,58,237,0.08)', borderRight: '1px solid rgba(124,58,237,0.15)' }}>
            {prefix}
          </span>
        )}
        <input
          type="number" value={value} min={0} step={0.01}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={()  => setFocused(false)}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none px-2.5 py-2 font-heading font-semibold text-white"
          style={{ fontSize: '13px', minWidth: 0 }}
        />
        {suffix && (
          <span className="px-2.5 py-2 font-body text-[#4B5563] flex-shrink-0" style={{ fontSize: '11px' }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, color = '#E2E8F0', large = false }: {
  label: string; value: string; sub?: string; color?: string; large?: boolean;
}) {
  return (
    <div>
      <p className="font-body text-[#4B5563] mb-0.5" style={{ fontSize: '10px' }}>{label}</p>
      <motion.p
        key={value}
        initial={{ opacity: 0.6, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-heading font-bold"
        style={{ fontSize: large ? '22px' : '14px', color, textShadow: large ? `0 0 20px ${color}40` : 'none' }}
      >
        {value}
      </motion.p>
      {sub && <p className="font-body mt-0.5" style={{ fontSize: '10px', color: color + 'AA' }}>{sub}</p>}
    </div>
  );
}

export default function LivePreviewCalculator() {
  const { t } = useT();
  const [supplierPrice, setSupplierPrice] = useState('29.99');
  const [steamPrice,    setSteamPrice]    = useState('59.99');
  const [strategy,      setStrategy]      = useState<PricingStrategy>('GLOBAL');
  const [result,        setResult]        = useState<PriceCalculationResult | null>(null);
  const [loading,       setLoading]       = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchPreview = useCallback(async () => {
    const sp = parseFloat(supplierPrice);
    if (isNaN(sp) || sp <= 0) { setResult(null); return; }

    setLoading(true);
    try {
      const res  = await fetch('/api/admin/pricing/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierPriceUsd: sp,
          steamPriceUsd:    parseFloat(steamPrice) || undefined,
          strategy,
        }),
      });
      const json = await res.json();
      if (json.success) setResult(json.data as PriceCalculationResult);
    } finally {
      setLoading(false);
    }
  }, [supplierPrice, steamPrice, strategy]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchPreview, 350);
    return () => clearTimeout(debounceRef.current);
  }, [fetchPreview]);

  const stratMeta  = STRATEGY_META[strategy];
  const marginColor = !result ? '#4B5563'
    : result.marginPercent >= 15 ? '#22C55E'
    : result.marginPercent >= 5  ? '#F59E0B' : '#EF4444';

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#0A0A14',
        border:     '1px solid rgba(124,58,237,0.2)',
        boxShadow:  '0 0 40px rgba(124,58,237,0.07)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{
          background:   'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(6,182,212,0.07))',
          borderBottom: '1px solid rgba(124,58,237,0.15)',
        }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
             style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 0 14px rgba(124,58,237,0.25)' }}>
          <Calculator style={{ width: '15px', height: '15px', color: '#7C3AED' }} />
        </div>
        <div className="flex-1">
          <p className="font-heading font-bold text-white" style={{ fontSize: '13px' }}>{t.smartPricing.livePreview}</p>
          <p className="font-body text-[#4B5563]"          style={{ fontSize: '11px' }}>{t.smartPricing.realtimeEngine}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
             style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <motion.span
            animate={{ opacity: loading ? [1, 0.3, 1] : 1 }}
            transition={{ duration: 0.8, repeat: loading ? Infinity : 0 }}
            className="w-1.5 h-1.5 rounded-full bg-green-400"
          />
          <span className="font-pixel text-green-400" style={{ fontSize: '7px', letterSpacing: '0.06em' }}>
            {loading ? 'CALC' : 'LIVE'}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <NumInput label={t.smartPricing.supplierPrice} value={supplierPrice} onChange={setSupplierPrice} prefix="$" placeholder="0.00" />
          <NumInput label={t.smartPricing.steamPriceInput} value={steamPrice} onChange={setSteamPrice} prefix="$" placeholder="0.00" />
        </div>

        {/* Strategy */}
        <div>
          <p className="font-body text-[#6B7280] mb-2" style={{ fontSize: '11px' }}>{t.smartPricing.strategyInput}</p>
          <StrategySelector value={strategy} onChange={setStrategy} />
        </div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

              {/* Strategy badge */}
              <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                   style={{ background: `${stratMeta.color}0E`, border: `1px solid ${stratMeta.color}25` }}>
                <Tag style={{ width: '11px', height: '11px', color: stratMeta.color, flexShrink: 0 }} />
                <span className="font-body" style={{ fontSize: '11px', color: stratMeta.color }}>{stratMeta.label}</span>
                <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>— {stratMeta.description}</span>
              </div>

              {/* Applied rules chain */}
              <div className="space-y-1">
                <p className="font-body text-[#374151]" style={{ fontSize: '10px', marginBottom: '6px' }}>{t.smartPricing.appliedRules}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-body text-[#4B5563]" style={{ fontSize: '10px' }}>
                    ${result.supplierPriceUsd.toFixed(2)}
                  </span>
                  {result.appliedRules.map((rule, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <ArrowRight style={{ width: '9px', height: '9px', color: '#374151', flexShrink: 0 }} />
                      <span
                        className="font-body rounded px-1.5 py-0.5"
                        style={{ fontSize: '9px', color: '#9CA3AF', background: 'rgba(255,255,255,0.04)' }}
                      >
                        {rule}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

              {/* Key numbers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-body text-[#4B5563] mb-1" style={{ fontSize: '10px' }}>{t.smartPricing.finalPriceUsd}</p>
                  <motion.p key={result.finalPriceUsd}
                    initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                    className="font-heading font-bold text-white"
                    style={{ fontSize: '26px', textShadow: '0 0 24px rgba(124,58,237,0.5)' }}
                  >
                    ${result.finalPriceUsd.toFixed(2)}
                  </motion.p>
                  <p className="font-body text-[#4B5563]" style={{ fontSize: '10px' }}>
                    {t.smartPricing.raw}: ${result.rawPriceUsd.toFixed(2)}
                  </p>
                </div>

                <div
                  className="rounded-xl p-3"
                  style={{ background: marginColor + '0E', border: `1px solid ${marginColor}25` }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp style={{ width: '11px', height: '11px', color: marginColor }} />
                    <span className="font-body" style={{ fontSize: '10px', color: marginColor }}>{t.smartPricing.profit}</span>
                  </div>
                  <p className="font-heading font-bold" style={{ fontSize: '16px', color: marginColor }}>
                    +${result.profitUsd.toFixed(2)}
                  </p>
                  <p className="font-body" style={{ fontSize: '10px', color: marginColor + 'AA' }}>
                    {result.marginPercent.toFixed(1)}% {t.smartPricing.marginLabel}
                  </p>
                </div>
              </div>

              {/* UZS + Steam compare */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3"
                     style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}>
                  <p className="font-body text-[#06B6D4] mb-1" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {t.smartPricing.uzsPrice}
                  </p>
                  <p className="font-heading font-bold text-white" style={{ fontSize: '14px' }}>
                    {Math.round(result.finalPriceUzs).toLocaleString('ru')} сум
                  </p>
                </div>

                {result.youSavePercent != null ? (
                  <div className="rounded-xl p-3"
                       style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <p className="font-body text-[#22C55E] mb-1" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {t.smartPricing.vsSteam}
                    </p>
                    <p className="font-heading font-bold text-[#22C55E]" style={{ fontSize: '14px' }}>
                      -{result.youSavePercent.toFixed(0)}%
                    </p>
                    <p className="font-body text-[#22C55E]" style={{ fontSize: '10px', opacity: 0.7 }}>
                      {t.smartPricing.youSave} ${result.youSaveAmount?.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl p-3"
                       style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="font-body text-[#374151] mb-1" style={{ fontSize: '9px' }}>{t.smartPricing.steamCompare}</p>
                    <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>{t.smartPricing.noSteamPrice}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center py-8 text-center gap-3">
              <DollarSign style={{ width: '28px', height: '28px', color: '#1F2937' }} />
              <p className="font-body text-[#374151]" style={{ fontSize: '12px' }}>
                {t.smartPricing.enterPrice}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
