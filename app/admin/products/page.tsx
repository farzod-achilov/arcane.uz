'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Search, Plus, Eye, EyeOff, Edit2, RefreshCw,
  CheckCircle2, AlertCircle, Clock, Zap, Hand, Truck, Package, X, Save, Loader2, Trash2,
  ArrowUpDown, SlidersHorizontal, ToggleRight,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import AddGameModal from '@/components/admin/keys/AddGameModal';
import SupplierSyncPanel from '@/components/admin/SupplierSyncPanel';

/* ── Types ─────────────────────────────────────────────────────── */
interface GameRow {
  id:           string;
  title:        string;
  slug:         string;
  cover:        string | null;
  genres:       string[];
  platforms:    string[];
  developer:    string | null;
  priceUzs:     number | null;
  priceUsd:     number | null;
  isActive:     boolean;
  stockStore:   number;
  deliveryType: 'AUTO' | 'MANUAL' | 'DROPSHIP';
  createdAt:    string;
  _count:       { order_items: number; game_keys: number };
}

const DELIVERY_TYPE_META = {
  AUTO:     { label: 'Авто',     color: '#06B6D4', Icon: Zap },
  MANUAL:   { label: 'Ручная',   color: '#A78BFA', Icon: Hand },
  DROPSHIP: { label: 'Dropship', color: '#F59E0B', Icon: Truck },
} as const;

/* ── Variant list editor (within EditModal) ───────────────────────── */
interface VariantRow {
  id:                 string;
  label:              string;
  priceUzs:           number;
  isActive:           boolean;
  dropshipSource:     string | null;
  dropshipExternalId: string | null;
}

interface KinguinPickResult {
  kinguinId: number;
  name:      string;
  platform:  string | null;
  costUsd:   number;
  inStock:   boolean;
}

