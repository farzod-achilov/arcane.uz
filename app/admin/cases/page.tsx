'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, Star, Zap, TrendingUp, Crown, Sparkles,
  X, Plus, ToggleLeft, ToggleRight, RefreshCw, Loader2, Trash2,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

/* ── Rarity / theme config ──────────────────────────────── */
const RARITY_META = {
  silver: {
    label: 'Silver', color: '#9CA3AF', glow: '#9CA3AF30',
    bg: 'linear-gradient(135deg, #1A1A25, #12121C)',
    border: 'rgba(156,163,175,0.25)',
    icon: Star,
    headerGradient: 'linear-gradient(135deg, rgba(156,163,175,0.15), rgba(156,163,175,0.04))',
  },
  gold: {
    label: 'Gold', color: '#F59E0B', glow: '#F59E0B30',
    bg: 'linear-gradient(135deg, #1C1A10, #14120A)',
    border: 'rgba(245,158,11,0.3)',
    icon: Crown,
    headerGradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.04))',
  },
  arcane: {
    label: 'Arcane', color: '#7C3AED', glow: '#7C3AED35',
    bg: 'linear-gradient(135deg, #130D1E, #0D0912)',
    border: 'rgba(124,58,237,0.35)',
    icon: Sparkles,
    headerGradient: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(124,58,237,0.05))',
  },
} as const;
type RarityKey = keyof typeof RARITY_META;

function themeToRarity(theme: string): RarityKey {
  const t = theme.toLowerCase();
  if (t.includes('gold') || t.includes('золот') || t.includes('premium')) return 'gold';
  if (t.includes('arcane') || t.includes('legend') || t.includes('epic')) return 'arcane';
  return 'silver';
}

const DB_RARITY_COLOR: Record<string, string> = {
  COMMON: '#9CA3AF', RARE: '#3B82F6', EPIC: '#7C3AED', LEGENDARY: '#F59E0B',
};

const RARITY_OPTIONS = ['COMMON','RARE','EPIC','LEGENDARY'] as const;
const TYPE_OPTIONS   = ['COINS','GAME','DISCOUNT','BOOST','JACKPOT'] as const;
const TYPE_LABELS: Record<string, string> = {
  COINS:'Монеты', GAME:'Игра', DISCOUNT:'Скидка', BOOST:'Буст', JACKPOT:'Джекпот',
};
const THEME_OPTIONS = [
  { value: 'silver', label: 'Silver' },
  { value: 'gold',   label: 'Gold'   },
  { value: 'arcane', label: 'Arcane' },
];

/* ── Types ──────────────────────────────────────────────── */
interface DBReward { id: string; name: string; rarity: string; dropChance: number; type: string; }
interface DBCase {
  id: string; name: string; slug: string; theme: string; price: number;
  description: string | null; imageUrl: string | null;
  isActive: boolean; totalOpened: number; featuredOrder: number | null;
  drop_rewards: DBReward[];
}

