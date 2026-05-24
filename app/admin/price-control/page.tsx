'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Coins, Repeat2, RotateCcw, Save,
  Globe, Layers, RotateCw, ShieldCheck, RefreshCw, Check, X,
} from 'lucide-react';

import PriceSettingsCard      from '@/components/admin/price-control/PriceSettingsCard';
import PricePreviewCalculator from '@/components/admin/price-control/PricePreviewCalculator';
import MarkupInput            from '@/components/admin/price-control/MarkupInput';
import RoundTypeSelect        from '@/components/admin/price-control/RoundTypeSelect';
import ToggleSwitch           from '@/components/admin/price-control/ToggleSwitch';
import type { PriceSettings } from '@/app/api/admin/price-settings/route';
import { useT } from '@/lib/i18n';

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; type: 'success' | 'error'; message: string }

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 pointer-events-auto cursor-pointer"
            style={{
              background:  t.type === 'success' ? 'rgba(34,197,94,0.12)'  : 'rgba(239,68,68,0.12)',
              border:      `1px solid ${t.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              boxShadow:   '0 8px 32px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(12px)',
              minWidth:    '260px',
            }}
            onClick={() => onDismiss(t.id)}
          >
            {t.type === 'success'
              ? <Check style={{ width: '15px', height: '15px', color: '#22C55E', flexShrink: 0 }} />
              : <X     style={{ width: '15px', height: '15px', color: '#EF4444', flexShrink: 0 }} />}
            <span className="font-body text-white flex-1" style={{ fontSize: '13px' }}>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PriceControlPage() {
  const { t } = useT();
  const [settings, setSettings]   = useState<PriceSettings | null>(null);
  const [dirty, setDirty]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toasts, setToasts]       = useState<Toast[]>([]);
  let   toastId                   = 0;

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, [toastId]);

  const dismissToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/price-settings')
      .then(r => r.json())
      .then(j => setSettings(j.data))
      .catch(() => addToast('error', t.common.loadFailed));
  }, [addToast]);

  const update = <K extends keyof PriceSettings>(key: K, value: PriceSettings[K]) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);
    setDirty(true);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!settings || !dirty) return;
    setSaving(true);
    try {
      const res  = await fetch('/api/admin/price-settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(settings),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSettings(json.data);
      setDirty(false);
      addToast('success', t.common.settingsSaved);
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = async () => {
    setResetting(true);
    try {
      const res  = await fetch('/api/admin/price-settings', { method: 'PUT' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSettings(json.data);
      setDirty(false);
      addToast('success', t.common.resetDone);
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Failed to reset');
    } finally {
      setResetting(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw style={{ width: '20px', height: '20px', color: '#7C3AED' }} />
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#22C55E', letterSpacing: '0.14em' }}>
              ARCANE.UZ ADMIN
            </p>
            <h1 className="font-heading font-bold text-white" style={{ fontSize: '24px' }}>
              {t.priceControl.title}
            </h1>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '13px' }}>
              {t.priceControl.subtitleDesc}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Unsaved indicator */}
            <AnimatePresence>
              {dirty && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-body text-amber-400" style={{ fontSize: '12px' }}>{t.priceControl.unsavedChanges}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reset */}
            <button
              onClick={handleReset}
              disabled={resetting}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-body transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border:     '1px solid rgba(255,255,255,0.08)',
                color:      '#6B7280',
                fontSize:   '13px',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6B7280'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              <motion.div animate={{ rotate: resetting ? 360 : 0 }} transition={{ duration: 0.8, repeat: resetting ? Infinity : 0, ease: 'linear' }}>
                <RotateCcw style={{ width: '13px', height: '13px' }} />
              </motion.div>
              {t.common.reset}
            </button>

            {/* Save */}
            <motion.button
              onClick={handleSave}
              disabled={saving || !dirty}
              whileHover={dirty ? { scale: 1.03 } : {}}
              whileTap={dirty  ? { scale: 0.97 } : {}}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-heading font-semibold transition-all duration-200"
              style={{
                background:  dirty ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : 'rgba(255,255,255,0.04)',
                border:      `1px solid ${dirty ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.06)'}`,
                color:       dirty ? '#fff' : '#374151',
                fontSize:    '13px',
                boxShadow:   dirty ? '0 0 20px rgba(124,58,237,0.35)' : 'none',
                cursor:      dirty ? 'pointer' : 'not-allowed',
              }}
            >
              {saving
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}><RefreshCw style={{ width: '13px', height: '13px' }} /></motion.div>
                : <Save style={{ width: '13px', height: '13px' }} />}
              {saving ? t.common.saving : t.priceControl.saveChanges}
            </motion.button>
          </div>
        </motion.div>

        {/* ── Layout: Settings + Calculator ── */}
        <div className="grid xl:grid-cols-[1fr_340px] gap-5 items-start">

          {/* Left: Settings cards */}
          <div className="space-y-4">

            {/* 1. Global Markup */}
            <PriceSettingsCard
              title={t.priceControl.globalMarkup}
              description={t.priceControl.globalMarkupDesc}
              icon={Globe}
              color="#7C3AED"
              delay={0.05}
            >
              <MarkupInput
                label={`${t.priceControl.globalMarkup} %`}
                value={settings.globalMarkupPercent}
                onChange={v => update('globalMarkupPercent', v)}
                suffix="%"
                min={0}
                max={100}
                step={0.5}
                description={t.priceControl.globalMarkupDesc}
                color="#7C3AED"
              />
            </PriceSettingsCard>

            {/* 2. Cheap + Expensive rules */}
            <PriceSettingsCard
              title={t.priceControl.gameRules}
              description={t.priceControl.gameRulesDesc}
              icon={Layers}
              color="#06B6D4"
              delay={0.1}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Cheap */}
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#06B6D4', boxShadow: '0 0 4px #06B6D4' }} />
                    <span className="font-pixel text-[#06B6D4]" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>{t.priceControl.cheapGames.toUpperCase()}</span>
                  </div>
                  <MarkupInput
                    label={t.priceControl.cheapThreshold}
                    value={settings.cheapGameThreshold}
                    onChange={v => update('cheapGameThreshold', v)}
                    prefix="$"
                    step={1}
                    description={t.priceControl.cheapThresholdDesc}
                    color="#06B6D4"
                  />
                  <MarkupInput
                    label={t.priceControl.cheapMarkup}
                    value={settings.fixedMarkupForCheap}
                    onChange={v => update('fixedMarkupForCheap', v)}
                    prefix="+$"
                    step={0.5}
                    color="#06B6D4"
                  />
                </div>

                {/* Expensive */}
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{ background: 'rgba(157,96,250,0.06)', border: '1px solid rgba(157,96,250,0.12)' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#9D60FA', boxShadow: '0 0 4px #9D60FA' }} />
                    <span className="font-pixel text-[#9D60FA]" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>{t.priceControl.expensiveGames.toUpperCase()}</span>
                  </div>
                  <MarkupInput
                    label={`${t.priceControl.expMarkup} (≥ $${settings.cheapGameThreshold})`}
                    value={settings.expensiveGamePercentMarkup}
                    onChange={v => update('expensiveGamePercentMarkup', v)}
                    suffix="%"
                    step={0.5}
                    description={t.priceControl.expMarkupDesc}
                    color="#9D60FA"
                  />
                </div>
              </div>
            </PriceSettingsCard>

            {/* 3. Auto Round */}
            <PriceSettingsCard
              title={t.priceControl.autoRoundFull}
              description={t.priceControl.autoRoundFullDesc}
              icon={RotateCw}
              color="#F59E0B"
              delay={0.15}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body text-[#9CA3AF]" style={{ fontSize: '13px' }}>{t.priceControl.enableAutoRound}</p>
                  <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
                    {settings.autoRoundEnabled ? `${t.priceControl.autoRoundOn} ${settings.roundType}` : t.priceControl.autoRoundOff}
                  </p>
                </div>
                <ToggleSwitch
                  enabled={settings.autoRoundEnabled}
                  onChange={v => update('autoRoundEnabled', v)}
                  color="#F59E0B"
                />
              </div>

              <AnimatePresence>
                {settings.autoRoundEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <RoundTypeSelect
                      value={settings.roundType}
                      onChange={v => update('roundType', v)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </PriceSettingsCard>

            {/* 4. Minimum Profit + Auto Update — side by side */}
            <div className="grid sm:grid-cols-2 gap-4">
              <PriceSettingsCard
                title={t.priceControl.minProfitFull}
                description={t.priceControl.minProfitDesc}
                icon={Coins}
                color="#22C55E"
                delay={0.2}
              >
                <MarkupInput
                  label={t.priceControl.minProfit}
                  value={settings.minimumProfitUsd}
                  onChange={v => update('minimumProfitUsd', v)}
                  prefix="$"
                  step={0.5}
                  description={t.priceControl.minProfitDesc2}
                  color="#22C55E"
                />
              </PriceSettingsCard>

              <PriceSettingsCard
                title={t.priceControl.autoUpdateFull}
                description={t.priceControl.autoUpdateDesc}
                icon={Repeat2}
                color="#9D60FA"
                delay={0.25}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-[#9CA3AF]" style={{ fontSize: '13px' }}>{t.priceControl.autoRecalcLabel}</p>
                    <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
                      {settings.autoUpdateEnabled ? t.priceControl.runsHourly : t.priceControl.manualOnly}
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.autoUpdateEnabled}
                    onChange={v => update('autoUpdateEnabled', v)}
                    color="#9D60FA"
                  />
                </div>

                <div
                  className="rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck style={{ width: '11px', height: '11px', color: settings.autoUpdateEnabled ? '#22C55E' : '#374151' }} />
                    <span className="font-pixel" style={{ fontSize: '7px', color: settings.autoUpdateEnabled ? '#22C55E' : '#374151', letterSpacing: '0.08em' }}>
                      {settings.autoUpdateEnabled ? t.priceControl.cronActive : t.priceControl.cronPaused}
                    </span>
                  </div>
                  <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>
                    {t.priceControl.cronLabel}: <code className="text-[#4B5563]">0 * * * *</code>
                  </p>
                </div>
              </PriceSettingsCard>
            </div>

            {/* ── Summary row ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl p-4"
              style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp style={{ width: '13px', height: '13px', color: '#7C3AED' }} />
                <span className="font-heading font-semibold text-white" style={{ fontSize: '12px' }}>{t.priceControl.activeRules}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: t.priceControl.globalMarkup,       value: `${settings.globalMarkupPercent}%`,      color: '#7C3AED' },
                  { label: t.priceControl.cheapThresholdStat, value: `< $${settings.cheapGameThreshold}`,      color: '#06B6D4' },
                  { label: t.priceControl.cheapMarkupStat,    value: `+$${settings.fixedMarkupForCheap}`,      color: '#06B6D4' },
                  { label: t.priceControl.expMarkupStat,      value: `${settings.expensiveGamePercentMarkup}%`, color: '#9D60FA' },
                ].map(s => (
                  <div key={s.label}
                    className="rounded-xl px-3 py-2.5 text-center"
                    style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}
                  >
                    <p className="font-heading font-bold" style={{ fontSize: '15px', color: s.color }}>{s.value}</p>
                    <p className="font-body text-[#374151]" style={{ fontSize: '10px', marginTop: '2px' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: sticky calculator */}
          <div className="xl:sticky xl:top-6">
            <PricePreviewCalculator settings={settings} />
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