function VariantsEditor({ gameId, gameTitle }: { gameId: string; gameTitle: string }) {
  const [variants, setVariants] = useState<VariantRow[] | null>(null);
  const [drafts,   setDrafts]   = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  // Steam reference price — shared across all variants of the game (Steam
  // sells one canonical version regardless of which Kinguin delivery
  // format the customer buys from us), so it lives once here, not per-row.
  const [steamPrice,       setSteamPrice]       = useState('');
  const [steamPriceSaving, setSteamPriceSaving] = useState(false);

  // Inline "add a new activation type" mini-flow — trims AttachVariantFlow
  // down to just the Kinguin-search + label steps, since gameId is already
  // known from context here.
  const [addOpen,  setAddOpen]  = useState(false);
  const [kQuery,   setKQuery]   = useState('');
  const [kLoading, setKLoading] = useState(false);
  const [kResults, setKResults] = useState<KinguinPickResult[] | null>(null);
  const [picked,   setPicked]   = useState<KinguinPickResult | null>(null);
  const [label,    setLabel]    = useState('');
  const [creating, setCreating] = useState(false);
  const [addError, setAddError] = useState('');

  const loadVariants = useCallback(() => {
    fetch(`/api/admin/game-variants?gameId=${gameId}`)
      .then(r => r.json())
      .then(json => { if (json.ok) setVariants(json.variants); })
      .catch(() => setVariants([]));
  }, [gameId]);

  useEffect(() => { loadVariants(); }, [loadVariants]);

  useEffect(() => {
    fetch(`/api/admin/game/${gameId}/pricing`)
      .then(r => r.json())
      .then(json => { if (json.success && json.data?.steamPriceUsd != null) setSteamPrice(String(json.data.steamPriceUsd)); })
      .catch(() => {});
  }, [gameId]);

  if (variants === null) {
    return <Loader2 className="w-4 h-4 animate-spin text-[#6B7280]" />;
  }

  async function patchVariant(id: string, data: { isActive?: boolean; priceUzs?: number }) {
    setSavingId(id);
    try {
      const res  = await fetch(`/api/admin/game-variants/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });
      const json = await res.json();
      if (json.ok) {
        setVariants(prev => prev!.map(v => v.id === id ? { ...v, ...json.variant } : v));
      }
    } finally {
      setSavingId(null);
    }
  }

  async function refreshVariantPrice(id: string) {
    setRefreshingId(id);
    try {
      const res  = await fetch(`/api/admin/game-variants/${id}/refresh-price`, { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        setVariants(prev => prev!.map(v => v.id === id ? { ...v, priceUzs: json.variant.priceUzs } : v));
      } else {
        alert(json.error ?? 'Не удалось обновить цену');
      }
    } finally {
      setRefreshingId(null);
    }
  }

  async function saveSteamPrice() {
    setSteamPriceSaving(true);
    try {
      await fetch(`/api/admin/game/${gameId}/steam-price`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ steamPriceUsd: steamPrice.trim() ? Number(steamPrice) : null }),
      });
    } finally {
      setSteamPriceSaving(false);
    }
  }

  async function searchKinguin() {
    if (kQuery.trim().length < 3) return;
    setKLoading(true); setKResults(null); setPicked(null);
    try {
      const res  = await fetch(`/api/admin/dropship/search-kinguin?q=${encodeURIComponent(kQuery.trim())}`);
      const json = await res.json();
      if (json.ok) setKResults(json.results);
    } finally {
      setKLoading(false);
    }
  }

  async function addVariant() {
    if (!picked || !label.trim()) return;
    setCreating(true); setAddError('');
    try {
      const res  = await fetch('/api/admin/dropship/create-variant', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ gameId, label: label.trim(), kinguinId: picked.kinguinId, costUsd: picked.costUsd, title: picked.name }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) { setAddError(json.error ?? 'Ошибка создания'); return; }
      loadVariants();
      setAddOpen(false); setKQuery(''); setKResults(null); setPicked(null); setLabel('');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="font-pixel text-[#4B5563]" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
          ВАРИАНТЫ ПОКУПКИ{variants.length > 0 ? ` (${variants.length})` : ''}
        </p>
        <button
          onClick={() => { setAddOpen(v => !v); setKQuery(prev => prev || gameTitle); }}
          className="flex items-center gap-1 font-body transition-colors"
          style={{ fontSize: '11px', color: '#7C3AED' }}
        >
          <Plus className="w-3 h-3" /> Добавить тип
        </button>
      </div>

      {/* Steam reference price */}
      <div className="flex items-center gap-2 mb-2 rounded-xl px-3 py-2"
           style={{ background: 'rgba(102,192,244,0.06)', border: '1px solid rgba(102,192,244,0.2)' }}>
        <span className="font-body flex-shrink-0" style={{ fontSize: '11px', color: '#66C0F4' }}>Steam $</span>
        <input
          type="number" step="0.01" value={steamPrice}
          onChange={e => setSteamPrice(e.target.value)}
          onBlur={saveSteamPrice}
          placeholder="0.00"
          className="flex-1 rounded-lg px-2 py-1 font-body text-white text-xs outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        {steamPriceSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#66C0F4] flex-shrink-0" />}
      </div>

      {variants.length > 0 && (
        <div className="space-y-2 mb-2">
          {variants.map(v => (
            <div key={v.id} className="flex items-center gap-2 rounded-xl px-3 py-2"
                 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="font-body text-white flex-1 truncate" style={{ fontSize: '12.5px', opacity: v.isActive ? 1 : 0.4 }}>
                {v.label}
              </span>
              <input
                type="number"
                defaultValue={v.priceUzs}
                onChange={e => setDrafts(prev => ({ ...prev, [v.id]: e.target.value }))}
                onBlur={() => {
                  const draft = drafts[v.id];
                  if (draft && Number(draft) > 0 && Number(draft) !== v.priceUzs) patchVariant(v.id, { priceUzs: Number(draft) });
                }}
                className="w-24 rounded-lg px-2 py-1 font-body text-white text-xs outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              {v.dropshipSource === 'kinguin' && v.dropshipExternalId && (
                <button
                  onClick={() => refreshVariantPrice(v.id)}
                  disabled={refreshingId === v.id}
                  className="p-1.5 rounded-lg flex-shrink-0 transition-colors"
                  style={{ color: '#06B6D4' }}
                  title="Подтянуть текущую цену с Kinguin"
                >
                  {refreshingId === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                </button>
              )}
              <button
                onClick={() => patchVariant(v.id, { isActive: !v.isActive })}
                disabled={savingId === v.id}
                className="p-1.5 rounded-lg flex-shrink-0 transition-colors"
                style={{ color: v.isActive ? '#22C55E' : '#4B5563' }}
                title={v.isActive ? 'Скрыть вариант' : 'Показать вариант'}
              >
                {savingId === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : v.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <div className="flex gap-2">
            <input
              value={kQuery}
              onChange={e => setKQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchKinguin()}
              placeholder="Название на Kinguin"
              className="flex-1 rounded-lg px-2.5 py-1.5 font-body text-white text-xs outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <button onClick={searchKinguin} disabled={kLoading}
                    className="rounded-lg px-2.5 flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
              {kLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7C3AED]" /> : <Search className="w-3.5 h-3.5 text-[#7C3AED]" />}
            </button>
          </div>

          {kResults && !picked && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {kResults.length === 0 ? (
                <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>Ничего не найдено</p>
              ) : kResults.map(r => (
                <button key={r.kinguinId} onClick={() => setPicked(r)}
                        className="w-full flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="font-body text-white truncate flex-1" style={{ fontSize: '11px' }}>{r.name}</span>
                  <span className="font-body flex-shrink-0" style={{ fontSize: '11px', color: r.inStock ? '#22C55E' : '#EF4444' }}>
                    ${r.costUsd.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {picked && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5"
                   style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <span className="font-body text-white truncate flex-1" style={{ fontSize: '11px' }}>{picked.name}</span>
                <button onClick={() => setPicked(null)} className="font-body flex-shrink-0" style={{ fontSize: '10px', color: '#4B5563' }}>изменить</button>
              </div>
              <div className="flex gap-1.5">
                {['Ключ', 'Аккаунт', 'Подарок'].map(preset => (
                  <button key={preset} onClick={() => setLabel(preset)}
                          className="rounded-lg px-2 py-1 font-body text-xs"
                          style={{
                            background: label === preset ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${label === preset ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)'}`,
                            color: label === preset ? '#C4B5FD' : '#9CA3AF',
                          }}>
                    {preset}
                  </button>
                ))}
              </div>
              <input
                value={label} onChange={e => setLabel(e.target.value)}
                placeholder="Название варианта"
                className="w-full rounded-lg px-2.5 py-1.5 font-body text-white text-xs outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              {addError && <p className="font-body" style={{ fontSize: '10.5px', color: '#FCA5A5' }}>{addError}</p>}
              <button onClick={addVariant} disabled={creating || !label.trim()}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-heading font-semibold text-white text-xs disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Добавить
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Edit Modal ─────────────────────────────────────────────────── */
function EditModal({ game, onClose, onSaved }: { game: GameRow; onClose: () => void; onSaved: (g: Partial<GameRow>) => void }) {
  const [saving, setSaving]     = useState(false);
  const [deliveryType, setDeliveryType] = useState<'AUTO' | 'MANUAL' | 'DROPSHIP'>(game.deliveryType);
  const [priceUzs, setPriceUzs] = useState(String(game.priceUzs ?? ''));

  async function save() {
    setSaving(true);
    try {
      const res  = await fetch(`/api/admin/games/${game.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ deliveryType, priceUzs: priceUzs ? parseInt(priceUzs) : undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.game) { alert(data.error ?? 'Не удалось сохранить'); return; }
      onSaved(data.game);
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
         onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{ background: '#0D0D1A', border: '1px solid rgba(124,58,237,0.25)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-pixel text-[#7C3AED] mb-1" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>РЕДАКТИРОВАТЬ</p>
            <h3 className="font-heading font-bold text-white line-clamp-2" style={{ fontSize: '15px' }}>{game.title}</h3>
          </div>
          <button onClick={onClose} className="text-[#374151] hover:text-white transition-colors ml-3">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delivery type */}
        <div>
          <p className="font-pixel text-[#4B5563] mb-2" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>ТИП ДОСТАВКИ</p>
          <div className="grid grid-cols-3 gap-2">
            {(['AUTO', 'MANUAL', 'DROPSHIP'] as const).map(type => {
              const meta = DELIVERY_TYPE_META[type];
              const active = deliveryType === type;
              return (
                <button key={type} onClick={() => setDeliveryType(type)}
                        className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 font-heading font-semibold text-sm transition-all"
                        style={{
                          background: active ? `${meta.color}26` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${active ? `${meta.color}66` : 'rgba(255,255,255,0.08)'}`,
                          color: active ? meta.color : '#6B7280',
                        }}>
                  <meta.Icon className="w-4 h-4" />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price */}
        <div>
          <p className="font-pixel text-[#4B5563] mb-2" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>ЦЕНА (СУМ)</p>
          <input
            type="number"
            value={priceUzs}
            onChange={e => setPriceUzs(e.target.value)}
            placeholder="Например: 249000"
            className="w-full rounded-xl px-4 py-3 font-body text-sm text-white outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>

        <VariantsEditor gameId={game.id} gameTitle={game.title} />

        <button
          onClick={save}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-heading font-semibold text-white text-sm transition-all disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Сохранить
        </button>
      </motion.div>
    </div>
  );
}

