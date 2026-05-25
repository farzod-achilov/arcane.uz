'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Package, Search, Sparkles, CheckCircle2, AlertCircle,
  ImageIcon, Star, DollarSign, Gamepad2, Plus,
  ChevronRight, Link2, Film,
} from 'lucide-react';
import { arcaneApi } from '@/lib/arcaneApi';
import type { GameStockInfo } from '@/lib/admin/adminKeysTypes';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  rawgId?: number;
  source: 'RAWG' | 'IGDB' | 'Steam';
  title: string;
  cover: string | null;
  screenshots: string[];
  trailer: string | null;
  rating: number | null;
  priceUsd: number | null;
  genres: string[];
  platforms: string[];
  developer: string | null;
  publisher: string | null;
  releaseDate: string | null;
}

interface GameFormData {
  title: string;
  cover: string;
  screenshots: string[];
  trailer: string;
  description: string;
  genres: string[];
  platforms: string[];
  priceUsd: string;
  rating: string;
  developer: string;
  publisher: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
  RAWG:  '#F59E0B',
  Steam: '#66C0F4',
};

const GENRE_OPTIONS = [
  'Action', 'RPG', 'Strategy', 'Adventure', 'Simulation',
  'Sports', 'Horror', 'Racing', 'Puzzle', 'Open World',
  'Shooter', 'Fighting', 'Platformer', 'Survival',
];

