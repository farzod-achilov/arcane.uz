'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Package, Search, Sparkles, CheckCircle2, AlertCircle,
  ImageIcon, Star, DollarSign, Gamepad2, Monitor, Plus,
  ChevronRight, Loader2,
} from 'lucide-react';
import { arcaneApi } from '@/lib/arcaneApi';
import type { GameStockInfo } from '@/lib/admin/adminKeysTypes';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GameFormData {
  title: string;
  cover: string;
  description: string;
  genres: string[];
  platforms: string[];
  priceUsd: string;
  rating: string;
  developer: string;
  publisher: string;
}

// Mock search results from external APIs
const MOCK_SEARCH_RESULTS = [
  {
    id: 'rawg-3498',   source: 'RAWG',  title: 'Grand Theft Auto V',
    cover: 'https://picsum.photos/seed/gta5/300/400',
    rating: 97, priceUsd: 29.99, genres: ['Action', 'Open World'],
    platforms: ['PC', 'PS5', 'Xbox'], developer: 'Rockstar Games', publisher: 'Rockstar Games',
  },
  {
    id: 'rawg-28',     source: 'RAWG',  title: 'Red Dead Redemption 2',
    cover: 'https://picsum.photos/seed/rdr2/300/400',
    rating: 96, priceUsd: 59.99, genres: ['Action', 'Adventure'],
    platforms: ['PC', 'PS4', 'Xbox One'], developer: 'Rockstar Games', publisher: 'Rockstar Games',
  },
  {
    id: 'steam-1245620', source: 'Steam', title: 'Elden Ring',
    cover: 'https://picsum.photos/seed/elden2/300/400',
    rating: 96, priceUsd: 59.99, genres: ['RPG', 'Action'],
    platforms: ['PC', 'PS5', 'Xbox Series'], developer: 'FromSoftware', publisher: 'Bandai Namco',
  },
  {
    id: 'igdb-121',    source: 'IGDB',  title: 'The Witcher 3: Wild Hunt',
    cover: 'https://picsum.photos/seed/witch3/300/400',
    rating: 93, priceUsd: 39.99, genres: ['RPG', 'Open World'],
    platforms: ['PC', 'PS5', 'Xbox', 'Switch'], developer: 'CD Projekt Red', publisher: 'CD Projekt',
  },
  {
    id: 'rawg-11859',  source: 'RAWG',  title: 'Cyberpunk 2077',
    cover: 'https://picsum.photos/seed/cyber2/300/400',
    rating: 86, priceUsd: 49.99, genres: ['RPG', 'Action'],
    platforms: ['PC', 'PS5', 'Xbox Series'], developer: 'CD Projekt Red', publisher: 'CD Projekt',
  },
  {
    id: 'steam-1086940', source: 'Steam', title: 'Baldur\'s Gate 3',
    cover: 'https://picsum.photos/seed/bg4/300/400',
    rating: 96, priceUsd: 59.99, genres: ['RPG', 'Turn-Based'],
    platforms: ['PC', 'PS5'], developer: 'Larian Studios', publisher: 'Larian Studios',
  },
];

const GENRE_OPTIONS = [
  'Action', 'RPG', 'Strategy', 'Adventure', 'Simulation',
  'Sports', 'Horror', 'Racing', 'Puzzle', 'Open World',
  'Shooter', 'Fighting', 'Platformer', 'Survival',
];

const PLATFORM_OPTIONS = [
  'PC', 'PS5', 'PS4', 'Xbox Series', 'Xbox One', 'Switch', 'Mac', 'Linux',
];

