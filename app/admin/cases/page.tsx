'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, Star, Zap, TrendingUp, Package, Crown, Sparkles,
  Edit2, Check, X, Plus, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight,
} from 'lucide-react';
import { ADMIN_CASES } from '@/lib/admin/mockAdminData';
import { formatPrice } from '@/lib/utils';
import type { CaseItem } from '@/lib/admin/adminTypes';

/* ── Rarity config ──────────────────────────────────────── */
const RARITY_META = {
  silver: {
    label: 'Silver',
    color: '#9CA3AF',
    glow: '#9CA3AF30',
    bg: 'linear-gradient(135deg, #1A1A25, #12121C)',
    border: 'rgba(156,163,175,0.25)',
    glowBorder: 'rgba(156,163,175,0.5)',
    icon: Star,
    particleColor: '#9CA3AF',
    headerGradient: 'linear-gradient(135deg, rgba(156,163,175,0.15), rgba(156,163,175,0.04))',
  },
  gold: {
    label: 'Gold',
    color: '#F59E0B',
    glow: '#F59E0B30',
    bg: 'linear-gradient(135deg, #1C1A10, #14120A)',
    border: 'rgba(245,158,11,0.3)',
    glowBorder: 'rgba(245,158,11,0.6)',
    icon: Crown,
    particleColor: '#F59E0B',
    headerGradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.04))',
  },
  arcane: {
    label: 'Arcane',
    color: '#7C3AED',
    glow: '#7C3AED35',
    bg: 'linear-gradient(135deg, #130D1E, #0D0912)',
    border: 'rgba(124,58,237,0.35)',
    glowBorder: 'rgba(124,58,237,0.65)',
    icon: Sparkles,
    particleColor: '#7C3AED',
    headerGradient: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(124,58,237,0.05))',
  },
};

/* ── Drop chance bar ────────────────────────────────────── */
function DropBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-body text-[#6B7280] w-20 text-right flex-shrink-0" style={{ fontSize: '10.5px' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}50` }}
        />
      </div>
      <span className="font-heading font-bold w-8 text-right flex-shrink-0"
            style={{ fontSize: '11.5px', color }}>{pct}%</span>
    </div>
  );
}