const PLATFORM_OPTIONS = [
  'PC', 'PS5', 'PS4', 'Xbox Series', 'Xbox One', 'Switch', 'Mac', 'Linux',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRarity(priceUsd: number, rating: number): { label: string; color: string } {
  if (priceUsd >= 50 && rating >= 85) return { label: 'LEGENDARY', color: '#F59E0B' };
  if (priceUsd >= 25 && rating >= 75) return { label: 'EPIC',      color: '#9D60FA' };
  if (priceUsd >= 10 || rating >= 60)  return { label: 'RARE',      color: '#06B6D4' };
  return                                       { label: 'COMMON',    color: '#6B7280' };
}

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
  onSuccess: (game: Partial<GameStockInfo> & { platforms?: string[]; priceUzs?: number; genres?: string[] }) => void;
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function AddGameModal({ onClose, onSuccess }: Props) {
  const [tab, setTab]                     = useState<'manual' | 'search'>('search');
  const [searchQuery, setSearchQuery]     = useState('');

  const [searching, setSearching]         = useState(false);
  const [searchResults, setResults]       = useState<SearchResult[]>([]);
  const [searchError, setSearchError]     = useState('');
  const [selected, setSelected]           = useState<SearchResult | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving]               = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [error, setError]                 = useState('');
  const [steamUrl, setSteamUrl]           = useState('');
  const [steamLoading, setSteamLoading]   = useState(false);
  const [steamError, setSteamError]       = useState('');
  const [screenshotInput, setScreenshotInput] = useState('');

  const [form, setForm] = useState<GameFormData>({
    title: '', cover: '', screenshots: [], trailer: '', description: '',
    genres: [], platforms: [], priceUsd: '', rating: '', developer: '', publisher: '',
  });

  // ── Search ──────────────────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    setResults([]);

    try {
      const q = encodeURIComponent(searchQuery.trim());
      const res  = await fetch(`/api/rawg/search?q=${q}&limit=10`);
      const json = await res.json();

      if (!json.success || !json.data?.length) {
        setSearchError(json.error || 'Ничего не найдено');
        return;
      }

      const sorted = [...json.data].sort((a: SearchResult, b: SearchResult) => (b.rating ?? 0) - (a.rating ?? 0));
      setResults(sorted);
    } catch {
      setSearchError('Ошибка соединения');
    } finally {
      setSearching(false);
    }
  };

  const applyResult = async (r: SearchResult) => {
    setSelected(r);
    setForm({
      title:       r.title,
      cover:       r.cover ?? '',
      screenshots: r.screenshots,
      trailer:     r.trailer ?? '',
      description: '',
      genres:      r.genres,
      platforms:   r.platforms,
      priceUsd:    r.priceUsd != null ? String(r.priceUsd) : '',
      rating:      r.rating   != null ? String(r.rating)   : '',
      developer:   r.developer  ?? '',
      publisher:   r.publisher  ?? '',
    });
    setTab('manual');

    // Fetch full details from RAWG (description, trailer, full screenshots)
    if (r.source === 'RAWG' && r.rawgId) {
      setDetailLoading(true);
      try {
        const res  = await fetch(`/api/rawg/game/${r.rawgId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setForm(prev => ({
            ...prev,
            description: d.description || prev.description,
            trailer:     d.trailer     ?? prev.trailer,
            screenshots: d.screenshots?.length ? d.screenshots : prev.screenshots,
          }));
          setSelected(prev => prev ? { ...prev, screenshots: d.screenshots ?? prev.screenshots, trailer: d.trailer ?? prev.trailer } : prev);
        }
      } catch { /* ignore */ } finally {
        setDetailLoading(false);
      }
    }
  };

  // ── Steam import ─────────────────────────────────────────────────────────────

  const handleSteamImport = async () => {
    setSteamError('');
    const match = steamUrl.match(/store\.steampowered\.com\/app\/(\d+)/);
    if (!match) {
      setSteamError('Неверная ссылка. Пример: https://store.steampowered.com/app/1245620/');
      return;
    }
    const appId = match[1];
    setSteamLoading(true);
    try {
      const res  = await fetch(`/api/steam/app/${appId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Ошибка Steam');
      const d = json.data;

      // All Steam movies encoded as video:SRC|THUMB; fallback to RAWG if none
      const steamMovies: Array<{ src: string; thumb: string }> = d.movies ?? [];
      let trailerUrl: string | null = steamMovies[0]?.src ?? null;

      if (!trailerUrl && d.title) {
        try {
          const cleanTitle = d.title
            .replace(/\b(Enhanced|Definitive|Remastered|Complete|Ultimate|Gold|Deluxe|Platinum|Edition|Redux|Anniversary)\b/gi, '')
            .replace(/\s+/g, ' ').trim();
          const srRes  = await fetch(`/api/rawg/search?q=${encodeURIComponent(cleanTitle)}&limit=1&precise=false`);
          const srJson = await srRes.json();
          const rawgId = srJson.data?.[0]?.rawgId;
          if (rawgId) {
            const dtRes  = await fetch(`/api/rawg/game/${rawgId}`);
            const dtJson = await dtRes.json();
            if (dtJson.success && dtJson.data?.trailer) trailerUrl = dtJson.data.trailer;
          }
        } catch { /* non-fatal */ }
      }

      // Encode each movie as "video:SRC|THUMB" (thumb may be empty string)
      const videoEntries = steamMovies.map(
        (m: { src: string; thumb: string }) => `video:${m.src}${m.thumb ? `|${m.thumb}` : ''}`
      );
      const allScreenshots = [...videoEntries, ...(d.screenshots ?? [])];

      const r: SearchResult = {
        id: `steam-${d.appId}`, source: 'Steam',
        title:    d.title, cover: d.cover ?? null,
        screenshots: allScreenshots, trailer: trailerUrl,
        rating: d.rating ?? null, priceUsd: d.priceUsd ?? null,
        genres: d.genres ?? [], platforms: d.platforms ?? [],
        developer: d.developer ?? null, publisher: d.publisher ?? null,
        releaseDate: null,
      };
      applyResult(r);
      setSteamUrl('');
    } catch (e) {
      setSteamError(e instanceof Error ? e.message : 'Не удалось загрузить данные');
    } finally {
      setSteamLoading(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await arcaneApi.games.create({
        title:       form.title.trim(),
        cover:       form.cover       || undefined,
        screenshots: form.screenshots.length ? form.screenshots : undefined,
        trailer:     form.trailer     || undefined,
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
          gameId: created.id, title: created.title, cover: created.cover,
          stockStore: 0, stockDrop: 0, stockBoth: 0,
          sold: 0, disabled: 0, reserved: 0,
          lowStockThreshold: 5, isActive: true, health: 'EMPTY',
          lastDeliveredAt: null,
          platforms: created.platforms, priceUzs: created.priceUzs ?? undefined, genres: created.genres,
        });
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сервера');
    } finally {
      setSaving(false);
    }
  };

  const rarity = getRarity(parseFloat(form.priceUsd) || 0, parseFloat(form.rating) || 0);
  const isFormValid = form.title.trim().length >= 2;

  // ── Render ────────────────────────────────────────────────────────────────────

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
          maxWidth: '940px', maxHeight: '90vh',
          background: '#09090F',
          border: '1px solid rgba(124,58,237,0.2)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.1)',
        }}
      >
        {/* ── Left panel ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
               style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(6,182,212,0.3))', border: '1px solid rgba(124,58,237,0.3)' }}>
                <Plus style={{ width: '14px', height: '14px', color: '#C4B5FD' }} />
              </div>
              <div>
                <p className="font-heading font-bold text-white" style={{ fontSize: '14px' }}>Добавить игру</p>
                <p className="font-body text-[#4B5563]" style={{ fontSize: '10px' }}>RAWG · Steam · вручную</p>
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

          {/* Tabs */}
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

          {/* Content */}
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
                        placeholder="Название игры... (RAWG)"
                        className="w-full rounded-xl font-body outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(124,58,237,0.2)',
                          color: '#E2E8F0', fontSize: '12px',
                          padding: '10px 12px 10px 30px',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.45)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)')}
                      />
                    </div>
                    <button onClick={handleSearch} disabled={searching || !searchQuery.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-body transition-all disabled:opacity-50"
                      style={{ background: 'rgba(124,58,237,0.85)', fontSize: '12px', color: '#fff', boxShadow: '0 0 14px rgba(124,58,237,0.2)' }}
                      onMouseEnter={e => { if (!searching) (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,1)'; }}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.85)'}>
                      {searching
                        ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                            style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                        : <Search style={{ width: '13px', height: '13px' }} />}
                      {searching ? 'Поиск…' : 'Искать'}
                    </button>
                  </div>

                  {/* Steam URL */}
                  <div className="rounded-xl p-3 space-y-2"
                       style={{ background: 'rgba(102,192,244,0.04)', border: '1px solid rgba(102,192,244,0.14)' }}>
                    <div className="flex items-center gap-2">
                      <Link2 style={{ width: '11px', height: '11px', color: '#66C0F4' }} />
                      <p className="font-body text-[#66C0F4]" style={{ fontSize: '10px' }}>Импорт по Steam ссылке (скриншоты + трейлер)</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={steamUrl}
                        onChange={e => { setSteamUrl(e.target.value); setSteamError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleSteamImport()}
                        placeholder="https://store.steampowered.com/app/1245620/..."
                        className="flex-1 rounded-xl font-body outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${steamError ? 'rgba(239,68,68,0.4)' : 'rgba(102,192,244,0.2)'}`,
                          color: '#E2E8F0', fontSize: '11px', padding: '8px 12px',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(102,192,244,0.45)')}
                        onBlur={e => (e.currentTarget.style.borderColor = steamError ? 'rgba(239,68,68,0.4)' : 'rgba(102,192,244,0.2)')}
                      />
                      <button onClick={handleSteamImport} disabled={!steamUrl.trim() || steamLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body transition-all disabled:opacity-40"
                        style={{ background: 'rgba(102,192,244,0.15)', border: '1px solid rgba(102,192,244,0.3)', fontSize: '11px', color: '#66C0F4', whiteSpace: 'nowrap' }}>
                        {steamLoading
                          ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                              style={{ width: '11px', height: '11px', borderRadius: '50%', border: '2px solid rgba(102,192,244,0.3)', borderTopColor: '#66C0F4' }} />
                          : <Link2 style={{ width: '11px', height: '11px' }} />}
                        {steamLoading ? 'Загрузка…' : 'Импорт'}
                      </button>
                    </div>
                    {steamError && (
                      <p className="font-body" style={{ fontSize: '10px', color: '#F87171' }}>{steamError}</p>
                    )}
                  </div>

                  {/* Results */}
                  <div className="space-y-2">
                    {searching && Array.from({ length: 4 }).map((_, i) => (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                        className="h-16 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    ))}

                    {!searching && searchResults.map((r, i) => (
                      <motion.div key={r.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => applyResult(r)}
                        className="flex items-center gap-3 rounded-xl p-3 cursor-pointer group transition-all"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                        onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(124,58,237,0.07)'); (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)'); }}
                        onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(255,255,255,0.02)'); (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'); }}>

                        {/* Cover */}
                        <div className="relative w-10 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#09090E]">
                          {r.cover
                            ? <Image src={r.cover} alt={r.title} fill unoptimized className="object-cover" />
                            : <div className="absolute inset-0 flex items-center justify-center"><Package style={{ width: '16px', height: '16px', color: '#1F2937' }} /></div>
                          }
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-heading font-semibold text-white truncate" style={{ fontSize: '13px' }}>{r.title}</p>
                            <span className="font-pixel rounded px-1.5 py-0.5 flex-shrink-0"
                              style={{ fontSize: '7px', color: SOURCE_COLORS[r.source], background: `${SOURCE_COLORS[r.source]}12`, letterSpacing: '0.04em' }}>
                              {r.source}
                            </span>
                            {r.screenshots.length > 0 && (
                              <span className="font-body text-[#374151] flex-shrink-0" style={{ fontSize: '10px' }}>
                                🖼 {r.screenshots.length}
                              </span>
                            )}
                            {r.trailer && (
                              <span className="font-body text-[#EF4444] flex-shrink-0" style={{ fontSize: '10px' }}>▶</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {r.rating != null && (
                              <div className="flex items-center gap-1">
                                <Star style={{ width: '10px', height: '10px', color: '#F59E0B' }} />
                                <span className="font-body text-[#9CA3AF]" style={{ fontSize: '10px' }}>{r.rating}</span>
                              </div>
                            )}
                            {r.developer && (
                              <span className="font-body text-[#374151] truncate" style={{ fontSize: '10px' }}>{r.developer}</span>
                            )}
                            <div className="flex gap-1">
                              {r.genres.slice(0, 2).map(g => (
                                <span key={g} className="font-body text-[#374151]" style={{ fontSize: '9px' }}>{g}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <ChevronRight style={{ width: '14px', height: '14px', color: '#374151', flexShrink: 0 }}
                          className="group-hover:!text-[#7C3AED] transition-colors" />
                      </motion.div>
                    ))}

                    {!searching && searchError && (
                      <div className="flex items-center gap-2 rounded-xl px-3 py-3"
                           style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <AlertCircle style={{ width: '12px', height: '12px', color: '#EF4444', flexShrink: 0 }} />
                        <p className="font-body text-[#F87171]" style={{ fontSize: '11px' }}>{searchError}</p>
                      </div>
                    )}

                    {!searching && !searchError && searchResults.length === 0 && searchQuery && (
                      <div className="text-center py-8">
                        <Package style={{ width: '24px', height: '24px', color: '#1F2937', margin: '0 auto 8px' }} />
                        <p className="font-body text-[#374151]" style={{ fontSize: '12px' }}>Поиск не вернул результатов</p>
                        <button onClick={() => setTab('manual')}
                          className="font-body mt-2 transition-colors"
                          style={{ fontSize: '11px', color: '#7C3AED' }}>
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
                        Импортировано из <span style={{ color: SOURCE_COLORS[selected.source] }}>{selected.source}</span>
                        {detailLoading
                          ? <span style={{ color: '#6B7280' }}> · загрузка деталей…</span>
                          : <>
                              {form.screenshots.length > 0 && ` · ${form.screenshots.length} скриншотов`}
                              {form.trailer && ' · трейлер'}
                              {form.description && ' · описание'}
                            </>
                        }
                      </p>
                    </div>
                  )}

                  {saved && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-2 rounded-xl px-4 py-3"
                      style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <CheckCircle2 style={{ width: '14px', height: '14px', color: '#22C55E' }} />
                      <p className="font-body text-[#22C55E]" style={{ fontSize: '12px' }}>«{form.title}» добавлена!</p>
                    </motion.div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="font-body text-[#4B5563] mb-1.5 block" style={{ fontSize: '10px' }}>Название игры *</label>
                    <div className="relative">
                      <Gamepad2 style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', color: '#4B5563' }} />
                      <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="Название игры"
                        className="w-full rounded-xl font-heading font-semibold outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#E2E8F0', fontSize: '15px', padding: '10px 12px 10px 32px' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')} />
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

                  {/* Trailer */}
                  <div>
                    <label className="font-body text-[#4B5563] mb-1.5 block" style={{ fontSize: '10px' }}>
                      Трейлер
                      {form.trailer && (
                        <span className="ml-2" style={{ color: form.trailer.startsWith('yt:') ? '#9D60FA' : '#EF4444' }}>
                          ▶ {form.trailer.startsWith('yt:') ? 'YouTube' : 'mp4'}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <Film style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '12px', color: '#4B5563' }} />
                      <input value={form.trailer} onChange={e => setForm(p => ({ ...p, trailer: e.target.value }))}
                        placeholder="yt:dQw4w9WgXcQ  или  https://...mp4"
                        className="w-full rounded-xl font-body outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#E2E8F0', fontSize: '12px', padding: '9px 12px 9px 30px' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')} />
                    </div>
                  </div>

                  {/* Screenshots */}
                  <div>
                    <label className="font-body text-[#4B5563] mb-1.5 block" style={{ fontSize: '10px' }}>
                      Скриншоты ({form.screenshots.length})
                    </label>
                    {form.screenshots.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {form.screenshots.map((src, i) => (
                          <div key={i} className="relative w-16 h-11 rounded-lg overflow-hidden flex-shrink-0 group/shot bg-[#09090E]">
                            <Image src={src} alt={`shot-${i}`} fill unoptimized className="object-cover"
                              onError={() => {}} />
                            <button
                              onClick={() => setForm(p => ({ ...p, screenshots: p.screenshots.filter((_, j) => j !== i) }))}
                              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/shot:opacity-100 transition-opacity"
                              style={{ background: 'rgba(239,68,68,0.7)' }}>
                              <X style={{ width: '12px', height: '12px', color: '#fff' }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        value={screenshotInput}
                        onChange={e => setScreenshotInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && screenshotInput.trim()) {
                            setForm(p => ({ ...p, screenshots: [...p.screenshots, screenshotInput.trim()] }));
                            setScreenshotInput('');
                          }
                        }}
                        placeholder="URL скриншота (Enter)"
                        className="flex-1 rounded-xl font-body outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#E2E8F0', fontSize: '11px', padding: '8px 12px' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                      />
                      <button
                        onClick={() => { if (screenshotInput.trim()) { setForm(p => ({ ...p, screenshots: [...p.screenshots, screenshotInput.trim()] })); setScreenshotInput(''); } }}
                        className="px-3 py-1.5 rounded-xl font-body transition-all"
                        style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', fontSize: '11px', color: '#9D60FA' }}>
                        +
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="font-body text-[#4B5563] mb-1.5 block" style={{ fontSize: '10px' }}>Описание</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Краткое описание..." rows={2}
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
                    {(['developer', 'publisher'] as const).map(key => (
                      <div key={key} className="flex-1">
                        <label className="font-body text-[#4B5563] mb-1.5 block capitalize" style={{ fontSize: '10px' }}>
                          {key === 'developer' ? 'Разработчик' : 'Издатель'}
                        </label>
                        <input value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={key === 'developer' ? 'CD Projekt Red' : 'Издатель'}
                          className="w-full rounded-xl font-body outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#E2E8F0', fontSize: '12px', padding: '9px 12px' }}
                          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)')}
                          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')} />
                      </div>
                    ))}
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

                  {error && (
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                         style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <AlertCircle style={{ width: '12px', height: '12px', color: '#EF4444' }} />
                      <p className="font-body text-[#F87171]" style={{ fontSize: '11px' }}>{error}</p>
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
                {isFormValid ? 'Готово к сохранению' : 'Заполните название'}
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
                    color: isFormValid ? '#fff' : '#374151', fontSize: '12px',
                    boxShadow: isFormValid ? '0 0 16px rgba(124,58,237,0.3)' : 'none',
                    cursor: !isFormValid || saving ? 'not-allowed' : 'pointer',
                  }}>
                  {saving
                    ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                        style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    : <CheckCircle2 style={{ width: '13px', height: '13px' }} />}
                  {saving ? 'Сохраняем...' : 'Добавить игру'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel: preview ── */}
        <div className="w-64 flex-shrink-0 flex flex-col"
             style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
          <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="font-body text-[#374151]" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Предпросмотр
            </p>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
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
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(13,13,26,0.95) 100%)' }} />
                {(form.priceUsd || form.rating) && (
                  <div className="absolute top-2 right-2 font-pixel rounded-lg px-2 py-1"
                       style={{ fontSize: '8px', color: rarity.color, background: `${rarity.color}15`, border: `1px solid ${rarity.color}30`, letterSpacing: '0.06em' }}>
                    {rarity.label}
                  </div>
                )}
                {form.trailer && (
                  <div className="absolute bottom-2 left-2 font-pixel rounded px-1.5 py-0.5"
                       style={{ fontSize: '7px', color: '#EF4444', background: 'rgba(239,68,68,0.2)', letterSpacing: '0.04em' }}>
                    ▶ TRAILER
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <p className="font-heading font-bold text-white" style={{ fontSize: '13px', minHeight: '18px' }}>
                  {form.title || <span style={{ color: '#1F2937' }}>Название игры</span>}
                </p>
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
                {form.screenshots.length > 0 && (
                  <p className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
                    🖼 {form.screenshots.length} скриншотов
                  </p>
                )}
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
                {form.platforms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {form.platforms.slice(0, 3).map(p => (
                      <span key={p} className="font-body rounded px-1.5 py-0.5"
                        style={{ fontSize: '9px', color: '#374151', background: 'rgba(255,255,255,0.04)' }}>
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
