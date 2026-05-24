'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Globe, RefreshCw, Save, RotateCcw, DollarSign,
  BarChart2, Zap, Shield, Check, X, ChevronDown, Settings2,
  Coins, ChevronsRight, Activity, Gamepad2,
} from 'lucide-react';
import Link from 'next/link';
import LivePreviewCalculator from '@/components/admin/smart-pricing/LivePreviewCalculator';
import StrategySelector      from '@/components/admin/smart-pricing/StrategySelector';
import type { PriceSettings, CurrencySettings, UsdRoundType, UzsRoundType, PricingStrategy } from '@/lib/smartPricing/types';
import { usdRoundLabel, uzsRoundLabel, roundUsd, roundUzs } from '@/lib/smartPricing/rounding';
import { useT } from '@/lib/i18n';

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; type: 'success' | 'error'; msg: string }
let _tid = 0;

function Toasts({ list, dismiss }: { list: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {list.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0,  scale: 1 }}
            exit={{ opacity: 0,  x: 40,  scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onClick={() => dismiss(t.id)}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer"
            style={{
              background:     t.type === 'success' ? 'rgba(34,197,94,0.12)'  : 'rgba(239,68,68,0.12)',
              border:         `1px solid ${t.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              boxShadow:      '0 8px 32px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(12px)',
              minWidth:       '240px',
            }}
          >
            {t.type === 'success'
              ? <Check style={{ width: '14px', height: '14px', color: '#22C55E' }} />
              : <X     style={{ width: '14px', height: '14px', color: '#EF4444' }} />}
            <span className="font-body text-white flex-1" style={{ fontSize: '13px' }}>{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Reusable primitives ──────────────────────────────────────────────────────

function SectionCard({
  title, subtitle, icon: Icon, color, children, delay = 0, accent = false,
}: {
  title: string; subtitle?: string; icon: React.ElementType; color: string;
  children: React.ReactNode; delay?: number; accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl p-5 relative overflow-hidden group"
      style={{
        background: accent ? `linear-gradient(135deg, ${color}0C, #0D0D1A)` : '#0D0D1A',
        border:     `1px solid ${accent ? color + '22' : 'rgba(255,255,255,0.06)'}`,
      }}
      whileHover={{ borderColor: color + '30' } as never}
    >
      <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
           style={{ background: `radial-gradient(circle at top right, ${color}0A, transparent 70%)` }} />
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
           style={{ background: `linear-gradient(90deg, transparent, ${color}35, transparent)` }} />

      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
             style={{ background: `${color}12`, border: `1px solid ${color}25`, boxShadow: `0 0 10px ${color}12` }}>
          <Icon style={{ width: '15px', height: '15px', color }} />
        </div>
        <div>
          <p className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>{title}</p>
          {subtitle && <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>{subtitle}</p>}
        </div>
      </div>

      <div className="relative z-10 space-y-4">{children}</div>
    </motion.div>
  );
}

function FieldRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{label}</p>
        {description && <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function NumInput({
  value, onChange, prefix, suffix, min = 0, max = 99999, step = 0.1, color = '#7C3AED',
}: {
  value: number; onChange: (v: number) => void; prefix?: string; suffix?: string;
  min?: number; max?: number; step?: number; color?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex items-center rounded-xl overflow-hidden transition-all duration-200 w-36"
         style={{
           background: focused ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
           border:     `1px solid ${focused ? color + '50' : 'rgba(255,255,255,0.08)'}`,
           boxShadow:  focused ? `0 0 0 2px ${color}15` : 'none',
         }}>
      {prefix && (
        <span className="px-2 py-2 font-heading font-semibold flex-shrink-0"
              style={{ fontSize: '12px', color, background: `${color}0E`, borderRight: `1px solid ${color}18` }}>
          {prefix}
        </span>
      )}
      <input
        type="number" value={value} min={min} max={max} step={step}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v))); }}
        className="flex-1 bg-transparent outline-none px-2.5 py-2 font-heading font-semibold text-white"
        style={{ fontSize: '13px', minWidth: 0 }}
      />
      {suffix && (
        <span className="px-2 py-2 font-heading font-semibold flex-shrink-0"
              style={{ fontSize: '12px', color, background: `${color}0E`, borderLeft: `1px solid ${color}18` }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

function Toggle({ enabled, onChange, color = '#7C3AED' }: { enabled: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button type="button" onClick={() => onChange(!enabled)}
      className="relative rounded-full flex-shrink-0 transition-all duration-300 focus:outline-none"
      style={{
        width: '44px', height: '24px',
        background: enabled ? `linear-gradient(135deg, ${color}, ${color}CC)` : 'rgba(255,255,255,0.06)',
        border:     `1px solid ${enabled ? color + '60' : 'rgba(255,255,255,0.1)'}`,
        boxShadow:  enabled ? `0 0 12px ${color}40` : 'none',
      }}>
      <motion.div
        animate={{ x: enabled ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute rounded-full"
        style={{ width: '18px', height: '18px', top: '2px', left: '3px',
          background: enabled ? '#fff' : 'rgba(255,255,255,0.3)',
          boxShadow: enabled ? '0 2px 6px rgba(0,0,0,0.3)' : 'none' }}
      />
    </button>
  );
}

function RoundSelect<T extends string>({
  value, options, onChange, color,
}: { value: T; options: { value: T; label: string; example: string }[]; onChange: (v: T) => void; color: string }) {
  const [open, setOpen] = useState(false);
  const cur = options.find(o => o.value === value)!;
  return (
    <div className="relative w-44">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between rounded-xl px-3 py-2 transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border:     `1px solid ${open ? color + '40' : 'rgba(255,255,255,0.08)'}`,
        }}>
        <div className="text-left">
          <p className="font-heading font-semibold text-white" style={{ fontSize: '12px' }}>{cur.label}</p>
          <p className="font-body text-[#374151]" style={{ fontSize: '9.5px' }}>{cur.example}</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown style={{ width: '13px', height: '13px', color: '#4B5563' }} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.94 }}
            animate={{ opacity: 1, y: 0,  scaleY: 1 }}
            exit={{ opacity: 0,   y: -6,  scaleY: 0.94 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl overflow-hidden"
            style={{ background: '#0F0F1E', border: `1px solid ${color}22`, boxShadow: '0 12px 32px rgba(0,0,0,0.5)', transformOrigin: 'top' }}>
            {options.map(opt => (
              <button
                key={opt.value} type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors"
                style={{ background: opt.value === value ? `${color}10` : 'transparent' }}
                onMouseEnter={e => { if (opt.value !== value) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { if (opt.value !== value) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <div>
                  <p className="font-heading font-semibold text-white" style={{ fontSize: '12px' }}>{opt.label}</p>
                  <p className="font-body text-[#374151]" style={{ fontSize: '9.5px' }}>{opt.example}</p>
                </div>
                {opt.value === value && <Check style={{ width: '12px', height: '12px', color }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SmartPricingPage() {
  const { t } = useT();
  const [settings,        setSettings]        = useState<PriceSettings | null>(null);
  const [currency,        setCurrency]        = useState<CurrencySettings | null>(null);
  const [activeStrategy,  setActiveStrategy]  = useState<PricingStrategy>('GLOBAL');
  const [dirty,           setDirty]           = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [resetting,       setResetting]       = useState(false);
  const [toasts,          setToasts]          = useState<Toast[]>([]);

  const toast = useCallback((type: Toast['type'], msg: string) => {
    const id = ++_tid;
    setToasts(p => [...p, { id, type, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/pricing/settings').then(r => r.json()),
      fetch('/api/admin/pricing/currency').then(r => r.json()),
    ]).then(([s, c]) => {
      if (s.success) {
        setSettings(s.data);
        if (s.data?.defaultStrategy) setActiveStrategy(s.data.defaultStrategy);
      }
      if (c.success) setCurrency(c.data);
    }).catch(() => toast('error', t.common.loadFailed));
  }, [toast]);

  const patchSettings = <K extends keyof PriceSettings>(k: K, v: PriceSettings[K]) => {
    setSettings(prev => prev ? { ...prev, [k]: v } : prev);
    setDirty(true);
  };
  const patchCurrency = <K extends keyof CurrencySettings>(k: K, v: CurrencySettings[K]) => {
    setCurrency(prev => prev ? { ...prev, [k]: v } : prev);
    setDirty(true);
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!settings || !currency || !dirty) return;
    setSaving(true);
    try {
      const [sr, cr] = await Promise.all([
        fetch('/api/admin/pricing/settings', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
        }).then(r => r.json()),
        fetch('/api/admin/pricing/currency', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currency),
        }).then(r => r.json()),
      ]);
      if (!sr.success) throw new Error(sr.error);
      if (!cr.success) throw new Error(cr.error);
      setDirty(false);
      toast('success', t.common.settingsSaved);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/admin/pricing/settings', { method: 'PUT' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSettings(json.data);
      setDirty(false);
      toast('success', t.common.resetDone);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  if (!settings || !currency) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
          <RefreshCw style={{ width: '20px', height: '20px', color: '#7C3AED' }} />
        </motion.div>
      </div>
    );
  }

  const USD_ROUND_OPTIONS: { value: UsdRoundType; label: string; example: string }[] = [
    { value: 'POINT_99', label: t.smartPricing.usdPoint99,      example: '17.12 → 16.99' },
    { value: 'POINT_49', label: t.smartPricing.usdPoint49,      example: '17.12 → 16.49' },
    { value: 'INTEGER',  label: t.smartPricing.usdInteger,      example: '17.12 → 17'    },
  ];

  const UZS_ROUND_OPTIONS: { value: UzsRoundType; label: string; example: string }[] = [
    { value: 'NEAREST_1000',  label: t.smartPricing.uzsNearest1000,  example: '187 234 → 187 000' },
    { value: 'NEAREST_9000',  label: t.smartPricing.uzsNearest9000,  example: '187 234 → 189 000' },
    { value: 'NEAREST_99000', label: t.smartPricing.uzsNearest99000, example: '212 455 → 299 000' },
  ];

  return (
    <>
      <div className="p-6 space-y-6">
        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#22C55E', letterSpacing: '0.14em' }}>
              ARCANE.UZ ADMIN
            </p>
            <h1 className="font-heading font-bold text-white" style={{ fontSize: '24px' }}>{t.smartPricing.title}</h1>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '13px' }}>
              {t.smartPricing.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/admin/smart-pricing/games"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-body transition-all duration-200"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: '#9D60FA', fontSize: '13px' }}
            >
              <Gamepad2 style={{ width: '14px', height: '14px' }} />
              {t.smartPricing.perGamePricing}
            </Link>

            <AnimatePresence>
              {dirty && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-body text-amber-400" style={{ fontSize: '12px' }}>{t.common.unsaved}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={handleReset} disabled={resetting}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-body transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280', fontSize: '13px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6B7280'; }}>
              <motion.div animate={{ rotate: resetting ? 360 : 0 }} transition={{ duration: 0.8, repeat: resetting ? Infinity : 0, ease: 'linear' }}>
                <RotateCcw style={{ width: '13px', height: '13px' }} />
              </motion.div>
              {t.common.reset}
            </button>

            <motion.button onClick={handleSave} disabled={saving || !dirty}
              whileHover={dirty ? { scale: 1.03 } : {}} whileTap={dirty ? { scale: 0.97 } : {}}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-heading font-semibold transition-all duration-200"
              style={{
                background: dirty ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : 'rgba(255,255,255,0.04)',
                border:     `1px solid ${dirty ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.06)'}`,
                color:      dirty ? '#fff' : '#374151', fontSize: '13px',
                boxShadow:  dirty ? '0 0 20px rgba(124,58,237,0.35)' : 'none',
                cursor:     dirty ? 'pointer' : 'not-allowed',
              }}>
              {saving
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}><RefreshCw style={{ width: '13px', height: '13px' }} /></motion.div>
                : <Save style={{ width: '13px', height: '13px' }} />}
              {saving ? t.common.saving : t.common.saveAll}
            </motion.button>
          </div>
        </motion.div>

        {/* ── 2-column layout ── */}
        <div className="grid xl:grid-cols-[1fr_400px] gap-5 items-start">
          <div className="space-y-5">

            {/* ── Strategy Overview ── */}
            <SectionCard title={t.smartPricing.strategies} subtitle={t.smartPricing.stratSubtitle}
              icon={Activity} color="#7C3AED" delay={0.05}>
              <StrategySelector
                value={activeStrategy}
                onChange={s => { setActiveStrategy(s); patchSettings('defaultStrategy', s); }}
              />

              <AnimatePresence mode="wait">
                {activeStrategy === 'GLOBAL' && (
                  <motion.div key="GLOBAL"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
                    className="rounded-xl p-4 space-y-3"
                    style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.14)' }}>
                    <p className="font-pixel text-[#7C3AED]" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>
                      {t.smartPricing.globalMarkup.toUpperCase()}
                    </p>
                    <div>
                      <p className="font-body text-[#6B7280] mb-1.5" style={{ fontSize: '10.5px' }}>{t.smartPricing.globalMarkup} %</p>
                      <NumInput value={settings.globalMarkupPercent}
                        onChange={v => patchSettings('globalMarkupPercent', v)}
                        suffix="%" color="#7C3AED" min={0} max={200} />
                    </div>
                    <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>
                      {t.smartPricing.globalMarkupDesc}
                    </p>
                  </motion.div>
                )}

                {activeStrategy === 'AGGRESSIVE' && (
                  <motion.div key="AGGRESSIVE"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.14)' }}>
                    <p className="font-pixel text-[#06B6D4] mb-3" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>
                      {t.smartPricing.aggressiveLabel.toUpperCase()}
                    </p>
                    <p className="font-body text-[#6B7280] mb-1.5" style={{ fontSize: '10.5px' }}>{t.smartPricing.aggressiveLabel} %</p>
                    <NumInput value={settings.aggressiveMarkupPercent}
                      onChange={v => patchSettings('aggressiveMarkupPercent', v)}
                      suffix="%" color="#06B6D4" min={0} max={200} />
                  </motion.div>
                )}

                {activeStrategy === 'COMPETITIVE' && (
                  <motion.div key="COMPETITIVE"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.14)' }}>
                    <p className="font-pixel text-[#22C55E] mb-3" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>
                      {t.smartPricing.competitiveLabel.toUpperCase()}
                    </p>
                    <p className="font-body text-[#6B7280] mb-1.5" style={{ fontSize: '10.5px' }}>{t.smartPricing.competitiveLabel} %</p>
                    <NumInput value={settings.competitiveMarkupPercent}
                      onChange={v => patchSettings('competitiveMarkupPercent', v)}
                      suffix="%" color="#22C55E" min={0} max={200} />
                  </motion.div>
                )}

                {activeStrategy === 'HIGH_PROFIT' && (
                  <motion.div key="HIGH_PROFIT"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.14)' }}>
                    <p className="font-pixel text-[#F59E0B] mb-3" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>
                      {t.smartPricing.highProfitLabel.toUpperCase()}
                    </p>
                    <p className="font-body text-[#6B7280] mb-1.5" style={{ fontSize: '10.5px' }}>{t.smartPricing.highProfitLabel} %</p>
                    <NumInput value={settings.highProfitMarkupPercent}
                      onChange={v => patchSettings('highProfitMarkupPercent', v)}
                      suffix="%" color="#F59E0B" min={0} max={200} />
                  </motion.div>
                )}

                {activeStrategy === 'MANUAL' && (
                  <motion.div key="MANUAL"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
                    className="rounded-xl p-4 space-y-3"
                    style={{ background: 'rgba(107,114,128,0.06)', border: '1px solid rgba(107,114,128,0.14)' }}>
                    <p className="font-pixel text-[#6B7280]" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>
                      {t.strategies.manualFull.toUpperCase()}
                    </p>
                    <p className="font-body text-[#9CA3AF]" style={{ fontSize: '12px', lineHeight: '1.6' }}>
                      {t.smartPricing.manualNote}
                    </p>
                    <Link href="/admin/smart-pricing/games"
                      className="inline-flex items-center gap-1.5 font-body transition-colors"
                      style={{ fontSize: '12px', color: '#7C3AED' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#9D60FA'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7C3AED'; }}>
                      <ChevronsRight style={{ width: '13px', height: '13px' }} />
                      {t.smartPricing.manualLink}
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </SectionCard>

            {/* ── Global Rules ── */}
            <SectionCard title={t.smartPricing.globalRules} subtitle={t.smartPricing.globalRulesSub}
              icon={Globe} color="#06B6D4" delay={0.1}>

              <FieldRow label={`${t.smartPricing.globalMarkup} %`} description={t.smartPricing.globalMarkupDesc}>
                <NumInput value={settings.globalMarkupPercent} onChange={v => patchSettings('globalMarkupPercent', v)}
                  suffix="%" color="#06B6D4" />
              </FieldRow>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl p-4 space-y-3"
                     style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.1)' }}>
                  <p className="font-pixel text-[#06B6D4]" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>{t.smartPricing.cheapSection.toUpperCase()}</p>
                  <div className="space-y-2">
                    <div>
                      <p className="font-body text-[#6B7280] mb-1" style={{ fontSize: '10.5px' }}>{t.smartPricing.cheapThresholdLbl}</p>
                      <NumInput value={settings.cheapGamesThreshold} onChange={v => patchSettings('cheapGamesThreshold', v)}
                        prefix="$" color="#06B6D4" />
                    </div>
                    <div>
                      <p className="font-body text-[#6B7280] mb-1" style={{ fontSize: '10.5px' }}>{t.smartPricing.cheapFixedLbl}</p>
                      <NumInput value={settings.cheapGamesFixedMarkup} onChange={v => patchSettings('cheapGamesFixedMarkup', v)}
                        prefix="+$" color="#06B6D4" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl p-4 space-y-3"
                     style={{ background: 'rgba(157,96,250,0.05)', border: '1px solid rgba(157,96,250,0.1)' }}>
                  <p className="font-pixel text-[#9D60FA]" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>{t.smartPricing.expensiveSection.toUpperCase()}</p>
                  <div>
                    <p className="font-body text-[#6B7280] mb-1" style={{ fontSize: '10.5px' }}>
                      {`${t.smartPricing.expPercentLbl} (≥ $${settings.cheapGamesThreshold})`}
                    </p>
                    <NumInput value={settings.expensiveGamesPercentMarkup}
                      onChange={v => patchSettings('expensiveGamesPercentMarkup', v)}
                      suffix="%" color="#9D60FA" />
                  </div>
                  <div>
                    <p className="font-body text-[#6B7280] mb-1" style={{ fontSize: '10.5px' }}>{t.smartPricing.minProfitLbl}</p>
                    <NumInput value={settings.minimumProfitUsd} onChange={v => patchSettings('minimumProfitUsd', v)}
                      prefix="$" color="#9D60FA" />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── Smart Rounding ── */}
            <SectionCard title={t.smartPricing.rounding} subtitle={t.smartPricing.roundingDesc}
              icon={Zap} color="#F59E0B" delay={0.15}>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{t.smartPricing.roundingUsd}</p>
                      <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>
                        {settings.autoRoundUsd ? usdRoundLabel(settings.usdRoundType) : t.smartPricing.roundDisabled}
                      </p>
                    </div>
                    <Toggle enabled={settings.autoRoundUsd} onChange={v => patchSettings('autoRoundUsd', v)} color="#F59E0B" />
                  </div>
                  <AnimatePresence>
                    {settings.autoRoundUsd && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                        <RoundSelect
                          value={settings.usdRoundType} options={USD_ROUND_OPTIONS}
                          onChange={v => patchSettings('usdRoundType', v)} color="#F59E0B"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{t.smartPricing.roundingUzs}</p>
                      <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>
                        {settings.autoRoundUzs ? uzsRoundLabel(settings.uzsRoundType) : t.smartPricing.roundDisabled}
                      </p>
                    </div>
                    <Toggle enabled={settings.autoRoundUzs} onChange={v => patchSettings('autoRoundUzs', v)} color="#F59E0B" />
                  </div>
                  <AnimatePresence>
                    {settings.autoRoundUzs && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                        <RoundSelect
                          value={settings.uzsRoundType} options={UZS_ROUND_OPTIONS}
                          onChange={v => patchSettings('uzsRoundType', v)} color="#F59E0B"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Rounding examples */}
              <div className="rounded-xl p-3 mt-1"
                   style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' }}>
                <p className="font-body text-[#374151] mb-2" style={{ fontSize: '10px' }}>{t.smartPricing.roundExamples}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[17.12, 29.99, 59.49].map(raw => {
                    const usd = settings.autoRoundUsd ? roundUsd(raw, settings.usdRoundType) : raw;
                    const uzs = settings.autoRoundUzs ? roundUzs(usd * currency.exchangeRate, settings.uzsRoundType) : usd * currency.exchangeRate;
                    return (
                      <div key={raw} className="rounded-lg p-2 text-center"
                           style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <p className="font-body text-[#374151]" style={{ fontSize: '9px' }}>${raw}</p>
                        <p className="font-heading font-semibold text-[#F59E0B]" style={{ fontSize: '12px' }}>
                          ${usd.toFixed(2)}
                        </p>
                        <p className="font-body text-[#374151]" style={{ fontSize: '8.5px' }}>
                          {Math.round(uzs).toLocaleString('ru')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionCard>

            {/* ── Currency ── */}
            <SectionCard title={t.smartPricing.currency} subtitle={t.smartPricing.currencySub}
              icon={Coins} color="#22C55E" delay={0.2}>
              <FieldRow label={`${t.smartPricing.exchangeRate} (USD → UZS)`} description="finalUZS = finalUSD × rate">
                <NumInput value={currency.exchangeRate} onChange={v => patchCurrency('exchangeRate', v)}
                  suffix="сум" min={1} max={999999} step={100} color="#22C55E" />
              </FieldRow>
              <FieldRow label={t.smartPricing.autoUpdateRate} description={t.smartPricing.autoRateDesc}>
                <Toggle enabled={currency.autoUpdateRate} onChange={v => patchCurrency('autoUpdateRate', v)} color="#22C55E" />
              </FieldRow>

              <div className="rounded-xl p-3 mt-1"
                   style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)' }}>
                <div className="grid grid-cols-3 gap-3">
                  {[10, 30, 60].map(usd => {
                    const uzs = Math.round(usd * currency.exchangeRate);
                    return (
                      <div key={usd} className="text-center">
                        <p className="font-body text-[#374151]" style={{ fontSize: '10px' }}>${usd} USD</p>
                        <ChevronsRight style={{ width: '12px', height: '12px', color: '#22C55E', margin: '2px auto' }} />
                        <p className="font-heading font-semibold text-[#22C55E]" style={{ fontSize: '12px' }}>
                          {uzs.toLocaleString('ru')} сум
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>
                {t.smartPricing.lastUpdated}: {new Date(currency.lastUpdated).toLocaleString('ru')}
              </p>
            </SectionCard>

            {/* ── Steam Compare ── */}
            <SectionCard title={t.smartPricing.steamCompare} subtitle={t.smartPricing.steamCompareSub}
              icon={BarChart2} color="#66C0F4" delay={0.25}>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(102,192,244,0.15)' }}>
                <div className="px-4 py-3" style={{ background: 'rgba(102,192,244,0.06)', borderBottom: '1px solid rgba(102,192,244,0.1)' }}>
                  <p className="font-pixel text-[#66C0F4]" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>{t.smartPricing.exampleDisplay}</p>
                </div>
                <div className="px-4 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-[#6B7280]" style={{ fontSize: '12px' }}>{t.smartPricing.steamPrice}</span>
                    <span className="font-heading font-semibold text-[#6B7280] line-through" style={{ fontSize: '14px' }}>$59.99</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-white" style={{ fontSize: '13px' }}>{t.smartPricing.yourPrice}</span>
                    <span className="font-heading font-bold text-white" style={{ fontSize: '20px', textShadow: '0 0 16px rgba(124,58,237,0.5)' }}>$41.99</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl px-3 py-2"
                       style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <span className="font-body text-[#22C55E]" style={{ fontSize: '12px' }}>{t.smartPricing.youSave}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-[#22C55E]" style={{ fontSize: '14px' }}>$18.00</span>
                      <span className="font-pixel text-white rounded px-2 py-0.5"
                            style={{ fontSize: '8px', background: '#22C55E', letterSpacing: '0.04em' }}>
                        30% OFF
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
                {t.smartPricing.steamPriceNote}
              </p>
            </SectionCard>

            {/* ── Summary bar ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="rounded-2xl p-4"
              style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Shield style={{ width: '13px', height: '13px', color: '#7C3AED' }} />
                <span className="font-heading font-semibold text-white" style={{ fontSize: '12px' }}>{t.smartPricing.engineConfig}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: t.smartPricing.globalMarkupStat,  value: `${settings.globalMarkupPercent}%`,       color: '#7C3AED' },
                  { label: t.smartPricing.cheapSection,      value: `${settings.cheapGamesThreshold}+ = %`,   color: '#06B6D4' },
                  { label: t.smartPricing.usdRoundStat,      value: settings.autoRoundUsd ? usdRoundLabel(settings.usdRoundType) : t.common.off, color: '#F59E0B' },
                  { label: t.smartPricing.rateStat,          value: `${currency.exchangeRate.toLocaleString('ru')} sum`, color: '#22C55E' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl px-3 py-2.5 text-center"
                       style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                    <p className="font-heading font-bold" style={{ fontSize: '13px', color: s.color }}>{s.value}</p>
                    <p className="font-body text-[#374151]" style={{ fontSize: '9.5px', marginTop: '2px' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

          {/* Right: sticky live calculator */}
          <div className="xl:sticky xl:top-6">
            <LivePreviewCalculator />
          </div>
        </div>
      </div>

      <Toasts list={toasts} dismiss={id => setToasts(p => p.filter(t => t.id !== id))} />
    </>
  );
}