const SOURCE_BADGES: Record<string, string> = {
  RAWG: '#F59E0B', Steam: '#66C0F4', IGDB: '#9D60FA',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function assignHealth(priceUsd: number, rating: number): GameStockInfo['health'] {
  return 'EMPTY'; // new game has no keys yet
}

function getRarity(priceUsd: number, rating: number): { label: string; color: string } {
  if (priceUsd >= 50 && rating >= 85) return { label: 'LEGENDARY', color: '#F59E0B' };
  if (priceUsd >= 25 && rating >= 75) return { label: 'EPIC',      color: '#9D60FA' };
  if (priceUsd >= 10 || rating >= 60)  return { label: 'RARE',      color: '#06B6D4' };
  return                                       { label: 'COMMON',    color: '#6B7280' };
}

// ── Small tag component ───────────────────────────────────────────────────────

function Tag({ label, color, onRemove }: { label: string; color: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg px-2 py-0.5"
         style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
      <span className="font-pixel" style={{ fontSize: '8px', color, letterSpacing: '0.04em' }}>{label}</span>
      <button onClick={onRemove} className="transition-opacity hover:opacity-60">
        <X style={{ width: '9px', height: '9px', color }} />
      </button>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onSuccess: (game: Partial<GameStockInfo>) => void;
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function AddGameModal({ onClose, onSuccess }: Props) {
  const [tab, setTab]               = useState<'manual' | 'search'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching]   = useState(false);
  const [searchResults, setResults] = useState(MOCK_SEARCH_RESULTS);
  const [selected, setSelected]     = useState<typeof MOCK_SEARCH_RESULTS[0] | null>(null);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState('');
  const [genreInput, setGenreInput] = useState('');
  const [platInput, setPlatInput]   = useState('');

  const [form, setForm] = useState<GameFormData>({
    title: '', cover: '', description: '',
    genres: [], platforms: [], priceUsd: '',
    rating: '', developer: '', publisher: '',
  });

  // Apply API search result to form
  const applyResult = (r: typeof MOCK_SEARCH_RESULTS[0]) => {
    setSelected(r);
    setForm({
      title: r.title,
      cover: r.cover,
      description: `${r.title} — imported from ${r.source}`,
      genres: r.genres,
      platforms: r.platforms,
      priceUsd: String(r.priceUsd),
      rating: String(r.rating),
      developer: r.developer,
      publisher: r.publisher,
    });
    setTab('manual');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    await new Promise(r => setTimeout(r, 900));
    const q = searchQuery.toLowerCase();
    setResults(MOCK_SEARCH_RESULTS.filter(g => g.title.toLowerCase().includes(q)));
    setSearching(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await arcaneApi.games.create({
        title:       form.title.trim(),
        cover:       form.cover       || undefined,
        description: form.description || undefined,
        genres:      form.genres.length    ? form.genres    : undefined,
        platforms:   form.platforms.length ? form.platforms : undefined,
        priceUsd:    form.priceUsd ? parseFloat(form.priceUsd) : undefined,
        rating:      form.rating   ? parseFloat(form.rating)   : undefined,
        developer:   form.developer || undefined,
        publisher:   form.publisher || undefined,
        source:      selected ? selected.source.toLowerCase() : 'manual',
      });

      setSaved(true);
      const created = res.data;
      setTimeout(() => {
        onSuccess({
          gameId: created.id,
          title:  created.title,
          cover:  created.cover,
          stockStore: 0, stockDrop: 0, stockBoth: 0,
          sold: 0, disabled: 0, reserved: 0,
          lowStockThreshold: 5,
          isActive: true,
          health: 'EMPTY',
          lastDeliveredAt: null,
        });
        onClose();
      }, 1200);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка сервера';

      // Graceful fallback — arcane-api offline → добавляем в локальное состояние
      const isOffline = msg.includes('fetch') || msg.includes('502') ||
                        msg.includes('503')   || msg.includes('TOKEN');
      if (isOffline) {
        console.warn('[AddGame] arcane-api недоступен, используем локальное состояние');
        setSaved(true);
        setTimeout(() => {
          onSuccess({
            gameId: `local-${Date.now()}`,
            title:  form.title,
            cover:  form.cover || null,
            stockStore: 0, stockDrop: 0, stockBoth: 0,
            sold: 0, disabled: 0, reserved: 0,
            lowStockThreshold: 5,
            isActive: true,
            health: 'EMPTY',
            lastDeliveredAt: null,
          });
          onClose();
        }, 1200);
        return;
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const rarity = getRarity(parseFloat(form.priceUsd) || 0, parseFloat(form.rating) || 0);
  const isFormValid = form.title.trim().length >= 2;

  const field = (
    key: keyof GameFormData,
    placeholder: string,
    icon: React.ElementType,
    type = 'text',
    half = false
  ) => {
    const Icon = icon;
    return (
      <div className={half ? 'flex-1' : 'w-full'}>
        <div className="relative">
          <Icon style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '12px', color: '#4B5563' }} />
          <input
            type={type}
            value={form[key] as string}
            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
            placeholder={placeholder}
            className="w-full rounded-xl font-body outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#E2E8F0', fontSize: '12px',
              padding: '9px 12px 9px 30px',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="w-full flex overflow-hidden rounded-2xl"
        style={{
          maxWidth: '920px', maxHeight: '90vh',
          background: '#09090F',
          border: '1px solid rgba(124,58,237,0.2)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.1)',
        }}
      >
        {/* ── Left panel: form / search ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
               style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3))', border: '1px solid rgba(124,58,237,0.3)' }}>
                <Plus style={{ width: '14px', height: '14px', color: '#C4B5FD' }} />
              </div>
              <div>
                <p className="font-heading font-bold text-white" style={{ fontSize: '14px' }}>Добавить игру</p>
                <p className="font-body text-[#4B5563]" style={{ fontSize: '10px' }}>в Key Inventory System</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
              <X style={{ width: '13px', height: '13px', color: '#6B7280' }} />
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1.5 px-6 pt-4 flex-shrink-0">
            {([
              { id: 'search', label: 'Поиск в API', icon: Sparkles },
              { id: 'manual', label: 'Вручную',     icon: Package  },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-body transition-all"
                style={{
                  background: tab === t.id ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${tab === t.id ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  fontSize: '12px',
                  color: tab === t.id ? '#C4B5FD' : '#4B5563',
                }}>
                <t.icon style={{ width: '12px', height: '12px' }} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">

              {/* ── SEARCH TAB ── */}
              {tab === 'search' && (
                <motion.div key="search"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}
                  className="p-6 space-y-4">

                  {/* Search box */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', color: '#4B5563' }} />
                      <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Название игры... (Enter для поиска)"
                        className="w-full rounded-xl font-body outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(124,58,237,0.2)',
                          color: '#E2E8F0', fontSize: '12px',
                          padding: '10px 12px 10px 30px',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)')}
                      />
                    </div>
                    <button onClick={handleSearch}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-body transition-all"
                      style={{ background: 'rgba(124,58,237,0.85)', fontSize: '12px', color: '#fff', boxShadow: '0 0 14px rgba(124,58,237,0.2)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.85)')}>
                      {searching
                        ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                        : <Search style={{ width: '13px', height: '13px' }} />}
                      Искать
                    </button>
                  </div>

                  {/* Source badges */}
                  <div className="flex items-center gap-2">
                    <p className="font-body text-[#374151]" style={{ fontSize: '10px' }}>Источники:</p>
                    {Object.entries(SOURCE_BADGES).map(([src, color]) => (
                      <span key={src} className="font-pixel rounded px-2 py-0.5"
                        style={{ fontSize: '7px', color, background: `${color}12`, border: `1px solid ${color}25`, letterSpacing: '0.06em' }}>
                        {src}
                      </span>
                    ))}
                  </div>

                  {/* Results */}
                  <div className="space-y-2">
                    {searching && Array.from({ length: 3 }).map((_, i) => (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                        className="h-16 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    ))}

                    {!searching && searchResults.map((r, i) => (
                      <motion.div key={r.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => applyResult(r)}
                        className="flex items-center gap-3 rounded-xl p-3 cursor-pointer group transition-all"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                        onMouseEnter={e => {
                          (e.currentTarget.style.background = 'rgba(124,58,237,0.07)');
                          (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)');
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget.style.background = 'rgba(255,255,255,0.02)');
                          (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)');
                        }}>
                        {/* Cover */}
                        <div className="relative w-10 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={r.cover} alt={r.title} fill unoptimized className="object-cover" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-heading font-semibold text-white truncate" style={{ fontSize: '13px' }}>{r.title}</p>
                            <span className="font-pixel rounded px-1.5 py-0.5 flex-shrink-0"
                              style={{ fontSize: '7px', color: SOURCE_BADGES[r.source], background: `${SOURCE_BADGES[r.source]}12`, letterSpacing: '0.04em' }}>
                              {r.source}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Star style={{ width: '10px', height: '10px', color: '#F59E0B' }} />
                              <span className="font-body text-[#9CA3AF]" style={{ fontSize: '10px' }}>{r.rating}</span>
                            </div>
                            <span className="font-body text-[#22C55E]" style={{ fontSize: '10px' }}>${r.priceUsd}</span>
                            <div className="flex gap-1">
                              {r.genres.slice(0, 2).map(g => (
                                <span key={g} className="font-body text-[#374151]" style={{ fontSize: '9px' }}>{g}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight style={{ width: '14px', height: '14px', color: '#374151', flexShrink: 0 }}
                          className="group-hover:!text-[#7C3AED] transition-colors" />
                      </motion.div>
                    ))}

                    {!searching && searchResults.length === 0 && (
                      <div className="text-center py-8">
                        <Package style={{ width: '24px', height: '24px', color: '#1F2937', margin: '0 auto 8px' }} />
                        <p className="font-body text-[#374151]" style={{ fontSize: '12px' }}>Игры не найдены</p>
                        <button onClick={() => setTab('manual')}
                          className="font-body mt-2 transition-colors"
                          style={{ fontSize: '11px', color: '#7C3AED' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#9D60FA')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#7C3AED')}>
                          Добавить вручную →
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── MANUAL TAB ── */}
              {tab === 'manual' && (
                <motion.div key="manual"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}
                  className="p-6 space-y-4">

                  {selected && (
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                         style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)' }}>
                      <Sparkles style={{ width: '12px', height: '12px', color: '#9D60FA' }} />
                      <p className="font-body text-[#9CA3AF]" style={{ fontSize: '11px' }}>
                        Данные импортированы из <span style={{ color: SOURCE_BADGES[selected.source] }}>{selected.source}</span> · Проверьте и сохраните
                      </p>
                    </div>
                  )}

                  {/* Success */}
                  {saved && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-2 rounded-xl px-4 py-3"
                      style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <CheckCircle2 style={{ width: '14px', height: '14px', color: '#22C55E' }} />
                      <p className="font-body text-[#22C55E]" style={{ fontSize: '12px' }}>Игра «{form.title}» успешно добавлена!</p>
                    </motion.div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="font-body text-[#4B5563] mb-1.5 block" style={{ fontSize: '10px' }}>
                      Название игры *
                    </label>
                    <div className="relative">
                      <Gamepad2 style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', color: '#4B5563' }} />
                      <input
                        value={form.title}
                        onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="Название игры"
                        className="w-full rounded-xl font-heading font-semibold outline-none transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${!form.title && 'required' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.07)'}`,
                          color: '#E2E8F0', fontSize: '15px',
                          padding: '10px 12px 10px 32px',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                      />
                    </div>
                  </div>

                  {/* Cover URL */}
                  <div>
                    <label className="font-body text-[#4B5563] mb-1.5 block" style={{ fontSize: '10px' }}>Обложка (URL)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <ImageIcon style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '12px', color: '#4B5563' }} />
                        <input value={form.cover} onChange={e => setForm(p => ({ ...p, cover: e.target.value }))}
                          placeholder="https://..."
                          className="w-full rounded-xl font-body outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#E2E8F0', fontSize: '12px', padding: '9px 12px 9px 30px' }}
                          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)')}
                          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')} />
                      </div>
                      {form.cover && (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={form.cover} alt="" fill unoptimized className="object-cover"
                            onError={() => setForm(p => ({ ...p, cover: '' }))} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="font-body text-[#4B5563] mb-1.5 block" style={{ fontSize: '10px' }}>Описание</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Краткое описание игры..."
                      rows={2}
                      className="w-full rounded-xl font-body outline-none resize-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#E2E8F0', fontSize: '12px', padding: '9px 12px' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')} />
                  </div>

                  {/* Price + Rating */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="font-body text-[#4B5563] mb-1.5 block" style={{ fontSize: '10px' }}>Цена USD</label>
                      <div className="relative">
                        <DollarSign style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '12px', color: '#4B5563' }} />
                        <input type="number" value={form.priceUsd} onChange={e => setForm(p => ({ ...p, priceUsd: e.target.value }))}
                          placeholder="59.99" min={0} step={0.01}
                          className="w-full rounded-xl font-body outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#E2E8F0', fontSize: '12px', padding: '9px 12px 9px 30px' }}
                          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(34,197,94,0.35)')}
                          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="font-body text-[#4B5563] mb-1.5 block" style={{ fontSize: '10px' }}>Рейтинг (0–100)</label>
                      <div className="relative">
                        <Star style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '12px', color: '#4B5563' }} />
                        <input type="number" value={form.rating} onChange={e => setForm(p => ({ ...p, rating: e.target.value }))}
                          placeholder="85" min={0} max={100}
                          className="w-full rounded-xl font-body outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#E2E8F0', fontSize: '12px', padding: '9px 12px 9px 30px' }}
                          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.35)')}
                          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')} />
                      </div>
                    </div>
                  </div>

                  {/* Developer + Publisher */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="font-body text-[#4B5563] mb-1.5 block" style={{ fontSize: '10px' }}>Разработчик</label>
                      <input value={form.developer} onChange={e => setForm(p => ({ ...p, developer: e.target.value }))}
                        placeholder="CD Projekt Red"
                        className="w-full rounded-xl font-body outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#E2E8F0', fontSize: '12px', padding: '9px 12px' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')} />
                    </div>
                    <div className="flex-1">
                      <label className="font-body text-[#4B5563] mb-1.5 block" style={{ fontSize: '10px' }}>Издатель</label>
                      <input value={form.publisher} onChange={e => setForm(p => ({ ...p, publisher: e.target.value }))}
                        placeholder="Издатель"
                        className="w-full rounded-xl font-body outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#E2E8F0', fontSize: '12px', padding: '9px 12px' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')} />
                    </div>
                  </div>

                  {/* Genres */}
                  <div>
                    <label className="font-body text-[#4B5563] mb-1.5 block" style={{ fontSize: '10px' }}>Жанры</label>
                    {form.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {form.genres.map(g => (
                          <Tag key={g} label={g} color="#9D60FA"
                            onRemove={() => setForm(p => ({ ...p, genres: p.genres.filter(x => x !== g) }))} />
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {GENRE_OPTIONS.filter(g => !form.genres.includes(g)).map(g => (
                        <button key={g} onClick={() => setForm(p => ({ ...p, genres: [...p.genres, g] }))}
                          className="px-2 py-0.5 rounded-lg font-pixel transition-all"
                          style={{ background: 'rgba(157,96,250,0.06)', border: '1px solid rgba(157,96,250,0.15)', fontSize: '8px', color: '#4B5563', letterSpacing: '0.04em' }}
                          onMouseEnter={e => { (e.currentTarget.style.color = '#9D60FA'); (e.currentTarget.style.borderColor = 'rgba(157,96,250,0.3)'); }}
                          onMouseLeave={e => { (e.currentTarget.style.color = '#4B5563'); (e.currentTarget.style.borderColor = 'rgba(157,96,250,0.15)'); }}>
                          + {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Platforms */}
                  <div>
                    <label className="font-body text-[#4B5563] mb-1.5 block" style={{ fontSize: '10px' }}>Платформы</label>
                    {form.platforms.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {form.platforms.map(p => (
                          <Tag key={p} label={p} color="#06B6D4"
                            onRemove={() => setForm(prev => ({ ...prev, platforms: prev.platforms.filter(x => x !== p) }))} />
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {PLATFORM_OPTIONS.filter(p => !form.platforms.includes(p)).map(p => (
                        <button key={p} onClick={() => setForm(prev => ({ ...prev, platforms: [...prev.platforms, p] }))}
                          className="px-2 py-0.5 rounded-lg font-pixel transition-all"
                          style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)', fontSize: '8px', color: '#4B5563', letterSpacing: '0.04em' }}
                          onMouseEnter={e => { (e.currentTarget.style.color = '#06B6D4'); (e.currentTarget.style.borderColor = 'rgba(6,182,212,0.3)'); }}
                          onMouseLeave={e => { (e.currentTarget.style.color = '#4B5563'); (e.currentTarget.style.borderColor = 'rgba(6,182,212,0.15)'); }}>
                          + {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Error */}
                  {!isFormValid && form.title !== '' && (
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                         style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <AlertCircle style={{ width: '12px', height: '12px', color: '#EF4444' }} />
                      <p className="font-body text-[#F87171]" style={{ fontSize: '11px' }}>Минимальная длина названия — 2 символа</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {tab === 'manual' && (
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                 style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
                {isFormValid ? `Готово к сохранению` : 'Заполните название игры'}
              </p>
              <div className="flex gap-2">
                <button onClick={onClose}
                  className="px-4 py-2 rounded-xl font-body transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#6B7280', fontSize: '12px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
                  Отмена
                </button>
                <button onClick={handleSave} disabled={!isFormValid || saving || saved}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl font-body transition-all"
                  style={{
                    background: isFormValid ? 'rgba(124,58,237,0.9)' : 'rgba(255,255,255,0.05)',
                    color: isFormValid ? '#fff' : '#374151',
                    fontSize: '12px',
                    boxShadow: isFormValid ? '0 0 16px rgba(124,58,237,0.3)' : 'none',
                    cursor: !isFormValid || saving ? 'not-allowed' : 'pointer',
                  }}>
                  {saving
                    ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    : <CheckCircle2 style={{ width: '13px', height: '13px' }} />}
                  {saving ? 'Сохраняем...' : 'Добавить игру'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel: preview ── */}
        <div className="w-72 flex-shrink-0 flex flex-col"
             style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
          <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="font-body text-[#374151]" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Предпросмотр
            </p>
          </div>

          <div className="p-4 flex-1">
            {/* Game card preview */}
            <div className="rounded-2xl overflow-hidden"
                 style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)' }}>
              {/* Cover */}
              <div className="relative h-40 bg-[#0A0A14]">
                <AnimatePresence mode="wait">
                  {form.cover ? (
                    <motion.div key={form.cover} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                      <Image src={form.cover} alt="" fill unoptimized className="object-cover" />
                    </motion.div>
                  ) : (
                    <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center">
                      <Package style={{ width: '28px', height: '28px', color: '#1F2937' }} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="absolute inset-0"
                     style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(13,13,26,0.95) 100%)' }} />
                {/* Rarity badge */}
                {(form.priceUsd || form.rating) && (
                  <div className="absolute top-2 right-2 font-pixel rounded-lg px-2 py-1"
                       style={{ fontSize: '8px', color: rarity.color, background: `${rarity.color}15`, border: `1px solid ${rarity.color}30`, letterSpacing: '0.06em' }}>
                    {rarity.label}
                  </div>
                )}
                {/* EMPTY badge */}
                <div className="absolute top-2 left-2 font-pixel rounded-lg px-2 py-1"
                     style={{ fontSize: '7px', color: '#6B7280', background: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.2)', letterSpacing: '0.04em' }}>
                  НЕТ КЛЮЧЕЙ
                </div>
              </div>

              <div className="p-3 space-y-2">
                <p className="font-heading font-bold text-white" style={{ fontSize: '13px', minHeight: '18px' }}>
                  {form.title || <span style={{ color: '#1F2937' }}>Название игры</span>}
                </p>

                {/* Genre tags */}
                {form.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {form.genres.slice(0, 3).map(g => (
                      <span key={g} className="font-pixel rounded px-1.5 py-0.5"
                        style={{ fontSize: '7px', color: '#9D60FA', background: 'rgba(157,96,250,0.1)', letterSpacing: '0.04em' }}>
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex gap-3 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  {form.rating && (
                    <div className="flex items-center gap-1">
                      <Star style={{ width: '10px', height: '10px', color: '#F59E0B' }} />
                      <span className="font-body text-[#9CA3AF]" style={{ fontSize: '10px' }}>{form.rating}</span>
                    </div>
                  )}
                  {form.priceUsd && (
                    <div className="flex items-center gap-1">
                      <DollarSign style={{ width: '10px', height: '10px', color: '#22C55E' }} />
                      <span className="font-body text-[#22C55E]" style={{ fontSize: '10px' }}>{form.priceUsd}</span>
                    </div>
                  )}
                </div>

                {/* Platform chips */}
                {form.platforms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {form.platforms.slice(0, 3).map(p => (
                      <span key={p} className="font-body rounded px-1.5 py-0.5"
                        style={{ fontSize: '9px', color: '#374151', background: 'rgba(255,255,255,0.04)' }}>
                        {p}
                      </span>
                    ))}
                    {form.platforms.length > 3 && (
                      <span className="font-body text-[#374151]" style={{ fontSize: '9px' }}>+{form.platforms.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Stock zeros */}
                <div className="flex gap-3 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  {[{ l: 'STORE', c: '#06B6D4' }, { l: 'DROP', c: '#F59E0B' }].map(s => (
                    <div key={s.l}>
                      <p className="font-pixel mb-0" style={{ fontSize: '7px', color: '#374151', letterSpacing: '0.06em' }}>{s.l}</p>
                      <p className="font-heading font-bold" style={{ fontSize: '16px', color: '#1F2937' }}>0</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Auto-rarity hint */}
            {(form.priceUsd || form.rating) && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-xl p-3"
                style={{ background: `${rarity.color}08`, border: `1px solid ${rarity.color}20` }}>
                <p className="font-body text-[#4B5563] mb-1" style={{ fontSize: '10px' }}>Авто-рарити наград:</p>
                <p className="font-pixel" style={{ fontSize: '10px', color: rarity.color, letterSpacing: '0.06em' }}>
                  {rarity.label}
                </p>
                <p className="font-body text-[#374151] mt-1" style={{ fontSize: '9px' }}>
                  На основе цены ${form.priceUsd || '—'} и рейтинга {form.rating || '—'}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
