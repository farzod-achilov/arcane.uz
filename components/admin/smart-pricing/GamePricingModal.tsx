'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  X, DollarSign, Check, RefreshCw,
  ArrowRight, ExternalLink, Key, Gift, User,
} from 'lucide-react';
import type { PricingStrategy, SmartMarkupType, PriceCalculationResult } from '@/lib/smartPricing/types';
import { STRATEGY_META } from '@/lib/smartPricing/strategies';
import { useT } from '@/lib/i18n';

export interface GameItem {
  id:         string;
  title:      string;
  cover?:     string | null;
  genres?:    string[];
  platforms?: string[];
  priceUzs?:  number;
  priceUsd?:  number;
}

type ProductType = 'KEY' | 'GIFT' | 'ACCOUNT';

interface ExistingPricing {
  supplierPriceUsd?:      number | null;
  steamPriceUsd?:         number | null;
  steamDiscountPriceUsd?: number | null;
  finalPriceUsd?:         number | null;
  finalPriceUzs?:         number | null;
  youSavePercent?:        number | null;
  marginPercent?:         number | null;
  pricingStrategy?:       PricingStrategy;
  customPricingEnabled?:  boolean;
  customMarkupType?:      SmartMarkupType | null;
  customMarkupValue?:     number | null;
  customFinalPrice?:      number | null;
  notes?:                 string | null;
  productType?:           ProductType;
}

interface MarketOffer {
  source:   'kinguin' | 'eneba';
  priceUsd: number;
  name:     string;
  inStock:  boolean;
  url?:     string;
}

interface SteamResult {
  appId:        number;
  name:         string;
  priceUsd:     number | null;
  salePriceUsd: number | null;
  discountPct:  number;
  url:          string;
}

interface MarketPrices {
  kinguin: { configured: boolean; cheapest: MarketOffer | null };
  steam:   { result: SteamResult | null };
}

interface Props {
  game:    GameItem;
  onClose: () => void;
  onSaved: (gameId: string, pricing: ExistingPricing & { finalPriceUsd: number; finalPriceUzs: number }) => void;
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>{label}</label>
      {children}
    </div>
  );
}

function NumField({
  value, onChange, prefix, suffix, placeholder, min = 0, step = 0.01, color = '#7C3AED', readOnly,
}: {
  value: string; onChange: (v: string) => void;
  prefix?: string; suffix?: string; placeholder?: string;
  min?: number; step?: number; color?: string; readOnly?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="flex items-center rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: focused ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border:     `1px solid ${focused ? color + '55' : 'rgba(255,255,255,0.09)'}`,
        boxShadow:  focused ? `0 0 0 2px ${color}15` : 'none',
        opacity:    readOnly ? 0.6 : 1,
      }}
    >
      {prefix && (
        <span className="px-2.5 py-2.5 font-heading font-semibold flex-shrink-0"
              style={{ fontSize: '12px', color, background: `${color}0E`, borderRight: `1px solid ${color}18` }}>
          {prefix}
        </span>
      )}
      <input
        type="number" value={value} min={min} step={step} placeholder={placeholder}
        readOnly={readOnly}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onChange={e => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none px-2.5 py-2.5 font-heading font-semibold text-white"
        style={{ fontSize: '13px', minWidth: 0, cursor: readOnly ? 'default' : 'text' }}
      />
      {suffix && (
        <span className="px-2.5 font-body text-[#4B5563] flex-shrink-0" style={{ fontSize: '11px' }}>{suffix}</span>
      )}
    </div>
  );
}