/* ── Field component ────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-body text-[#6B7280] mb-1.5" style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      {children}
    </div>
  );
}
function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-xl px-3 py-2.5 text-white font-body outline-none placeholder:text-[#1F2937]"
      style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' }}
    />
  );
}

/* ── Create Case Modal ──────────────────────────────────── */
function CreateCaseModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: DBCase) => void }) {
  const [name,  setName]  = useState('');
  const [slug,  setSlug]  = useState('');
  const [theme, setTheme] = useState('silver');
  const [price, setPrice] = useState('');
  const [desc,  setDesc]  = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const autoSlug = (n: string) => n.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  async function handleCreate() {
    setSaving(true); setError('');
    try {
      const res  = await fetch('/api/admin/cases', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ name, slug, theme, price: parseInt(price) || 0, description: desc }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? 'Ошибка'); return; }
      onCreated(data.case);
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="rounded-2xl p-6 w-full max-w-md space-y-4"
        style={{ background: '#0D0D1A', border: '1px solid rgba(124,58,237,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)' }}>
              <Gift style={{ width: '16px', height: '16px', color: '#7C3AED' }} />
            </div>
            <div>
              <p className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>Новый кейс</p>
              <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>Создание drop_machine</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: '#374151' }}><X style={{ width: '16px', height: '16px' }} /></button>
        </div>

        <Field label="Название">
          <Input value={name} placeholder="Silver Case" onChange={v => { setName(v); if (!slug) setSlug(autoSlug(v)); }} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Slug (уникальный)">
            <Input value={slug} placeholder="silver" onChange={v => setSlug(autoSlug(v))} />
          </Field>
          <Field label="Цена (монет)">
            <Input value={price} type="number" placeholder="49000" onChange={setPrice} />
          </Field>
        </div>

        <Field label="Тема / визуал">
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map(t => {
              const rk   = themeToRarity(t.value);
              const meta = RARITY_META[rk];
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className="rounded-xl py-2 font-body text-sm transition-all"
                  style={{
                    background: theme === t.value ? `${meta.color}15` : 'rgba(255,255,255,0.03)',
                    border:     theme === t.value ? `1px solid ${meta.color}50` : '1px solid rgba(255,255,255,0.07)',
                    color:      theme === t.value ? meta.color : '#4B5563',
                    fontSize: '12px',
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Описание (необязательно)">
          <Input value={desc} placeholder="Коллекция редких наград..." onChange={setDesc} />
        </Field>

        {error && <p className="font-body text-[#EF4444]" style={{ fontSize: '12px' }}>{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 rounded-xl py-2.5 font-heading font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280', fontSize: '13px' }}>
            Отмена
          </button>
          <button onClick={handleCreate} disabled={!name || !slug || !price || saving}
            className="flex-1 rounded-xl py-2.5 font-heading font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: '13px' }}>
            {saving ? <Loader2 style={{ width: '13px', height: '13px' }} className="animate-spin" /> : <Plus style={{ width: '13px', height: '13px' }} />}
            {saving ? 'Создание...' : 'Создать кейс'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Add Reward Modal ───────────────────────────────────── */
function AddRewardModal({
  caseId, caseName, onClose, onAdded,
}: { caseId: string; caseName: string; onClose: () => void; onAdded: (r: DBReward) => void }) {
  const [name,       setName]       = useState('');
  const [type,       setType]       = useState<string>('COINS');
  const [rarity,     setRarity]     = useState<string>('COMMON');
  const [dropChance, setDropChance] = useState('0.10');
  const [sellValue,  setSellValue]  = useState('100');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  async function handleAdd() {
    setSaving(true); setError('');
    try {
      const res  = await fetch(`/api/admin/cases/${caseId}/rewards`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ name, type, rarity, dropChance: parseFloat(dropChance) || 0, sellValue: parseInt(sellValue) || 0 }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? 'Ошибка'); return; }
      onAdded(data.reward);
      onClose();
    } finally { setSaving(false); }
  }

  const chancePct = Math.round((parseFloat(dropChance) || 0) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="rounded-2xl p-6 w-full max-w-md space-y-4"
        style={{ background: '#0D0D1A', border: '1px solid rgba(245,158,11,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>Добавить награду</p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>→ {caseName}</p>
          </div>
          <button onClick={onClose} style={{ color: '#374151' }}><X style={{ width: '16px', height: '16px' }} /></button>
        </div>

        <Field label="Название награды">
          <Input value={name} placeholder="500 Монет" onChange={setName} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Тип">
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-white font-body outline-none"
              style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' }}>
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </Field>
          <Field label="Редкость">
            <select value={rarity} onChange={e => setRarity(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 font-body outline-none"
              style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', color: DB_RARITY_COLOR[rarity] }}>
              {RARITY_OPTIONS.map(r => <option key={r} value={r} style={{ color: DB_RARITY_COLOR[r] }}>{r}</option>)}
            </select>
          </Field>
        </div>

        <Field label={`Шанс дропа — ${chancePct}%`}>
          <div className="space-y-2">
            <input type="range" min="0.001" max="1" step="0.001"
              value={dropChance} onChange={e => setDropChance(e.target.value)}
              className="w-full" style={{ accentColor: DB_RARITY_COLOR[rarity] }} />
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all"
                   style={{ width: `${chancePct}%`, background: DB_RARITY_COLOR[rarity] }} />
            </div>
          </div>
        </Field>

        <Field label="Ценность продажи (монет)">
          <Input value={sellValue} type="number" placeholder="500" onChange={setSellValue} />
        </Field>

        {error && <p className="font-body text-[#EF4444]" style={{ fontSize: '12px' }}>{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 rounded-xl py-2.5 font-heading font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280', fontSize: '13px' }}>
            Отмена
          </button>
          <button onClick={handleAdd} disabled={!name || saving}
            className="flex-1 rounded-xl py-2.5 font-heading font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #D97706, #B45309)', fontSize: '13px' }}>
            {saving ? <Loader2 style={{ width: '13px', height: '13px' }} className="animate-spin" /> : <Plus style={{ width: '13px', height: '13px' }} />}
            {saving ? 'Добавление...' : 'Добавить'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Case card ──────────────────────────────────────────── */
function CaseCard({
  item, toggling, onToggle, onAddReward,
}: {
  item: DBCase; toggling: boolean;
  onToggle: () => void;
  onAddReward: (c: DBCase) => void;
}) {
  const rarityKey = themeToRarity(item.theme);
  const meta      = RARITY_META[rarityKey];
  const RarityIcon = meta.icon;
  const revenue   = item.totalOpened * item.price;
  const totalChance = item.drop_rewards.reduce((s, r) => s + r.dropChance, 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, boxShadow: `0 16px 48px ${meta.glow}` }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden relative"
      style={{ background: meta.bg, border: `1px solid ${item.isActive ? meta.border : 'rgba(255,255,255,0.06)'}`, opacity: item.isActive ? 1 : 0.6 }}
    >
      <div className="absolute top-0 left-0 right-0 h-px"
           style={{ background: `linear-gradient(90deg, transparent, ${meta.color}60, transparent)` }} />
      <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none"
           style={{ background: `radial-gradient(circle at top right, ${meta.glow}, transparent 65%)` }} />

      {/* Header */}
      <div className="p-5" style={{ background: meta.headerGradient }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                 style={{ background: `${meta.color}15`, border: `1px solid ${meta.border}`, boxShadow: `0 0 20px ${meta.glow}` }}>
              <RarityIcon style={{ width: '20px', height: '20px', color: meta.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-pixel" style={{ fontSize: '7px', color: meta.color, letterSpacing: '0.1em' }}>
                  {meta.label.toUpperCase()}
                </span>
                {item.featuredOrder != null && (
                  <span className="font-pixel rounded px-1.5 py-0.5"
                        style={{ fontSize: '6px', color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    FEATURED
                  </span>
                )}
              </div>
              <p className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>{item.name}</p>
              <p className="font-body text-[#374151]" style={{ fontSize: '10px' }}>/{item.slug}</p>
            </div>
          </div>

          <button
            onClick={onToggle} disabled={toggling}
            title={item.isActive ? 'Деактивировать' : 'Активировать'}
            className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 transition-all disabled:opacity-50 flex-shrink-0"
            style={{
              background: item.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)',
              border: item.isActive ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(107,114,128,0.2)',
              color:  item.isActive ? '#22C55E' : '#6B7280',
            }}>
            {toggling
              ? <Loader2 style={{ width: '12px', height: '12px' }} className="animate-spin" />
              : item.isActive
                ? <ToggleRight style={{ width: '14px', height: '14px' }} />
                : <ToggleLeft  style={{ width: '14px', height: '14px' }} />}
            <span className="font-body" style={{ fontSize: '10px' }}>{item.isActive ? 'Активен' : 'Выкл'}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-3 flex items-center gap-4"
           style={{ borderTop: `1px solid ${meta.border}`, borderBottom: `1px solid ${meta.border}` }}>
        <div>
          <p className="font-body text-[#374151]" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Цена</p>
          <p className="font-pixel" style={{ fontSize: '14px', color: meta.color }}>{item.price.toLocaleString('ru')} <span style={{ fontSize: '10px' }}>монет</span></p>
        </div>
        <div style={{ borderLeft: `1px solid ${meta.border}`, paddingLeft: '14px' }}>
          <p className="font-body text-[#374151]" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Открыто</p>
          <p className="font-heading font-bold text-white" style={{ fontSize: '14px' }}>{item.totalOpened.toLocaleString('ru')}</p>
        </div>
        <div style={{ borderLeft: `1px solid ${meta.border}`, paddingLeft: '14px' }}>
          <p className="font-body text-[#374151]" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Выручка</p>
          <p className="font-heading font-bold text-[#22C55E]" style={{ fontSize: '13px' }}>
            {revenue >= 1_000_000 ? `${(revenue / 1_000_000).toFixed(1)}M` : `${(revenue / 1000).toFixed(0)}K`}
          </p>
        </div>
      </div>

      {/* Rewards */}
      <div className="px-5 py-4">
        {item.drop_rewards.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-2.5">
              <p className="font-body text-[#374151]" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Награды ({item.drop_rewards.length})
              </p>
              {totalChance < 0.99 && (
                <span className="font-body" style={{ fontSize: '10px', color: '#F59E0B' }}>
                  Σ {(totalChance * 100).toFixed(0)}% / 100%
                </span>
              )}
              {totalChance >= 0.99 && (
                <span className="font-body" style={{ fontSize: '10px', color: '#22C55E' }}>✓ 100%</span>
              )}
            </div>
            <div className="space-y-1.5 mb-3">
              {item.drop_rewards.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                       style={{ background: DB_RARITY_COLOR[r.rarity] ?? meta.color }} />
                  <span className="font-body text-[#9CA3AF] flex-1 truncate" style={{ fontSize: '12px' }}>{r.name}</span>
                  <span className="font-body text-[#374151] flex-shrink-0" style={{ fontSize: '10.5px' }}>
                    {(r.dropChance * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
              {item.drop_rewards.length > 5 && (
                <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>+ ещё {item.drop_rewards.length - 5}</p>
              )}
            </div>
          </>
        ) : (
          <p className="font-body text-[#1F2937] mb-3" style={{ fontSize: '12px' }}>Наград нет — кейс нельзя открыть</p>
        )}

        <button
          onClick={() => onAddReward(item)}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2 font-body transition-all hover:opacity-90"
          style={{
            background: `${meta.color}10`, border: `1px solid ${meta.border}`,
            color: meta.color, fontSize: '11.5px',
          }}>
          <Plus style={{ width: '11px', height: '11px' }} />
          Добавить награду
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main page ──────────────────────────────────────────── */
export default function AdminCasesPage() {
  const [cases,       setCases]      = useState<DBCase[]>([]);
  const [loading,     setLoading]    = useState(true);
  const [toggling,    setToggling]   = useState<string | null>(null);
  const [showCreate,  setShowCreate] = useState(false);
  const [addRewardTo, setAddRewardTo]= useState<DBCase | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/cases');
      const data = await res.json();
      setCases(data.cases ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(c: DBCase) {
    setToggling(c.id);
    try {
      const res  = await fetch(`/api/admin/cases/${c.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ isActive: !c.isActive }),
      });
      const data = await res.json();
      if (data.ok) setCases(prev => prev.map(x => x.id === c.id ? { ...x, isActive: data.case.isActive } : x));
    } finally { setToggling(null); }
  }

  function handleCreated(newCase: DBCase) {
    setCases(prev => [...prev, { ...newCase, drop_rewards: [] }]);
  }

  function handleRewardAdded(caseId: string, reward: DBReward) {
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, drop_rewards: [...c.drop_rewards, reward] } : c));
  }

  const totalOpened  = cases.reduce((s, c) => s + c.totalOpened, 0);
  const totalRevenue = cases.reduce((s, c) => s + c.totalOpened * c.price, 0);
  const active       = cases.filter(c => c.isActive).length;
  const totalRewards = cases.reduce((s, c) => s + c.drop_rewards.length, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#9D60FA', letterSpacing: '0.14em' }}>УПРАВЛЕНИЕ</p>
          <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>Mystery Cases</h1>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
            {loading ? 'Загрузка...' : `${cases.length} кейсов · ${active} активных · ${totalOpened.toLocaleString('ru')} открыто`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 rounded-xl px-3 py-2 font-heading font-semibold text-sm transition-all disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280' }}>
            <RefreshCw style={{ width: '13px', height: '13px' }} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: '13px', boxShadow: '0 0 16px rgba(124,58,237,0.3)' }}>
            <Plus style={{ width: '14px', height: '14px' }} />
            Новый кейс
          </button>
        </div>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Всего открыто',  value: loading ? '...' : totalOpened.toLocaleString('ru'),                 color: '#9D60FA', icon: Gift      },
          { label: 'Выручка кейсов', value: loading ? '...' : `${(totalRevenue / 1_000_000).toFixed(1)}M`,     color: '#22C55E', icon: TrendingUp },
          { label: 'Активных',       value: loading ? '...' : String(active),                                   color: '#06B6D4', icon: Zap        },
          { label: 'Наград в кейсах',value: loading ? '...' : totalRewards.toLocaleString('ru'),                color: '#F59E0B', icon: Star       },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: '#0D0D1A', border: `1px solid ${s.color}18` }}
            whileHover={{ y: -2, boxShadow: `0 8px 24px ${s.color}18` }}>
            <div className="absolute top-0 right-0 w-20 h-20"
                 style={{ background: `radial-gradient(circle at top right, ${s.color}12, transparent 65%)` }} />
            <s.icon style={{ width: '14px', height: '14px', color: s.color, marginBottom: '10px' }} />
            <p className="font-pixel mb-0.5" style={{ fontSize: '16px', color: s.color }}>{s.value}</p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 style={{ width: '24px', height: '24px', color: '#374151' }} className="animate-spin" />
          <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Загрузка кейсов...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl"
             style={{ background: '#0D0D1A', border: '1px solid rgba(124,58,237,0.15)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
               style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Gift style={{ width: '28px', height: '28px', color: 'rgba(124,58,237,0.4)' }} />
          </div>
          <div className="text-center">
            <p className="font-heading font-bold text-white mb-1" style={{ fontSize: '16px' }}>Кейсов нет</p>
            <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Создайте первый Mystery Case</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-heading font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: '13px' }}>
            <Plus style={{ width: '14px', height: '14px' }} />
            Создать кейс
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {cases.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
                <CaseCard
                  item={item}
                  toggling={toggling === item.id}
                  onToggle={() => toggleActive(item)}
                  onAddReward={setAddRewardTo}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Revenue comparison */}
      {!loading && cases.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl p-5"
          style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp style={{ width: '14px', height: '14px', color: '#9D60FA' }} />
            <h2 className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>Сравнение выручки</h2>
          </div>
          <div className="space-y-4">
            {cases.map((item, i) => {
              const meta    = RARITY_META[themeToRarity(item.theme)];
              const revenue = item.totalOpened * item.price;
              const maxRev  = Math.max(...cases.map(c => c.totalOpened * c.price), 1);
              return (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: `${meta.color}12`, border: `1px solid ${meta.border}` }}>
                    <meta.icon style={{ width: '13px', height: '13px', color: meta.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{item.name}</p>
                      <p className="font-heading font-semibold" style={{ fontSize: '12px', color: '#22C55E' }}>
                        {revenue >= 1_000_000 ? `${(revenue / 1_000_000).toFixed(1)}M` : formatPrice(revenue)}
                      </p>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(revenue / maxRev) * 100}%` }}
                        transition={{ duration: 0.9, delay: 0.4 + i * 0.1, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: meta.color, boxShadow: `0 0 8px ${meta.glow}` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateCaseModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
        )}
        {addRewardTo && (
          <AddRewardModal
            caseId={addRewardTo.id}
            caseName={addRewardTo.name}
            onClose={() => setAddRewardTo(null)}
            onAdded={r => { handleRewardAdded(addRewardTo.id, r); setAddRewardTo(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