/* ── Case card ──────────────────────────────────────────── */
function CaseCard({
  item, onToggleFeatured, onEdit,
}: {
  item: CaseItem;
  onToggleFeatured: (id: string) => void;
  onEdit: (item: CaseItem) => void;
}) {
  const meta = RARITY_META[item.rarity];
  const RarityIcon = meta.icon;
  const dropEntries = Object.entries(item.dropChance);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, boxShadow: `0 16px 48px ${meta.glow}` }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden relative"
      style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px"
           style={{ background: `linear-gradient(90deg, transparent, ${meta.color}60, transparent)` }} />

      {/* Corner glow */}
      <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none"
           style={{ background: `radial-gradient(circle at top right, ${meta.glow}, transparent 65%)` }} />

      {/* Header */}
      <div className="p-5" style={{ background: meta.headerGradient }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `${meta.color}15`,
                border: `1px solid ${meta.border}`,
                boxShadow: `0 0 20px ${meta.glow}, inset 0 0 12px ${meta.glow}`,
              }}
            >
              <RarityIcon style={{ width: '22px', height: '22px', color: meta.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="font-pixel"
                  style={{ fontSize: '7px', color: meta.color, letterSpacing: '0.1em', textShadow: `0 0 8px ${meta.color}` }}
                >
                  {meta.label.toUpperCase()}
                </span>
                {item.featured && (
                  <span
                    className="font-pixel rounded px-1.5 py-0.5"
                    style={{ fontSize: '6px', color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', letterSpacing: '0.06em' }}
                  >
                    FEATURED
                  </span>
                )}
              </div>
              <p className="font-heading font-bold text-white" style={{ fontSize: '16px' }}>{item.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => onToggleFeatured(item.id)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
              style={{
                background: item.featured ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${item.featured ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
              title="Toggle Featured"
            >
              <Star style={{ width: '13px', height: '13px', color: item.featured ? '#F59E0B' : '#374151' }} />
            </button>
            <button
              onClick={() => onEdit(item)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Edit2 style={{ width: '13px', height: '13px', color: '#6B7280' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Price + stats */}
      <div className="px-5 py-3 flex items-center gap-4" style={{ borderTop: `1px solid ${meta.border}`, borderBottom: `1px solid ${meta.border}` }}>
        <div>
          <p className="font-body text-[#374151]" style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Цена</p>
          <p className="font-pixel" style={{ fontSize: '16px', color: meta.color, textShadow: `0 0 10px ${meta.color}60` }}>
            {formatPrice(item.price)}
          </p>
        </div>
        <div style={{ borderLeft: `1px solid ${meta.border}`, paddingLeft: '16px' }}>
          <p className="font-body text-[#374151]" style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Открыто</p>
          <p className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>{item.totalOpened.toLocaleString('ru')}</p>
        </div>
        <div style={{ borderLeft: `1px solid ${meta.border}`, paddingLeft: '16px' }}>
          <p className="font-body text-[#374151]" style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Выручка</p>
          <p className="font-heading font-bold text-[#22C55E]" style={{ fontSize: '13px' }}>
            {(item.totalRevenue / 1000000).toFixed(1)}M
          </p>
        </div>
      </div>

      {/* Rewards list */}
      <div className="px-5 py-4">
        <p className="font-body text-[#374151] mb-2.5" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Возможные награды
        </p>
        <div className="space-y-1.5 mb-4">
          {item.rewards.map((reward, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: meta.color }} />
              <span className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{reward}</span>
            </div>
          ))}
        </div>

        {/* Drop chances */}
        <div className="space-y-2">
          {dropEntries.map(([key, pct]) => (
            <DropBar key={key} label={key} pct={pct} color={meta.color} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Edit Modal ─────────────────────────────────────────── */
function EditModal({
  item, onClose, onSave,
}: {
  item: CaseItem;
  onClose: () => void;
  onSave: (updated: CaseItem) => void;
}) {
  const [form, setForm] = useState({ ...item });
  const [newReward, setNewReward] = useState('');
  const meta = RARITY_META[item.rarity];

  const addReward = () => {
    if (!newReward.trim()) return;
    setForm(f => ({ ...f, rewards: [...f.rewards, newReward.trim()] }));
    setNewReward('');
  };

  const removeReward = (i: number) =>
    setForm(f => ({ ...f, rewards: f.rewards.filter((_, idx) => idx !== i) }));

  const setDropChance = (key: string, val: number) =>
    setForm(f => ({ ...f, dropChance: { ...f.dropChance, [key]: val } }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 99999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.25 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#0E0E1A', border: `1px solid ${meta.border}`, boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 48px ${meta.glow}` }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${meta.border}`, background: meta.headerGradient }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: `${meta.color}15`, border: `1px solid ${meta.border}` }}>
              <Gift style={{ width: '14px', height: '14px', color: meta.color }} />
            </div>
            <h2 className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>
              Редактировать: {item.title}
            </h2>
          </div>
          <button onClick={onClose} className="text-[#374151] hover:text-[#9CA3AF] transition-colors">
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {/* Title + price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-[#374151] mb-1.5 block" style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Название
              </label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-white font-body outline-none"
                style={{ background: '#09090E', border: `1px solid ${meta.border}`, fontSize: '13px' }}
              />
            </div>
            <div>
              <label className="font-body text-[#374151] mb-1.5 block" style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Цена (сум)
              </label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: +e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-white font-heading font-bold outline-none"
                style={{ background: '#09090E', border: `1px solid ${meta.border}`, fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Featured toggle */}
          <div className="flex items-center justify-between rounded-xl px-4 py-3"
               style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <p className="font-body text-[#9CA3AF]" style={{ fontSize: '13px' }}>Featured кейс</p>
              <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>Показывать на витрине</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, featured: !f.featured }))}>
              <motion.div
                animate={{ background: form.featured ? 'linear-gradient(90deg, #7C3AED, #06B6D4)' : '#1A1A28' }}
                transition={{ duration: 0.2 }}
                style={{ width: '40px', height: '22px', borderRadius: '11px', position: 'relative' }}
              >
                <motion.div
                  animate={{ x: form.featured ? '18px' : '2px' }}
                  transition={{ duration: 0.2 }}
                  style={{ position: 'absolute', top: '2px', width: '18px', height: '18px', borderRadius: '9px', background: '#fff' }}
                />
              </motion.div>
            </button>
          </div>

          {/* Rewards */}
          <div>
            <p className="font-body text-[#374151] mb-2.5" style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Список наград
            </p>
            <div className="space-y-2 mb-2.5">
              {form.rewards.map((r, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2"
                     style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${meta.border}` }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                  <span className="flex-1 font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{r}</span>
                  <button onClick={() => removeReward(i)}>
                    <X style={{ width: '12px', height: '12px', color: '#374151' }} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newReward}
                onChange={e => setNewReward(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addReward()}
                placeholder="Новая награда..."
                className="flex-1 rounded-xl px-3 py-2 text-white font-body outline-none placeholder:text-[#1F2937]"
                style={{ background: '#09090E', border: `1px solid ${meta.border}`, fontSize: '12px' }}
              />
              <button
                onClick={addReward}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${meta.color}15`, border: `1px solid ${meta.border}`, color: meta.color }}
              >
                <Plus style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          </div>

          {/* Drop chances */}
          <div>
            <p className="font-body text-[#374151] mb-3" style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Шансы дропа
            </p>
            <div className="space-y-3">
              {Object.entries(form.dropChance).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="font-body text-[#6B7280] w-24 flex-shrink-0" style={{ fontSize: '12px' }}>{key}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={val}
                    onChange={e => setDropChance(key, +e.target.value)}
                    className="flex-1"
                    style={{ accentColor: meta.color }}
                  />
                  <span className="font-heading font-bold w-10 text-right"
                        style={{ fontSize: '12px', color: meta.color }}>{val}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderTop: `1px solid ${meta.border}` }}>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-2.5 font-body transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '13px',
              color: '#6B7280',
            }}
          >
            Отмена
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 rounded-xl py-2.5 font-heading font-semibold text-white flex items-center justify-center gap-2 transition-all"
            style={{
              background: `linear-gradient(135deg, ${meta.color}, ${meta.color}99)`,
              fontSize: '13px',
              boxShadow: `0 0 20px ${meta.glow}`,
            }}
          >
            <Check style={{ width: '14px', height: '14px' }} />
            Сохранить
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main page ──────────────────────────────────────────── */
export default function AdminCasesPage() {
  const [cases, setCases]       = useState<CaseItem[]>(ADMIN_CASES);
  const [editItem, setEditItem] = useState<CaseItem | null>(null);

  const totalOpened  = cases.reduce((s, c) => s + c.totalOpened, 0);
  const totalRevenue = cases.reduce((s, c) => s + c.totalRevenue, 0);

  const toggleFeatured = (id: string) =>
    setCases(prev => prev.map(c => c.id === id ? { ...c, featured: !c.featured } : c));

  const saveEdit = (updated: CaseItem) => {
    setCases(prev => prev.map(c => c.id === updated.id ? updated : c));
    setEditItem(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#9D60FA', letterSpacing: '0.14em' }}>
            УПРАВЛЕНИЕ
          </p>
          <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>
            Mystery Cases
          </h1>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
            {cases.length} типа кейсов · {totalOpened.toLocaleString('ru')} открыто всего
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-semibold text-white transition-all self-start sm:self-auto"
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
            fontSize: '13px',
            boxShadow: '0 0 16px rgba(124,58,237,0.3)',
          }}
        >
          <Plus style={{ width: '14px', height: '14px' }} />
          Новый кейс
        </button>
      </motion.div>

      {/* ── Summary metric cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Всего открыто',   value: totalOpened.toLocaleString('ru'),           color: '#9D60FA', icon: Gift        },
          { label: 'Выручка кейсов',  value: `${(totalRevenue / 1000000).toFixed(1)}M`, color: '#22C55E', icon: TrendingUp  },
          { label: 'Silver кейсов',   value: cases.find(c => c.rarity === 'silver')?.totalOpened.toLocaleString('ru') ?? '0', color: '#9CA3AF', icon: Star },
          { label: 'Arcane кейсов',   value: cases.find(c => c.rarity === 'arcane')?.totalOpened.toLocaleString('ru') ?? '0', color: '#7C3AED', icon: Sparkles },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: '#0D0D1A', border: `1px solid ${s.color}18` }}
            whileHover={{ y: -2, boxShadow: `0 8px 24px ${s.color}18` }}
          >
            <div className="absolute top-0 right-0 w-20 h-20"
                 style={{ background: `radial-gradient(circle at top right, ${s.color}12, transparent 65%)` }} />
            <s.icon style={{ width: '14px', height: '14px', color: s.color, marginBottom: '10px' }} />
            <p className="font-pixel mb-0.5" style={{ fontSize: '16px', color: s.color }}>{s.value}</p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Case cards grid ── */}
      <div className="grid lg:grid-cols-3 gap-5">
        {cases.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
          >
            <CaseCard
              item={item}
              onToggleFeatured={toggleFeatured}
              onEdit={setEditItem}
            />
          </motion.div>
        ))}
      </div>

      {/* ── Revenue comparison ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl p-5"
        style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp style={{ width: '14px', height: '14px', color: '#9D60FA' }} />
          <h2 className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>
            Сравнение выручки по кейсам
          </h2>
        </div>
        <div className="space-y-4">
          {cases.map((item, i) => {
            const meta = RARITY_META[item.rarity];
            const maxRev = Math.max(...cases.map(c => c.totalRevenue));
            return (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: `${meta.color}12`, border: `1px solid ${meta.border}` }}>
                  <meta.icon style={{ width: '13px', height: '13px', color: meta.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>{item.title}</p>
                    <p className="font-heading font-semibold" style={{ fontSize: '12px', color: '#22C55E' }}>
                      {(item.totalRevenue / 1000000).toFixed(1)}M сум
                    </p>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.totalRevenue / maxRev) * 100}%` }}
                      transition={{ duration: 0.9, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: meta.color, boxShadow: `0 0 8px ${meta.glow}` }}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
                      Открыто: {item.totalOpened.toLocaleString('ru')}
                    </span>
                    <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>·</span>
                    <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
                      Средняя выручка: {formatPrice(Math.round(item.totalRevenue / item.totalOpened))}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Edit modal ── */}
      <AnimatePresence>
        {editItem && (
          <EditModal
            item={editItem}
            onClose={() => setEditItem(null)}
            onSave={saveEdit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