function Toggle({ enabled, onChange, color = '#7C3AED', label }: { enabled: boolean; onChange: (v: boolean) => void; color?: string; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{label}</span>
      <button type="button" onClick={() => onChange(!enabled)}
        className="relative rounded-full flex-shrink-0 transition-all duration-300"
        style={{
          width: '40px', height: '22px',
          background: enabled ? `linear-gradient(135deg, ${color}, ${color}CC)` : 'rgba(255,255,255,0.06)',
          border: `1px solid ${enabled ? color + '55' : 'rgba(255,255,255,0.1)'}`,
          boxShadow: enabled ? `0 0 10px ${color}40` : 'none',
        }}>
        <motion.div
          animate={{ x: enabled ? 18 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute rounded-full"
          style={{ width: '16px', height: '16px', top: '2px', left: '3px',
            background: enabled ? '#fff' : 'rgba(255,255,255,0.3)' }}
        />
      </button>
    </div>
  );
}

// ─── Source chip (Kinguin / Eneba) ────────────────────────────────────────────

const SOURCE_META = {
  kinguin: { label: 'Kinguin', color: '#F97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
  eneba:   { label: 'Eneba',   color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
};

function SourceChip({
  source, offer, onApply, loading,
}: {
  source:  'kinguin' | 'eneba';
  offer:   MarketOffer | null;
  onApply: (price: number) => void;
  loading: boolean;
}) {
  const meta = SOURCE_META[source];

  return (
    <div
      className="flex items-center justify-between rounded-xl px-3 py-2.5"
      style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
    >
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.color }} />
        <span className="font-heading font-bold" style={{ fontSize: '11px', color: meta.color }}>{meta.label}</span>
        {loading && (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
            <RefreshCw style={{ width: '9px', height: '9px', color: meta.color }} />
          </motion.div>
        )}
      </div>

      {!loading && offer && (
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-white" style={{ fontSize: '12px' }}>
            ${offer.priceUsd.toFixed(2)}
          </span>
          {offer.url && (
            <a href={offer.url} target="_blank" rel="noopener noreferrer"
               className="opacity-40 hover:opacity-80 transition-opacity">
              <ExternalLink style={{ width: '10px', height: '10px', color: meta.color }} />
            </a>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => onApply(offer.priceUsd)}
            className="rounded-lg px-2 py-1 font-body transition-all duration-150"
            style={{ fontSize: '10px', background: meta.color + '25', color: meta.color, border: `1px solid ${meta.color}40` }}
          >
            Use
          </motion.button>
        </div>
      )}

      {!loading && !offer && (
        <span className="font-body text-[#2D3748]" style={{ fontSize: '10px' }}>No results</span>
      )}
    </div>
  );
}

const STRATEGIES: PricingStrategy[] = ['GLOBAL', 'AGGRESSIVE', 'COMPETITIVE', 'HIGH_PROFIT', 'MANUAL'];

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function GamePricingModal({ game, onClose, onSaved }: Props) {
  const { t } = useT();
  // Form state
  const [supplierPrice, setSupplierPrice]   = useState('');
  const [steamPrice,    setSteamPrice]      = useState('');
  const [steamDiscount, setSteamDiscount]   = useState('');
  const [strategy,      setStrategy]        = useState<PricingStrategy>('GLOBAL');
  const [customEnabled, setCustomEnabled]   = useState(false);
  const [customType,    setCustomType]      = useState<SmartMarkupType>('PERCENT');
  const [customValue,   setCustomValue]     = useState('');
  const [manualPrice,   setManualPrice]     = useState('');
  const [notes,         setNotes]           = useState('');
  const [productType,   setProductType]     = useState<ProductType>('KEY');

  // Market prices state
  const [market,       setMarket]       = useState<MarketPrices | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);

  // UI state
  const [preview,  setPreview]  = useState<PriceCalculationResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [initLoad, setInitLoad] = useState(true);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  // Load existing pricing
  useEffect(() => {
    fetch(`/api/admin/game/${game.id}/pricing`)
      .then(r => r.json())
      .then(j => {
        if (j.success && j.data) {
          const d = j.data as ExistingPricing;
          if (d.supplierPriceUsd)      setSupplierPrice(String(d.supplierPriceUsd));
          if (d.steamPriceUsd)         setSteamPrice(String(d.steamPriceUsd));
          if (d.steamDiscountPriceUsd) setSteamDiscount(String(d.steamDiscountPriceUsd));
          if (d.pricingStrategy)       setStrategy(d.pricingStrategy);
          if (d.customPricingEnabled)  setCustomEnabled(d.customPricingEnabled);
          if (d.customMarkupType)      setCustomType(d.customMarkupType);
          if (d.customMarkupValue)     setCustomValue(String(d.customMarkupValue));
          if (d.customFinalPrice)      setManualPrice(String(d.customFinalPrice));
          if (d.notes)                 setNotes(d.notes ?? '');
          if (d.productType)           setProductType(d.productType);
        }
      })
      .catch(() => {})
      .finally(() => setInitLoad(false));
  }, [game.id]);

  // Точная закупка Kinguin по связанному dropship-товару (мерчант-API).
  // Возвращает true, если цена подставлена — тогда fuzzy-поиск не нужен.
  const [kinguinCost, setKinguinCost] = useState<{ costUsd: number; inStock: boolean } | null>(null);
  const fetchKinguinCost = useCallback(async (): Promise<boolean> => {
    try {
      const res  = await fetch(`/api/admin/game/${game.id}/supplier-cost`);
      const json = await res.json();
      if (json.ok && json.costUsd) {
        setKinguinCost({ costUsd: json.costUsd, inStock: json.inStock });
        return true;
      }
    } catch { /* ignore */ }
    setKinguinCost(null);
    return false;
  }, [game.id]);

  // Auto-fetch market prices on open
  const fetchMarketPrices = useCallback(async () => {
    setMarketLoading(true);
    try {
      // 1) точная закупка Kinguin (dropship) — приоритетно
      const gotExact = await fetchKinguinCost();
      // 2) fuzzy-поиск по названию — для Steam-сравнения и не-dropship игр
      const res  = await fetch(`/api/admin/market-prices?title=${encodeURIComponent(game.title)}`);
      const json = await res.json();
      if (json.success) setMarket(json.sources);
      void gotExact;
    } catch {
      // ignore
    } finally {
      setMarketLoading(false);
    }
  }, [game.title, fetchKinguinCost]);

  useEffect(() => { fetchMarketPrices(); }, [fetchMarketPrices]);

  // Один раз подставить точную закупку Kinguin в пустое поле Supplier Price
  const kinguinAutoFilled = useRef(false);
  useEffect(() => {
    if (initLoad || kinguinAutoFilled.current) return;
    if (kinguinCost && (!supplierPrice || parseFloat(supplierPrice) <= 0)) {
      setSupplierPrice(kinguinCost.costUsd.toFixed(2));
      kinguinAutoFilled.current = true;
    }
  }, [kinguinCost, initLoad, supplierPrice]);

  // Live preview
  const fetchPreview = useCallback(async () => {
    const sp = parseFloat(supplierPrice);
    if (isNaN(sp) || sp <= 0) { setPreview(null); return; }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        supplierPriceUsd:     sp,
        steamPriceUsd:        parseFloat(steamPrice)    || undefined,
        strategy,
        customPricingEnabled: customEnabled,
      };
      if (customEnabled && strategy !== 'MANUAL') {
        body.customMarkupType  = customType;
        body.customMarkupValue = parseFloat(customValue) || undefined;
      }
      if (customEnabled && strategy === 'MANUAL') {
        body.customFinalPrice = parseFloat(manualPrice) || undefined;
      }

      const res  = await fetch('/api/admin/pricing/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) setPreview(json.data);
    } finally {
      setLoading(false);
    }
  }, [supplierPrice, steamPrice, strategy, customEnabled, customType, customValue, manualPrice]);

  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(fetchPreview, 300);
    return () => clearTimeout(debounce.current);
  }, [fetchPreview]);

  const handleSave = async () => {
    const sp = parseFloat(supplierPrice);
    if (isNaN(sp) || sp <= 0) return;

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        supplierPriceUsd:      sp,
        steamPriceUsd:         parseFloat(steamPrice)    || null,
        steamDiscountPriceUsd: parseFloat(steamDiscount) || null,
        pricingStrategy:       strategy,
        customPricingEnabled:  customEnabled,
        customMarkupType:      customEnabled && strategy !== 'MANUAL' ? customType : null,
        customMarkupValue:     customEnabled && strategy !== 'MANUAL' ? (parseFloat(customValue) || null) : null,
        customFinalPrice:      customEnabled && strategy === 'MANUAL' ? (parseFloat(manualPrice) || null) : null,
        notes:                 notes || null,
        productType,
      };

      const res  = await fetch(`/api/admin/game/${game.id}/pricing`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        onSaved(game.id, {
          ...body,
          finalPriceUsd: json.calculated?.finalPriceUsd ?? preview?.finalPriceUsd ?? 0,
          finalPriceUzs: json.calculated?.finalPriceUzs ?? preview?.finalPriceUzs ?? 0,
        } as ExistingPricing & { finalPriceUsd: number; finalPriceUzs: number });
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };


  const marginColor = !preview ? '#4B5563'
    : preview.marginPercent >= 15 ? '#22C55E'
    : preview.marginPercent >= 5  ? '#F59E0B' : '#EF4444';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: '#09090E', border: '1px solid rgba(124,58,237,0.25)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4"
             style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(6,182,212,0.07))', borderBottom: '1px solid rgba(124,58,237,0.15)', backdropFilter: 'blur(10px)' }}>
          <div className="relative w-10 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <Image src={game.cover ?? `https://picsum.photos/seed/${game.id}/400/600`}
                   alt="" fill unoptimized className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-pixel text-[#7C3AED]" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>{t.pricingModal.title}</p>
            <p className="font-heading font-bold text-white truncate" style={{ fontSize: '15px' }}>{game.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {game.genres?.slice(0, 2).map(g => (
                <span key={g} className="font-body text-[#374151]" style={{ fontSize: '10px' }}>{g}</span>
              ))}
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}>
            <X style={{ width: '13px', height: '13px', color: '#6B7280' }} />
          </button>
        </div>

        {initLoad ? (
          <div className="flex items-center justify-center py-16">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <RefreshCw style={{ width: '18px', height: '18px', color: '#7C3AED' }} />
            </motion.div>
          </div>
        ) : (
          <div className="p-5 grid md:grid-cols-[1fr_260px] gap-5">
            {/* ── Left: form ── */}
            <div className="space-y-4">

              {/* ── Supplier auto-fetch ── */}
              <div className="rounded-2xl p-4 space-y-3"
                   style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between">
                  <p className="font-pixel text-[#6B7280]" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>
                    {t.pricingModal.supplierAuto}
                  </p>
                  <button
                    onClick={fetchMarketPrices}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1 font-body transition-all duration-150"
                    style={{ fontSize: '10px', color: '#4B5563', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <motion.div animate={{ rotate: marketLoading ? 360 : 0 }} transition={{ duration: 0.8, repeat: marketLoading ? Infinity : 0, ease: 'linear' }}>
                      <RefreshCw style={{ width: '9px', height: '9px' }} />
                    </motion.div>
                    Refresh
                  </button>
                </div>

                {/* Точная закупка Kinguin (dropship-товар) — приоритет */}
                {kinguinCost ? (
                  <div className="flex items-center justify-between rounded-xl px-3 py-2.5"
                       style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-heading font-bold" style={{ fontSize: '12px', color: '#F59E0B' }}>Kinguin</span>
                      <span className="font-body" style={{ fontSize: '11px', color: kinguinCost.inStock ? '#22C55E' : '#EF4444' }}>
                        {kinguinCost.inStock ? 'в наличии' : 'нет офферов'}
                      </span>
                      <span className="font-heading font-bold text-white" style={{ fontSize: '13px' }}>
                        ${kinguinCost.costUsd.toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => setSupplierPrice(kinguinCost.costUsd.toFixed(2))}
                      className="rounded-lg px-2.5 py-1 font-body flex-shrink-0"
                      style={{ fontSize: '10px', color: '#F59E0B', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}
                    >
                      Применить
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Kinguin chip (fuzzy search fallback) */}
                    <SourceChip
                      source="kinguin"
                      offer={market?.kinguin.cheapest ?? null}
                      onApply={p => setSupplierPrice(p.toFixed(2))}
                      loading={marketLoading}
                    />

                    {/* API key not configured notice */}
                    {!marketLoading && !market?.kinguin.configured && (
                      <p className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
                        {t.pricingModal.addKinguin}
                      </p>
                    )}
                  </>
                )}


                {/* Manual supplier input */}
                <Field label="Supplier Price *">
                  <NumField value={supplierPrice} onChange={setSupplierPrice} prefix="$" placeholder="0.00" color="#7C3AED" />
                </Field>
              </div>

              {/* ── Steam prices ── */}
              <div className="rounded-2xl p-4 space-y-3"
                   style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-pixel text-[#6B7280]" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>{t.pricingModal.steamPrices}</p>

                {/* Steam auto-fetch chip */}
                {marketLoading ? (
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                       style={{ background: 'rgba(102,192,244,0.08)', border: '1px solid rgba(102,192,244,0.2)' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                      <RefreshCw style={{ width: '10px', height: '10px', color: '#66C0F4' }} />
                    </motion.div>
                    <span className="font-body text-[#66C0F4]" style={{ fontSize: '11px' }}>{t.pricingModal.searching}</span>
                  </div>
                ) : market?.steam.result ? (
                  <div className="rounded-xl overflow-hidden"
                       style={{ border: '1px solid rgba(102,192,244,0.25)' }}>
                    <div className="flex items-center justify-between px-3 py-2"
                         style={{ background: 'rgba(102,192,244,0.08)', borderBottom: '1px solid rgba(102,192,244,0.12)' }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#66C0F4' }} />
                        <span className="font-heading font-bold flex-shrink-0" style={{ fontSize: '11px', color: '#66C0F4' }}>Steam</span>
                        <span className="font-body text-[#6B7280] truncate" style={{ fontSize: '10px' }}>
                          {market.steam.result.name}
                        </span>
                      </div>
                      <a href={market.steam.result.url} target="_blank" rel="noopener noreferrer"
                         className="opacity-40 hover:opacity-80 transition-opacity">
                        <ExternalLink style={{ width: '10px', height: '10px', color: '#66C0F4' }} />
                      </a>
                    </div>
                    <div className="grid grid-cols-2 divide-x p-0"
                         style={{ borderColor: 'rgba(102,192,244,0.12)' }}>
                      {/* Base price */}
                      <div className="px-3 py-2.5">
                        <p className="font-body text-[#374151] mb-1" style={{ fontSize: '9px' }}>{t.pricingModal.basePrice}</p>
                        <p className="font-heading font-bold text-white" style={{ fontSize: '14px' }}>
                          {market.steam.result.priceUsd != null ? `$${market.steam.result.priceUsd.toFixed(2)}` : 'Free'}
                        </p>
                        {market.steam.result.priceUsd != null && (
                          <button
                            onClick={() => setSteamPrice(String(Math.round(market!.steam.result!.priceUsd! * 100) / 100))}
                            className="mt-1.5 rounded-lg px-2 py-0.5 font-body transition-all duration-150"
                            style={{ fontSize: '9px', color: '#66C0F4', background: 'rgba(102,192,244,0.12)', border: '1px solid rgba(102,192,244,0.25)' }}
                          >
                            Use
                          </button>
                        )}
                      </div>
                      {/* Sale price */}
                      <div className="px-3 py-2.5">
                        <p className="font-body text-[#374151] mb-1" style={{ fontSize: '9px' }}>
                          {t.pricingModal.salePrice} {market.steam.result.discountPct > 0 && (
                            <span style={{ color: '#22C55E' }}>-{market.steam.result.discountPct}%</span>
                          )}
                        </p>
                        {market.steam.result.salePriceUsd != null ? (
                          <>
                            <p className="font-heading font-bold text-[#22C55E]" style={{ fontSize: '14px' }}>
                              ${market.steam.result.salePriceUsd.toFixed(2)}
                            </p>
                            <button
                              onClick={() => setSteamDiscount(String(Math.round(market!.steam.result!.salePriceUsd! * 100) / 100))}
                              className="mt-1.5 rounded-lg px-2 py-0.5 font-body transition-all duration-150"
                              style={{ fontSize: '9px', color: '#22C55E', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}
                            >
                              Use
                            </button>
                          </>
                        ) : (
                          <p className="font-body text-[#2D3748]" style={{ fontSize: '11px' }}>{t.pricingModal.noSale}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                       style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="font-body text-[#2D3748]" style={{ fontSize: '11px' }}>{t.pricingModal.notOnSteam}</span>
                  </div>
                )}

                {/* Manual inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Steam Price">
                    <NumField value={steamPrice} onChange={setSteamPrice} prefix="$" placeholder="0.00" color="#66C0F4" />
                  </Field>
                  <Field label="Steam Sale Price">
                    <NumField value={steamDiscount} onChange={setSteamDiscount} prefix="$" placeholder="0.00" color="#22C55E" />
                  </Field>
                </div>
              </div>

              {/* ── Product type ── */}
              <div className="rounded-2xl p-4 space-y-3"
                   style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-pixel text-[#6B7280]" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>ТИП ВЫДАЧИ</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'KEY'    as ProductType, label: 'Ключ',    icon: Key,  color: '#22C55E', desc: 'Код активации Steam / GOG' },
                    { id: 'GIFT'   as ProductType, label: 'Подарок', icon: Gift, color: '#F59E0B', desc: 'Steam-подарок на аккаунт'   },
                    { id: 'ACCOUNT'as ProductType, label: 'Аккаунт', icon: User, color: '#06B6D4', desc: 'Аккаунт с игрой'            },
                  ] as const).map(opt => {
                    const active = productType === opt.id;
                    return (
                      <button key={opt.id} type="button" onClick={() => setProductType(opt.id)}
                        className="rounded-xl p-3 text-center transition-all duration-200 flex flex-col items-center gap-1.5"
                        style={{
                          background: active ? `${opt.color}12` : 'rgba(255,255,255,0.02)',
                          border:     `1px solid ${active ? opt.color + '40' : 'rgba(255,255,255,0.07)'}`,
                          boxShadow:  active ? `0 0 12px ${opt.color}15` : 'none',
                        }}>
                        <opt.icon style={{ width: '14px', height: '14px', color: active ? opt.color : '#4B5563' }} />
                        <p className="font-heading font-bold" style={{ fontSize: '11px', color: active ? opt.color : '#4B5563' }}>
                          {opt.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>
                  {productType === 'KEY'     && 'Покупатель получает код активации для ввода в Steam / GOG / другую платформу'}
                  {productType === 'GIFT'    && 'Товар отправляется как Steam-подарок напрямую на аккаунт покупателя'}
                  {productType === 'ACCOUNT' && 'Покупатель получает данные аккаунта с уже купленной игрой'}
                </p>
              </div>

              {/* ── Strategy ── */}
              <div className="rounded-2xl p-4 space-y-3"
                   style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-pixel text-[#6B7280]" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>{t.pricingModal.strategy}</p>
                <div className="grid grid-cols-5 gap-2">
                  {STRATEGIES.map(s => {
                    const m      = STRATEGY_META[s];
                    const active = strategy === s;
                    return (
                      <button key={s} type="button" onClick={() => setStrategy(s)}
                        className="rounded-xl p-2.5 text-center transition-all duration-200"
                        style={{
                          background: active ? `${m.color}15` : 'rgba(255,255,255,0.02)',
                          border:     `1px solid ${active ? m.color + '45' : 'rgba(255,255,255,0.07)'}`,
                          boxShadow:  active ? `0 0 12px ${m.color}18` : 'none',
                        }}>
                        <div className="w-1.5 h-1.5 rounded-full mx-auto mb-1.5"
                             style={{ background: m.color, boxShadow: active ? `0 0 5px ${m.color}` : 'none' }} />
                        <p className="font-heading font-bold" style={{ fontSize: '10px', color: active ? m.color : '#4B5563' }}>
                          {m.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
                  {STRATEGY_META[strategy].description}
                </p>
              </div>

              {/* ── Custom pricing override ── */}
              <div className="rounded-2xl p-4 space-y-3"
                   style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Toggle enabled={customEnabled} onChange={setCustomEnabled} color="#9D60FA" label={t.pricingModal.customOverride} />
                <AnimatePresence>
                  {customEnabled && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="pt-2 space-y-3">
                        {strategy === 'MANUAL' ? (
                          <Field label={t.pricingModal.manualPrice}>
                            <NumField value={manualPrice} onChange={setManualPrice} prefix="$" placeholder="0.00" color="#9D60FA" />
                          </Field>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <Field label={t.pricingModal.markupType}>
                              <div className="flex gap-2">
                                {(['PERCENT', 'FIXED'] as SmartMarkupType[]).map(t => (
                                  <button key={t} type="button" onClick={() => setCustomType(t)}
                                    className="flex-1 py-2 rounded-xl font-heading font-bold transition-all duration-200"
                                    style={{
                                      fontSize:   '11px',
                                      background: customType === t ? 'rgba(157,96,250,0.15)' : 'rgba(255,255,255,0.03)',
                                      border:     `1px solid ${customType === t ? 'rgba(157,96,250,0.45)' : 'rgba(255,255,255,0.08)'}`,
                                      color:      customType === t ? '#9D60FA' : '#4B5563',
                                    }}>
                                    {t === 'PERCENT' ? '%' : '$'}
                                  </button>
                                ))}
                              </div>
                            </Field>
                            <Field label={customType === 'PERCENT' ? 'Markup %' : 'Fixed $'}>
                              <NumField value={customValue} onChange={setCustomValue}
                                suffix={customType === 'PERCENT' ? '%' : undefined}
                                prefix={customType === 'FIXED'   ? '+$' : undefined}
                                placeholder="0" color="#9D60FA" />
                            </Field>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Notes ── */}
              <div className="rounded-2xl p-4 space-y-2"
                   style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>{t.pricingModal.notes}</p>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder={t.pricingModal.notesPlaceholder}
                  className="w-full bg-transparent outline-none resize-none font-body text-[#9CA3AF] placeholder:text-[#1F2937] rounded-xl px-3 py-2.5"
                  style={{ fontSize: '12px', border: '1px solid rgba(255,255,255,0.07)' }}
                />
              </div>
            </div>

            {/* ── Right: live preview ── */}
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden"
                   style={{ background: '#0D0D1A', border: '1px solid rgba(124,58,237,0.18)' }}>
                <div className="flex items-center justify-between px-4 py-3"
                     style={{ borderBottom: '1px solid rgba(124,58,237,0.12)', background: 'rgba(124,58,237,0.08)' }}>
                  <div className="flex items-center gap-2">
                    <DollarSign style={{ width: '13px', height: '13px', color: '#7C3AED' }} />
                    <span className="font-heading font-bold text-white" style={{ fontSize: '12px' }}>{t.pricingModal.preview}</span>
                  </div>
                  <motion.span
                    animate={{ opacity: loading ? [1, 0.3, 1] : 1 }}
                    transition={{ duration: 0.6, repeat: loading ? Infinity : 0 }}
                    className="font-pixel text-green-400"
                    style={{ fontSize: '7px', letterSpacing: '0.07em' }}
                  >
                    {loading ? 'CALC…' : 'LIVE'}
                  </motion.span>
                </div>

                <div className="p-4 space-y-4">
                  <AnimatePresence mode="wait">
                    {preview ? (
                      <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                        {/* USD */}
                        <div>
                          <p className="font-body text-[#4B5563] mb-0.5" style={{ fontSize: '10px' }}>{t.pricingModal.finalPrice}</p>
                          <motion.p key={preview.finalPriceUsd} initial={{ scale: 0.94 }} animate={{ scale: 1 }}
                            className="font-heading font-bold text-white"
                            style={{ fontSize: '28px', textShadow: '0 0 20px rgba(124,58,237,0.5)' }}>
                            ${preview.finalPriceUsd.toFixed(2)}
                          </motion.p>
                          <p className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
                            Raw: ${preview.rawPriceUsd.toFixed(2)}
                          </p>
                        </div>

                        {/* UZS */}
                        <div className="rounded-xl p-2.5"
                             style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)' }}>
                          <p className="font-body text-[#06B6D4]" style={{ fontSize: '9px', marginBottom: '2px' }}>UZS</p>
                          <p className="font-heading font-bold text-white" style={{ fontSize: '14px' }}>
                            {Math.round(preview.finalPriceUzs).toLocaleString('ru')} сум
                          </p>
                        </div>

                        {/* Profit */}
                        <div className="rounded-xl p-2.5"
                             style={{ background: marginColor + '0E', border: `1px solid ${marginColor}25` }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-body" style={{ fontSize: '9px', color: marginColor }}>{t.pricingModal.profit}</p>
                              <p className="font-heading font-bold" style={{ fontSize: '14px', color: marginColor }}>
                                +${preview.profitUsd.toFixed(2)}
                              </p>
                            </div>
                            <p className="font-heading font-bold" style={{ fontSize: '18px', color: marginColor }}>
                              {preview.marginPercent.toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        {/* Steam compare */}
                        {preview.youSavePercent != null && (
                          <div className="rounded-xl p-2.5"
                               style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                            <p className="font-body text-[#22C55E]" style={{ fontSize: '9px', marginBottom: '2px' }}>{t.pricingModal.vsSteam}</p>
                            <p className="font-heading font-bold text-[#22C55E]" style={{ fontSize: '13px' }}>
                              -{preview.youSavePercent.toFixed(0)}% (${preview.youSaveAmount?.toFixed(2)})
                            </p>
                          </div>
                        )}

                        {/* Applied rules chain */}
                        <div className="space-y-1">
                          {preview.appliedRules.map((rule, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <ArrowRight style={{ width: '9px', height: '9px', color: '#374151', flexShrink: 0 }} />
                              <span className="font-body text-[#374151]" style={{ fontSize: '9.5px' }}>{rule}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center py-8 gap-3 text-center">
                        <DollarSign style={{ width: '24px', height: '24px', color: '#1F2937' }} />
                        <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
                          {t.pricingModal.enterSupplier}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Product type badge */}
              <div className="flex items-center justify-center gap-2 rounded-xl px-3 py-2"
                   style={{
                     background: productType === 'KEY' ? 'rgba(34,197,94,0.07)' : productType === 'GIFT' ? 'rgba(245,158,11,0.07)' : 'rgba(6,182,212,0.07)',
                     border:     productType === 'KEY' ? '1px solid rgba(34,197,94,0.18)' : productType === 'GIFT' ? '1px solid rgba(245,158,11,0.18)' : '1px solid rgba(6,182,212,0.18)',
                   }}>
                {productType === 'KEY'     && <Key  style={{ width: '12px', height: '12px', color: '#22C55E', flexShrink: 0 }} />}
                {productType === 'GIFT'    && <Gift style={{ width: '12px', height: '12px', color: '#F59E0B', flexShrink: 0 }} />}
                {productType === 'ACCOUNT' && <User style={{ width: '12px', height: '12px', color: '#06B6D4', flexShrink: 0 }} />}
                <span className="font-heading font-semibold" style={{
                  fontSize: '11px',
                  color: productType === 'KEY' ? '#22C55E' : productType === 'GIFT' ? '#F59E0B' : '#06B6D4',
                }}>
                  {productType === 'KEY' ? 'Ключ активации' : productType === 'GIFT' ? 'Steam-подарок' : 'Аккаунт'}
                </span>
              </div>

              {/* Save button */}
              <motion.button
                onClick={handleSave}
                disabled={saving || !supplierPrice || parseFloat(supplierPrice) <= 0}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-heading font-bold transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                  border:     '1px solid rgba(124,58,237,0.5)',
                  color:      '#fff',
                  fontSize:   '13px',
                  boxShadow:  '0 0 20px rgba(124,58,237,0.35)',
                  opacity:    saving || !supplierPrice ? 0.5 : 1,
                  cursor:     saving || !supplierPrice ? 'not-allowed' : 'pointer',
                }}>
                {saving
                  ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}><RefreshCw style={{ width: '14px', height: '14px' }} /></motion.div>
                  : <Check style={{ width: '14px', height: '14px' }} />}
                {saving ? t.common.saving : t.pricingModal.savePricing}
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