/* ── Nuke Modal ─────────────────────────────────────── */
function NukeModal({ total, onClose, onDone }: { total: number; onClose: () => void; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');

  async function execute() {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/admin/games/nuke', { method: 'POST' });
      const data = await res.json() as { ok?: boolean; deleted?: { gamesCount: number }; error?: string };
      if (!res.ok || !data.ok) { setError(data.error ?? 'Ошибка'); return; }
      setDone(true);
      setTimeout(() => { onDone(); onClose(); }, 1500);
    } catch { setError('Ошибка сети'); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
         onClick={e => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0A0A14', border: '1px solid rgba(239,68,68,0.3)' }}
      >
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <Trash2 style={{ width: '18px', height: '18px', color: '#EF4444' }} />
            </div>
            <div>
              <p className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>Удалить все игры</p>
              <p className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>Это действие нельзя отменить</p>
            </div>
          </div>

          <div className="rounded-xl px-4 py-3 mb-5"
               style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
            <p className="font-body text-[#FCA5A5]" style={{ fontSize: '12px', lineHeight: '1.6' }}>
              Будет удалено <strong style={{ color: '#F87171' }}>{total} игр</strong> вместе со всеми ключами,
              транзакциями ключей и позициями заказов. Заказы сохранятся, но без привязки к играм.
            </p>
          </div>

          {done && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <CheckCircle2 style={{ width: '14px', height: '14px', color: '#22C55E' }} />
              <p className="font-body text-[#22C55E]" style={{ fontSize: '12px' }}>Все игры удалены!</p>
            </motion.div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4"
                 style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle style={{ width: '13px', height: '13px', color: '#EF4444' }} />
              <p className="font-body text-[#F87171]" style={{ fontSize: '12px' }}>{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4"
             style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={onClose} disabled={loading || done}
            className="px-4 py-2 rounded-xl font-body disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#6B7280', fontSize: '12px' }}>
            Отмена
          </button>
          <button onClick={execute} disabled={loading || done}
            className="flex items-center gap-2 px-5 py-2 rounded-xl font-heading font-semibold text-white disabled:opacity-50"
            style={{ background: 'rgba(239,68,68,0.85)', fontSize: '12px', boxShadow: '0 0 14px rgba(239,68,68,0.25)' }}>
            {loading
              ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white" />Удаляем...</>
              : <><Trash2 style={{ width: '13px', height: '13px' }} />Удалить все</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

type StatusFilter   = 'ALL' | 'ACTIVE' | 'HIDDEN';
type DeliveryFilter = 'ALL' | 'AUTO' | 'MANUAL' | 'DROPSHIP';
type StockFilter    = 'ALL' | 'IN' | 'OUT';
type SortOption     = 'date_desc' | 'date_asc' | 'price_desc' | 'price_asc' | 'stock_desc' | 'stock_asc';

const STATUS_TABS:   { id: StatusFilter;   label: string }[] = [
  { id: 'ALL',    label: 'Все'      },
  { id: 'ACTIVE', label: 'Активные' },
  { id: 'HIDDEN', label: 'Скрытые'  },
];
const DELIVERY_TABS: { id: DeliveryFilter; label: string }[] = [
  { id: 'ALL',      label: 'Все'      },
  { id: 'AUTO',     label: 'Авто'     },
  { id: 'MANUAL',   label: 'Ручная'   },
  { id: 'DROPSHIP', label: 'Dropship' },
];
const STOCK_TABS:    { id: StockFilter;    label: string }[] = [
  { id: 'ALL', label: 'Все'          },
  { id: 'IN',  label: 'Есть ключи'  },
  { id: 'OUT', label: 'Нет ключей'  },
];
const SORT_OPTIONS:  { id: SortOption; label: string }[] = [
  { id: 'date_desc',  label: 'Дата ↓'   },
  { id: 'date_asc',   label: 'Дата ↑'   },
  { id: 'price_desc', label: 'Цена ↓'   },
  { id: 'price_asc',  label: 'Цена ↑'   },
  { id: 'stock_desc', label: 'Склад ↓'  },
  { id: 'stock_asc',  label: 'Склад ↑'  },
];

/* ── Page ───────────────────────────────────────────────────── */
export default function AdminProductsPage() {
  const [games, setGames]         = useState<GameRow[]>([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [editGame, setEditGame]   = useState<GameRow | null>(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [showNuke, setShowNuke]   = useState(false);
  const [toggling, setToggling]       = useState<string | null>(null);
  const [bulkActivating, setBulkActivating] = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null); // confirm step
  const [deleteErr, setDeleteErr] = useState<Record<string, string>>({});
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>('ALL');
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>('ALL');
  const [stockFilter,    setStockFilter]    = useState<StockFilter>('ALL');
  const [sort,           setSort]           = useState<SortOption>('date_desc');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sortBy, sortDir] = sort.startsWith('price') ? ['priceUzs', sort.endsWith('asc') ? 'asc' : 'desc']
                              : sort.startsWith('stock') ? ['stockStore', sort.endsWith('asc') ? 'asc' : 'desc']
                              :                            ['createdAt',  sort.endsWith('asc') ? 'asc' : 'desc'];
      const params = new URLSearchParams({
        page:    String(page),
        sortBy,  sortDir,
        status:   statusFilter,
        delivery: deliveryFilter,
        stock:    stockFilter,
        ...(search ? { q: search } : {}),
      });
      const data = await fetch(`/api/admin/games?${params}`).then(r => r.json());
      setGames(data.games ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } finally { setLoading(false); }
  }, [page, search, statusFilter, deliveryFilter, stockFilter, sort]);

  useEffect(() => { load(); }, [load]); // eslint-disable-line

  async function bulkActivate() {
    setBulkActivating(true);
    try {
      const res  = await fetch('/api/admin/games/bulk-activate', { method: 'POST' });
      const data = await res.json() as { ok: boolean; count: number };
      if (data.ok) setGames(prev => prev.map(g => ({ ...g, isActive: true })));
    } finally { setBulkActivating(false); }
  }

  async function toggleActive(game: GameRow) {
    setToggling(game.id);
    try {
      const res = await fetch(`/api/admin/games/${game.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ isActive: !game.isActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Не удалось изменить статус');
        return;
      }
      setGames(prev => prev.map(g => g.id === game.id ? { ...g, isActive: !g.isActive } : g));
    } finally { setToggling(null); }
  }

  async function deleteGame(id: string) {
    setDeleting(null);
    const res  = await fetch(`/api/admin/games/${id}`, { method: 'DELETE' });
    const data = await res.json() as { ok: boolean; error?: string };
    if (data.ok) {
      setGames(prev => prev.filter(g => g.id !== id));
      setTotal(prev => prev - 1);
    } else {
      setDeleteErr(prev => ({ ...prev, [id]: data.error ?? 'Ошибка' }));
      setTimeout(() => setDeleteErr(prev => { const n = { ...prev }; delete n[id]; return n; }), 3000);
    }
  }

  function handleSaved(updated: Partial<GameRow>) {
    setGames(prev => prev.map(g => g.id === updated.id ? { ...g, ...updated } : g));
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#06B6D4', letterSpacing: '0.14em' }}>ПРОДУКТЫ</p>
          <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>
            Каталог игр <span className="font-body text-[#4B5563] text-sm ml-2">{total} игр</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <>
              <button
                onClick={bulkActivate}
                disabled={bulkActivating}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-semibold text-sm disabled:opacity-50"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E' }}
              >
                {bulkActivating
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <ToggleRight className="w-4 h-4" />}
                Активировать все
              </button>
              <button
                onClick={() => setShowNuke(true)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-semibold text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}
              >
                <Trash2 className="w-4 h-4" /> Удалить все
              </button>
            </>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-semibold text-white text-sm"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', boxShadow: '0 0 16px rgba(124,58,237,0.3)' }}
          >
            <Plus className="w-4 h-4" /> Добавить игру
          </button>
        </div>
      </div>

      <SupplierSyncPanel
        name="Digiseller"
        statusEndpoint="/api/digiseller/sync"
        syncEndpoint="/api/digiseller/sync"
        disabledHint="добавьте DIGISELLER_SELLER_ID"
        color="#7C3AED"
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#374151]" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Поиск по названию или разработчику…"
          className="w-full rounded-xl pl-11 pr-4 py-3 font-body text-sm text-white outline-none"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Status */}
        <div className="flex items-center gap-1.5">
          <Eye style={{ width: '11px', height: '11px', color: '#374151' }} />
          <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>Статус:</span>
          {STATUS_TABS.map(t => (
            <button key={t.id} onClick={() => { setStatusFilter(t.id); setPage(1); }}
              className="rounded-lg px-2.5 py-1 font-body transition-all duration-150"
              style={{
                fontSize: '11px',
                background: statusFilter === t.id ? 'rgba(34,197,94,0.1)'  : 'rgba(255,255,255,0.03)',
                border:    `1px solid ${statusFilter === t.id ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}`,
                color:      statusFilter === t.id ? '#22C55E' : '#4B5563',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="h-3.5 w-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Delivery */}
        <div className="flex items-center gap-1.5">
          <Zap style={{ width: '11px', height: '11px', color: '#374151' }} />
          <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>Доставка:</span>
          {DELIVERY_TABS.map(t => (
            <button key={t.id} onClick={() => { setDeliveryFilter(t.id); setPage(1); }}
              className="rounded-lg px-2.5 py-1 font-body transition-all duration-150"
              style={{
                fontSize: '11px',
                background: deliveryFilter === t.id ? 'rgba(6,182,212,0.1)'  : 'rgba(255,255,255,0.03)',
                border:    `1px solid ${deliveryFilter === t.id ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.06)'}`,
                color:      deliveryFilter === t.id ? '#06B6D4' : '#4B5563',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="h-3.5 w-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Stock */}
        <div className="flex items-center gap-1.5">
          <Package style={{ width: '11px', height: '11px', color: '#374151' }} />
          <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>Склад:</span>
          {STOCK_TABS.map(t => (
            <button key={t.id} onClick={() => { setStockFilter(t.id); setPage(1); }}
              className="rounded-lg px-2.5 py-1 font-body transition-all duration-150"
              style={{
                fontSize: '11px',
                background: stockFilter === t.id ? 'rgba(245,158,11,0.1)'  : 'rgba(255,255,255,0.03)',
                border:    `1px solid ${stockFilter === t.id ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)'}`,
                color:      stockFilter === t.id ? '#F59E0B' : '#4B5563',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="h-3.5 w-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown style={{ width: '11px', height: '11px', color: '#374151' }} />
          <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>Сортировка:</span>
          <select
            value={sort}
            onChange={e => { setSort(e.target.value as SortOption); setPage(1); }}
            className="rounded-lg px-2.5 py-1 font-body outline-none cursor-pointer"
            style={{
              fontSize: '11px', background: '#0D0D1A',
              border: '1px solid rgba(124,58,237,0.25)', color: '#9D60FA',
            }}
          >
            {SORT_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        {/* Reset */}
        {(statusFilter !== 'ALL' || deliveryFilter !== 'ALL' || stockFilter !== 'ALL' || sort !== 'date_desc') && (
          <button
            onClick={() => { setStatusFilter('ALL'); setDeliveryFilter('ALL'); setStockFilter('ALL'); setSort('date_desc'); setPage(1); }}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-body transition-all hover:opacity-80"
            style={{ fontSize: '11px', color: '#EF4444', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <X style={{ width: '10px', height: '10px' }} />
            Сбросить
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: '#0D0D1A' }} />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-10 h-10 text-[#374151] mx-auto mb-3" />
          <p className="font-body text-[#4B5563] text-sm">Игры не найдены</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Fixed 6-column grid needs ~720px+ — overflow-x-auto so narrow/mobile
              viewports pan horizontally instead of the outer overflow-hidden
              silently clipping the sales/actions columns with no way to reach them. */}
          <div className="overflow-x-auto">
          <div style={{ minWidth: '720px' }}>
          {/* Header row */}
          <div className="grid items-center px-4 py-2.5"
               style={{ gridTemplateColumns: '2fr 1fr 1fr 80px 100px 100px', background: '#080812', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {['Игра', 'Цена', 'Склад', 'Доставка', 'Продаж', 'Действия'].map(h => (
              <span key={h} className="font-pixel text-[#374151]" style={{ fontSize: '7.5px', letterSpacing: '0.1em' }}>{h}</span>
            ))}
          </div>

          <div className="divide-y divide-white/[0.04]">
            {games.map(game => (
              <div key={game.id}
                   className="grid items-center px-4 py-3 transition-all hover:bg-white/[0.02]"
                   style={{ gridTemplateColumns: '2fr 1fr 1fr 80px 100px 100px' }}>
                {/* Title + cover */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-8 rounded-lg overflow-hidden flex-shrink-0" style={{ aspectRatio: '3/4' }}>
                    {game.cover ? (
                      <Image src={game.cover} alt={game.title} fill unoptimized className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"
                           style={{ background: 'rgba(124,58,237,0.1)' }}>
                        <Package className="w-3 h-3 text-white/20" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-white truncate" style={{ fontSize: '12.5px' }}>{game.title}</p>
                    <p className="font-body text-[#374151] truncate" style={{ fontSize: '10.5px' }}>
                      {game.developer ?? game.genres[0] ?? '—'}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <p className="font-heading font-semibold text-white" style={{ fontSize: '12.5px' }}>
                  {game.priceUzs != null ? formatPrice(game.priceUzs) : '—'}
                </p>

                {/* Stock */}
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: game.stockStore > 0 ? '#22C55E' : '#6B7280' }} />
                  <span className="font-body" style={{ fontSize: '12px', color: game.stockStore > 0 ? '#22C55E' : '#6B7280' }}>
                    {game.stockStore} ключей
                  </span>
                </div>

                {/* Delivery type */}
                {(() => {
                  const meta = DELIVERY_TYPE_META[game.deliveryType];
                  return (
                    <span className="inline-flex items-center gap-1 font-pixel rounded px-2 py-0.5"
                          style={{
                            fontSize: '7px', letterSpacing: '0.06em',
                            color:      meta.color,
                            background: `${meta.color}1A`,
                          }}>
                      <meta.Icon className="w-2.5 h-2.5" />
                      {meta.label}
                    </span>
                  );
                })()}

                {/* Sales */}
                <span className="font-body text-[#6B7280]" style={{ fontSize: '12px' }}>
                  {game._count.order_items} шт.
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleActive(game)}
                    disabled={toggling === game.id}
                    title={game.isActive ? 'Скрыть' : 'Показать'}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{
                      background: game.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)',
                      border: `1px solid ${game.isActive ? 'rgba(34,197,94,0.3)' : 'rgba(107,114,128,0.2)'}`,
                    }}
                  >
                    {toggling === game.id
                      ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                      : game.isActive
                        ? <Eye className="w-3.5 h-3.5 text-green-400" />
                        : <EyeOff className="w-3.5 h-3.5 text-gray-500" />}
                  </button>
                  <button
                    onClick={() => setEditGame(game)}
                    title="Редактировать"
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all text-[#374151] hover:text-[#A78BFA]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete — inline confirm */}
                  <AnimatePresence mode="wait">
                    {deleting === game.id ? (
                      <motion.div
                        key="confirm"
                        initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                        className="flex items-center gap-1 overflow-hidden"
                      >
                        <button
                          onClick={() => deleteGame(game.id)}
                          className="h-7 px-2 rounded-lg font-body text-white transition-all"
                          style={{ fontSize: '10px', background: 'rgba(239,68,68,0.85)', border: '1px solid rgba(239,68,68,0.5)', whiteSpace: 'nowrap' }}
                        >
                          Да
                        </button>
                        <button
                          onClick={() => setDeleting(null)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all text-[#6B7280] hover:text-white"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.button
                        key="delete"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => { setDeleting(game.id); setDeleteErr(prev => { const n={...prev}; delete n[game.id]; return n; }); }}
                        title={deleteErr[game.id] ?? 'Удалить'}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                        style={{
                          background: deleteErr[game.id] ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${deleteErr[game.id] ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}`,
                          color: deleteErr[game.id] ? '#EF4444' : '#374151',
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 hover:text-red-400 transition-colors" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
          </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {[...Array(pages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
                    className="w-8 h-8 rounded-lg font-heading font-semibold text-sm transition-all"
                    style={{
                      background: page === i + 1 ? '#7C3AED' : 'rgba(255,255,255,0.04)',
                      color:      page === i + 1 ? '#fff'    : '#6B7280',
                      border:     page === i + 1 ? 'none'    : '1px solid rgba(255,255,255,0.07)',
                    }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editGame && (
          <EditModal game={editGame} onClose={() => setEditGame(null)} onSaved={handleSaved} />
        )}
      </AnimatePresence>

      {/* Nuke Modal */}
      <AnimatePresence>
        {showNuke && (
          <NukeModal
            total={total}
            onClose={() => setShowNuke(false)}
            onDone={() => { setGames([]); setTotal(0); setPages(1); setPage(1); }}
          />
        )}
      </AnimatePresence>

      {/* Add Game Modal */}
      {showAdd && (
        <AddGameModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); load(); }}
        />
      )}
    </div>
  );
}
