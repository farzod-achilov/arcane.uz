'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, Search, Package, Star, Monitor, Apple, Server,
  CheckCircle2, AlertCircle, Clock, X, Plus, Loader2,
  ChevronLeft, ArrowUpRight, Layers, ExternalLink,
  ClipboardPaste, Zap, History, Info, AlertTriangle,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SteamPreview {
  appId:       number;
  title:       string;
  cover:       string | null;
  description: string | null;
  genres:      string[];
  platforms:   string[];
  developer:   string | null;
  publisher:   string | null;
  priceUsd:    number | null;
  priceUzs:    number | null;
  rating:      number | null;
  releaseDate: string | null;
  screenshots: string[];
  movies:      { src: string; thumb: string }[];
}

interface ImportedGame {
  id:         string;
  title:      string;
  slug:       string;
  cover:      string | null;
  genres:     string[];
  platforms:  string[];
  priceUzs:   number | null;
  isActive:   boolean;
  externalId: string | null;
  createdAt:  string;
  developer:  string | null;
  publisher:  string | null;
  rating:     number | null;
}

interface DuplicateInfo {
  id:        string;
  title:     string;
  slug:      string;
  cover:     string | null;
  createdAt: string;
}

type Phase = 'idle' | 'fetching' | 'preview' | 'importing' | 'success' | 'duplicate' | 'error';

interface BatchItem {
  url:    string;
  status: 'pending' | 'fetching' | 'imported' | 'duplicate' | 'error';
  title?: string;
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseAppId(url: string): string | null {
  const m = url.trim().match(/store\.steampowered\.com\/app\/(\d+)/);
  return m?.[1] ?? null;
}

function PlatformIcon({ p }: { p: string }) {
  const icon = p === 'Mac' ? Apple : p === 'Linux' ? Server : Monitor;
  const Icon = icon;
  return <Icon style={{ width: '13px', height: '13px', color: '#6B7280' }} />;
}

function StatChip({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
         style={{ background: `${color}0D`, border: `1px solid ${color}22` }}>
      <span className="font-body text-[#6B7280]" style={{ fontSize: '10px' }}>{label}</span>
      <span className="font-heading font-bold" style={{ fontSize: '11px', color }}>{value}</span>
    </div>
  );
}

// ── Small imported game card ──────────────────────────────────────────────────

function ImportedCard({ g, delay }: { g: ImportedGame; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -3 }}
    >
      <Link href={`/admin/products`}
            className="block rounded-2xl overflow-hidden cursor-pointer group"
            style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="relative h-24 overflow-hidden">
          {g.cover ? (
            <Image src={g.cover} alt={g.title} fill unoptimized
                   className="object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
                 style={{ background: 'rgba(124,58,237,0.06)' }}>
              <Package style={{ width: '24px', height: '24px', color: '#374151' }} />
            </div>
          )}
          <div className="absolute inset-0"
               style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(10,10,20,0.95) 100%)' }} />
          <div className="absolute top-2 right-2">
            <div className="rounded-md px-1.5 py-0.5 font-pixel"
                 style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(66,182,212,0.3)',
                          fontSize: '7px', color: '#06B6D4', letterSpacing: '0.06em' }}>
              STEAM
            </div>
          </div>
        </div>
        <div className="p-3">
          <p className="font-heading font-semibold text-white line-clamp-1 mb-1" style={{ fontSize: '12px' }}>
            {g.title}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex gap-1 flex-wrap">
              {g.genres.slice(0, 2).map(genre => (
                <span key={genre} className="font-pixel rounded px-1.5 py-0.5"
                      style={{ fontSize: '7px', color: '#7C3AED', background: 'rgba(124,58,237,0.1)' }}>
                  {genre}
                </span>
              ))}
            </div>
            {g.priceUzs ? (
              <span className="font-heading font-bold text-[#22C55E]" style={{ fontSize: '11px' }}>
                {(g.priceUzs / 1000).toFixed(0)}K
              </span>
            ) : null}
          </div>
          <p className="font-body text-[#374151] mt-1.5" style={{ fontSize: '10px' }}>
            {new Date(g.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Preview panel ─────────────────────────────────────────────────────────────

function PreviewPanel({
  preview, priceUsd, priceUzs, onPriceUsdChange, onPriceUzsChange, onImport, importing,
}: {
  preview: SteamPreview;
  priceUsd: string; priceUzs: string;
  onPriceUsdChange: (v: string) => void;
  onPriceUzsChange: (v: string) => void;
  onImport: () => void;
  importing: boolean;
}) {
  const steamUrl = `https://store.steampowered.com/app/${preview.appId}/`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{ background: '#08080F', border: '1px solid rgba(124,58,237,0.2)',
               boxShadow: '0 0 40px rgba(124,58,237,0.08)' }}
    >
      {/* Cover hero */}
      <div className="relative h-48 overflow-hidden">
        {preview.cover ? (
          <Image src={preview.cover} alt={preview.title} fill unoptimized className="object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: 'rgba(124,58,237,0.06)' }} />
        )}
        <div className="absolute inset-0"
             style={{ background: 'linear-gradient(to bottom, rgba(8,8,15,0) 20%, rgba(8,8,15,1) 100%)' }} />

        {/* Steam badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
             style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)',
                      backdropFilter: 'blur(6px)' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: '#06B6D4' }} />
          <span className="font-pixel text-[#06B6D4]" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
            STEAM #{preview.appId}
          </span>
        </div>

        <a href={steamUrl} target="_blank" rel="noopener noreferrer"
           onClick={e => e.stopPropagation()}
           className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
           style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
           onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.4)')}
           onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.5)')}
        >
          <ExternalLink style={{ width: '12px', height: '12px', color: '#9CA3AF' }} />
        </a>
      </div>

      {/* Info */}
      <div className="p-5 space-y-4">
        <div>
          <h2 className="font-heading font-bold text-white mb-1" style={{ fontSize: '18px' }}>
            {preview.title}
          </h2>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
            {[preview.developer, preview.publisher].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap gap-2">
          {preview.rating != null && (
            <StatChip label="Metacritic" value={preview.rating} color="#F59E0B" />
          )}
          {preview.releaseDate && (
            <StatChip label="Выпуск"
              value={new Date(preview.releaseDate).getFullYear()}
              color="#9CA3AF" />
          )}
          {preview.platforms.map(p => (
            <div key={p} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
                 style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <PlatformIcon p={p} />
              <span className="font-body text-[#6B7280]" style={{ fontSize: '10px' }}>{p}</span>
            </div>
          ))}
        </div>

        {/* Genres */}
        {preview.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {preview.genres.map(g => (
              <span key={g} className="font-pixel rounded-lg px-2 py-1"
                    style={{ fontSize: '8px', color: '#7C3AED', background: 'rgba(124,58,237,0.1)',
                             border: '1px solid rgba(124,58,237,0.18)', letterSpacing: '0.04em' }}>
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {preview.description && (
          <p className="font-body text-[#6B7280] leading-relaxed line-clamp-3" style={{ fontSize: '12px' }}>
            {preview.description}
          </p>
        )}

        {/* Screenshots strip */}
        {preview.screenshots.filter(s => !s.startsWith('video:')).length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {preview.screenshots
              .filter(s => !s.startsWith('video:'))
              .slice(0, 6)
              .map((s, i) => (
                <div key={i} className="flex-shrink-0 rounded-lg overflow-hidden"
                     style={{ width: '80px', height: '45px' }}>
                  <Image src={s} alt="" width={80} height={45} unoptimized
                         className="object-cover w-full h-full" />
                </div>
              ))}
          </div>
        )}

        {/* Trailers count */}
        {preview.movies.length > 0 && (
          <div className="flex items-center gap-2 text-[#4B5563]" style={{ fontSize: '11px' }}>
            <Layers style={{ width: '12px', height: '12px' }} />
            <span className="font-body">{preview.movies.length} видео/трейлера</span>
          </div>
        )}

        {/* Price inputs */}
        <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="font-pixel text-[#4B5563] mb-3" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
            ЦЕНА ДЛЯ МАГАЗИНА
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-[#4B5563] block mb-1.5" style={{ fontSize: '11px' }}>
                Цена USD
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-[#4B5563]"
                      style={{ fontSize: '12px' }}>$</span>
                <input
                  type="number" step="0.01" min="0"
                  value={priceUsd}
                  onChange={e => onPriceUsdChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl pl-7 pr-3 py-2.5 font-body text-white outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                           fontSize: '13px' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>
            </div>
            <div>
              <label className="font-body text-[#4B5563] block mb-1.5" style={{ fontSize: '11px' }}>
                Цена UZS
              </label>
              <input
                type="number" step="1000" min="0"
                value={priceUzs}
                onChange={e => onPriceUzsChange(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl px-3 py-2.5 font-body text-white outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                         fontSize: '13px' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>
          </div>
          {priceUzs && (
            <p className="font-body text-[#374151] mt-1.5" style={{ fontSize: '10px' }}>
              ≈ {formatPrice(parseInt(priceUzs))}
            </p>
          )}
        </div>

        {/* Import button */}
        <button
          onClick={onImport}
          disabled={importing}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-heading font-bold text-white transition-all disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
            fontSize: '14px',
            boxShadow: importing ? 'none' : '0 0 28px rgba(124,58,237,0.45)',
          }}
          onMouseEnter={e => { if (!importing) e.currentTarget.style.boxShadow = '0 0 36px rgba(124,58,237,0.6)'; }}
          onMouseLeave={e => { if (!importing) e.currentTarget.style.boxShadow = '0 0 28px rgba(124,58,237,0.45)'; }}
        >
          {importing ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 rounded-full border-2"
                          style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              Импортируем...
            </>
          ) : (
            <>
              <Plus style={{ width: '15px', height: '15px' }} />
              Импортировать в каталог
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SteamImportPage() {
  const [url,       setUrl]       = useState('');
  const [phase,     setPhase]     = useState<Phase>('idle');
  const [preview,   setPreview]   = useState<SteamPreview | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null);
  const [error,     setError]     = useState('');
  const [priceUsd,  setPriceUsd]  = useState('');
  const [priceUzs,  setPriceUzs]  = useState('');
  const [history,   setHistory]   = useState<ImportedGame[]>([]);
  const [histLoading, setHistLoading] = useState(true);
  const [batchMode, setBatchMode] = useState(false);
  const [batchUrls, setBatchUrls] = useState('');
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history
  useEffect(() => {
    fetch('/api/steam/import?limit=24')
      .then(r => r.json())
      .then(d => { if (d.success) setHistory(d.data); })
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, []);

  // ── Single URL fetch preview ────────────────────────────────────────────────

  const handleFetchPreview = useCallback(async (rawUrl?: string) => {
    const target = (rawUrl ?? url).trim();
    if (!target) return;

    const appId = parseAppId(target);
    if (!appId) {
      setError('Неверная ссылка. Пример: https://store.steampowered.com/app/1245620/');
      setPhase('error');
      return;
    }

    setPhase('fetching');
    setError('');
    setPreview(null);
    setDuplicate(null);

    try {
      const res  = await fetch(`/api/steam/app/${appId}`);
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? 'Игра не найдена в Steam');
        setPhase('error');
        return;
      }

      const d = data.data;
      const steamMovies: Array<{ src: string; thumb: string }> = d.movies ?? [];

      // Set price from Steam
      if (d.priceUsd != null) {
        setPriceUsd(String(d.priceUsd));
        setPriceUzs(String(Math.round(d.priceUsd * 12700 / 1000) * 1000));
      }

      setPreview({
        appId:       d.appId,
        title:       d.title,
        cover:       d.cover,
        description: d.description,
        genres:      d.genres,
        platforms:   d.platforms,
        developer:   d.developer,
        publisher:   d.publisher,
        priceUsd:    d.priceUsd,
        priceUzs:    d.priceUsd != null ? Math.round(d.priceUsd * 12700 / 1000) * 1000 : null,
        rating:      d.rating,
        releaseDate: null,
        screenshots: d.screenshots ?? [],
        movies:      steamMovies,
      });
      setPhase('preview');
    } catch {
      setError('Ошибка подключения к Steam API');
      setPhase('error');
    }
  }, [url]);

  // Auto-fetch on URL paste (if valid Steam URL detected)
  const handleUrlChange = (v: string) => {
    setUrl(v);
    if (parseAppId(v)) {
      setTimeout(() => handleFetchPreview(v), 300);
    }
  };

  // ── Paste from clipboard ────────────────────────────────────────────────────

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text.trim());
      if (parseAppId(text)) handleFetchPreview(text.trim());
    } catch { /* ignore */ }
  };

  // ── Import single game ──────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!preview) return;
    setPhase('importing');
    setError('');

    try {
      const res  = await fetch('/api/steam/import', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          url:      `https://store.steampowered.com/app/${preview.appId}/`,
          priceUsd: priceUsd ? parseFloat(priceUsd) : null,
          priceUzs: priceUzs ? parseInt(priceUzs)   : null,
        }),
      });
      const data = await res.json();

      if (data.status === 'duplicate') {
        setDuplicate(data.existing);
        setPhase('duplicate');
        return;
      }

      if (!data.success) {
        setError(data.error ?? 'Ошибка при импорте');
        setPhase('error');
        return;
      }

      // Add to history
      setHistory(prev => [data.game, ...prev]);
      setPhase('success');
    } catch {
      setError('Ошибка сети');
      setPhase('error');
    }
  };

  // ── Batch import ────────────────────────────────────────────────────────────

  const startBatchImport = async () => {
    const lines = batchUrls.split('\n').map(l => l.trim()).filter(Boolean);
    const items: BatchItem[] = lines.map(url => ({ url, status: 'pending' }));
    setBatchItems(items);
    setBatchRunning(true);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!parseAppId(item.url)) {
        setBatchItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'error', error: 'Неверная ссылка' } : it));
        continue;
      }

      setBatchItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'fetching' } : it));

      try {
        const res  = await fetch('/api/steam/import', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ url: item.url }),
        });
        const data = await res.json();

        if (data.status === 'duplicate') {
          setBatchItems(prev => prev.map((it, idx) =>
            idx === i ? { ...it, status: 'duplicate', title: data.existing?.title } : it,
          ));
        } else if (data.success) {
          setBatchItems(prev => prev.map((it, idx) =>
            idx === i ? { ...it, status: 'imported', title: data.game?.title } : it,
          ));
          setHistory(prev => [data.game, ...prev]);
        } else {
          setBatchItems(prev => prev.map((it, idx) =>
            idx === i ? { ...it, status: 'error', error: data.error ?? 'Ошибка' } : it,
          ));
        }
      } catch {
        setBatchItems(prev => prev.map((it, idx) =>
          idx === i ? { ...it, status: 'error', error: 'Ошибка сети' } : it,
        ));
      }
    }

    setBatchRunning(false);
  };

  const reset = () => {
    setUrl(''); setPhase('idle'); setPreview(null);
    setDuplicate(null); setError(''); setPriceUsd(''); setPriceUzs('');
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-7xl space-y-6">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/admin/products"
          className="inline-flex items-center gap-1.5 font-body mb-4 transition-colors"
          style={{ fontSize: '12px', color: '#4B5563' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#7C3AED')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}>
          <ChevronLeft style={{ width: '14px', height: '14px' }} />
          Продукты
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-pixel" style={{ fontSize: '8px', color: '#06B6D4', letterSpacing: '0.14em' }}>
                STEAM IMPORT SYSTEM
              </p>
            </div>
            <h1 className="font-heading font-bold text-white mb-1" style={{ fontSize: '26px' }}>
              Импорт из Steam
            </h1>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '13px' }}>
              Вставьте ссылку на игру — данные загружаются автоматически
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                 style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <History style={{ width: '13px', height: '13px', color: '#06B6D4' }} />
              <span className="font-heading font-bold text-[#06B6D4]" style={{ fontSize: '14px' }}>
                {history.length}
              </span>
              <span className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>импортировано</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Mode toggle ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
                  className="flex items-center gap-2">
        {[
          { id: false, label: 'Одна игра',    icon: Link2  },
          { id: true,  label: 'Пакетный режим', icon: Layers },
        ].map(mode => (
          <button key={String(mode.id)} onClick={() => setBatchMode(mode.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-body transition-all duration-200"
                  style={{
                    background: batchMode === mode.id ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
                    border:     batchMode === mode.id ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.07)',
                    fontSize:  '12px',
                    color:     batchMode === mode.id ? '#C4B5FD' : '#4B5563',
                  }}>
            <mode.icon style={{ width: '13px', height: '13px' }} />
            {mode.label}
          </button>
        ))}
      </motion.div>

      {/* ── Main area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left col */}
        <div className="lg:col-span-3 space-y-4">

          {/* ── SINGLE MODE ── */}
          {!batchMode && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>

              {/* URL input card */}
              <div className="rounded-2xl p-5"
                   style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="font-pixel text-[#4B5563] mb-3" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                  STEAM STORE URL
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2"
                           style={{ width: '14px', height: '14px', color: '#374151' }} />
                    <input
                      ref={inputRef}
                      type="url"
                      value={url}
                      onChange={e => handleUrlChange(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleFetchPreview(); }}
                      placeholder="https://store.steampowered.com/app/1245620/"
                      className="w-full rounded-xl pl-9 pr-4 py-3 font-body text-white outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                               fontSize: '13px' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
                    />
                  </div>

                  <button onClick={handlePaste}
                          className="flex items-center gap-1.5 px-4 py-3 rounded-xl font-body transition-all"
                          style={{ background: 'rgba(255,255,255,0.05)', color: '#6B7280', fontSize: '12px',
                                   border: '1px solid rgba(255,255,255,0.08)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}>
                    <ClipboardPaste style={{ width: '13px', height: '13px' }} />
                    Вставить
                  </button>

                  <button
                    onClick={() => handleFetchPreview()}
                    disabled={phase === 'fetching' || !url.trim()}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-body font-semibold transition-all disabled:opacity-50"
                    style={{ background: phase === 'fetching' ? 'rgba(6,182,212,0.15)' : 'rgba(6,182,212,0.9)',
                             color: '#fff', fontSize: '12px', boxShadow: phase === 'fetching' ? 'none' : '0 0 16px rgba(6,182,212,0.3)' }}
                  >
                    {phase === 'fetching' ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                  className="w-3.5 h-3.5 rounded-full border-2"
                                  style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    ) : (
                      <Search style={{ width: '13px', height: '13px' }} />
                    )}
                    {phase === 'fetching' ? 'Загрузка...' : 'Найти'}
                  </button>
                </div>

                <p className="font-body text-[#374151] mt-2" style={{ fontSize: '10px' }}>
                  Поддерживается любой формат: /app/1245620, /app/1245620/Elden_Ring/, и т.д.
                </p>
              </div>

              {/* Status messages */}
              <AnimatePresence mode="wait">

                {/* Fetching skeleton */}
                {phase === 'fetching' && (
                  <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="rounded-2xl overflow-hidden"
                              style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="h-48 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    <div className="p-5 space-y-3">
                      {[100, 60, 80].map((w, i) => (
                        <div key={i} className="h-3 rounded-lg animate-pulse"
                             style={{ width: `${w}%`, background: 'rgba(255,255,255,0.05)' }} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Error */}
                {phase === 'error' && (
                  <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                              className="flex items-start gap-3 rounded-2xl p-4"
                              style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertCircle style={{ width: '16px', height: '16px', color: '#EF4444', flexShrink: 0, marginTop: '1px' }} />
                    <div className="flex-1">
                      <p className="font-heading font-semibold text-[#F87171] mb-1" style={{ fontSize: '13px' }}>Ошибка</p>
                      <p className="font-body text-[#6B7280]" style={{ fontSize: '12px' }}>{error}</p>
                    </div>
                    <button onClick={reset}>
                      <X style={{ width: '14px', height: '14px', color: '#EF4444' }} />
                    </button>
                  </motion.div>
                )}

                {/* Duplicate */}
                {phase === 'duplicate' && duplicate && (
                  <motion.div key="dup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                              className="rounded-2xl p-5"
                              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)' }}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle style={{ width: '16px', height: '16px', color: '#F59E0B', flexShrink: 0, marginTop: '1px' }} />
                      <div className="flex-1">
                        <p className="font-heading font-semibold text-[#F59E0B] mb-1" style={{ fontSize: '13px' }}>
                          Игра уже в каталоге
                        </p>
                        <p className="font-body text-[#6B7280] mb-3" style={{ fontSize: '12px' }}>
                          «{duplicate.title}» была импортирована{' '}
                          {new Date(duplicate.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                        <div className="flex items-center gap-2">
                          <Link href="/admin/products"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-body transition-all"
                                style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B',
                                         border: '1px solid rgba(245,158,11,0.25)', fontSize: '11px' }}>
                            <ArrowUpRight style={{ width: '12px', height: '12px' }} />
                            Перейти к игре
                          </Link>
                          <button onClick={reset}
                                  className="px-3 py-2 rounded-xl font-body transition-all"
                                  style={{ background: 'rgba(255,255,255,0.04)', color: '#6B7280',
                                           border: '1px solid rgba(255,255,255,0.08)', fontSize: '11px' }}>
                            Другая ссылка
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Success */}
                {phase === 'success' && (
                  <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                              className="rounded-2xl p-5"
                              style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.22)' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                           style={{ background: 'rgba(34,197,94,0.15)' }}>
                        <CheckCircle2 style={{ width: '18px', height: '18px', color: '#22C55E' }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-heading font-bold text-[#22C55E] mb-1" style={{ fontSize: '15px' }}>
                          Успешно импортировано!
                        </p>
                        <p className="font-body text-[#4B5563] mb-3" style={{ fontSize: '12px' }}>
                          «{preview?.title}» добавлена в каталог и доступна в магазине.
                        </p>
                        <div className="flex items-center gap-2">
                          <Link href="/admin/products"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-body transition-all"
                                style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E',
                                         border: '1px solid rgba(34,197,94,0.25)', fontSize: '11px' }}>
                            <ArrowUpRight style={{ width: '12px', height: '12px' }} />
                            Перейти к каталогу
                          </Link>
                          <button onClick={reset}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-body transition-all"
                                  style={{ background: 'rgba(124,58,237,0.12)', color: '#9D60FA',
                                           border: '1px solid rgba(124,58,237,0.25)', fontSize: '11px' }}>
                            <Plus style={{ width: '11px', height: '11px' }} />
                            Импортировать ещё
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* Tips (idle) */}
              {phase === 'idle' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                            className="rounded-2xl p-5"
                            style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Info style={{ width: '13px', height: '13px', color: '#4B5563' }} />
                    <p className="font-pixel text-[#4B5563]" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                      ЧТО ИМПОРТИРУЕТСЯ АВТОМАТИЧЕСКИ
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {[
                      'Название и описание',
                      'Обложка (header image)',
                      'Скриншоты (до 10 шт)',
                      'Видео / трейлеры (HLS)',
                      'Жанры и платформы',
                      'Разработчик, издатель',
                      'Рейтинг Metacritic',
                      'Дата выхода',
                    ].map(item => (
                      <div key={item} className="flex items-center gap-2">
                        <CheckCircle2 style={{ width: '11px', height: '11px', color: '#22C55E', flexShrink: 0 }} />
                        <span className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 flex items-start gap-2"
                       style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Zap style={{ width: '11px', height: '11px', color: '#F59E0B', flexShrink: 0, marginTop: '1px' }} />
                    <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
                      Цена загружается из Steam и пересчитывается в сумы автоматически.
                      Вы можете отредактировать её перед сохранением.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── BATCH MODE ── */}
          {batchMode && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="rounded-2xl p-5"
                   style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="font-pixel text-[#4B5563] mb-3" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                  СПИСОК ССЫЛОК (ОДНА НА СТРОКУ)
                </p>
                <textarea
                  value={batchUrls}
                  onChange={e => setBatchUrls(e.target.value)}
                  placeholder={'https://store.steampowered.com/app/1245620/\nhttps://store.steampowered.com/app/620/\nhttps://store.steampowered.com/app/730/'}
                  rows={8}
                  className="w-full rounded-xl px-4 py-3 font-body text-white outline-none resize-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                           fontSize: '12px', lineHeight: '1.8' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(6,182,212,0.35)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
                    {batchUrls.split('\n').filter(l => l.trim()).length} URL
                  </p>
                  <button
                    onClick={startBatchImport}
                    disabled={batchRunning || !batchUrls.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading font-semibold text-white transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                             fontSize: '12px', boxShadow: batchRunning ? 'none' : '0 0 20px rgba(124,58,237,0.4)' }}
                  >
                    {batchRunning
                      ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                      className="w-3.5 h-3.5 rounded-full border-2"
                                      style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                         Импорт...</>
                      : <><Zap style={{ width: '13px', height: '13px' }} /> Запустить импорт</>}
                  </button>
                </div>
              </div>

              {/* Batch progress */}
              {batchItems.length > 0 && (
                <div className="rounded-2xl overflow-hidden"
                     style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center justify-between">
                      <p className="font-pixel text-[#4B5563]" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                        ПРОГРЕСС ИМПОРТА
                      </p>
                      <div className="flex gap-3">
                        {[
                          { label: 'Импорт.',  count: batchItems.filter(i => i.status === 'imported').length,  color: '#22C55E' },
                          { label: 'Дублей',   count: batchItems.filter(i => i.status === 'duplicate').length, color: '#F59E0B' },
                          { label: 'Ошибок',   count: batchItems.filter(i => i.status === 'error').length,     color: '#EF4444' },
                        ].map(s => (
                          <div key={s.label} className="flex items-center gap-1">
                            <span className="font-heading font-bold" style={{ fontSize: '12px', color: s.color }}>{s.count}</span>
                            <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>{s.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {batchItems.map((item, i) => {
                      const statusCfg = {
                        pending:   { color: '#374151', icon: Clock,        bg: 'transparent'                },
                        fetching:  { color: '#7C3AED', icon: Loader2,      bg: 'rgba(124,58,237,0.05)'      },
                        imported:  { color: '#22C55E', icon: CheckCircle2, bg: 'rgba(34,197,94,0.05)'       },
                        duplicate: { color: '#F59E0B', icon: AlertTriangle,bg: 'rgba(245,158,11,0.05)'      },
                        error:     { color: '#EF4444', icon: AlertCircle,  bg: 'rgba(239,68,68,0.05)'       },
                      }[item.status];
                      const Icon = statusCfg.icon;

                      return (
                        <div key={i}
                             className="flex items-center gap-3 px-5 py-3 transition-colors"
                             style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: statusCfg.bg }}>
                          <div className="flex-shrink-0">
                            {item.status === 'fetching'
                              ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                                  <Icon style={{ width: '13px', height: '13px', color: statusCfg.color }} />
                                </motion.div>
                              : <Icon style={{ width: '13px', height: '13px', color: statusCfg.color }} />}
                          </div>
                          <span className="flex-1 font-body text-[#6B7280] truncate" style={{ fontSize: '11px' }}>
                            {item.title ?? item.url}
                          </span>
                          {item.error && (
                            <span className="font-body text-[#EF4444]" style={{ fontSize: '10px' }}>{item.error}</span>
                          )}
                          {item.status === 'duplicate' && (
                            <span className="font-pixel text-[#F59E0B]" style={{ fontSize: '8px' }}>ДУБЛЬ</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* ── Right col — preview ── */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {(phase === 'preview' || phase === 'importing') && preview && (
              <PreviewPanel
                key="preview"
                preview={preview}
                priceUsd={priceUsd}
                priceUzs={priceUzs}
                onPriceUsdChange={v => {
                  setPriceUsd(v);
                  const n = parseFloat(v);
                  if (!isNaN(n)) setPriceUzs(String(Math.round(n * 12700 / 1000) * 1000));
                }}
                onPriceUzsChange={setPriceUzs}
                onImport={handleImport}
                importing={phase === 'importing'}
              />
            )}

            {phase === 'idle' && !batchMode && (
              <motion.div key="idle-right"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-2xl p-6 flex flex-col items-center justify-center text-center"
                style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.06)',
                         minHeight: '300px' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                     style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}>
                  <Package style={{ width: '26px', height: '26px', color: '#374151' }} />
                </div>
                <p className="font-heading font-semibold text-[#4B5563] mb-1" style={{ fontSize: '14px' }}>
                  Предпросмотр появится здесь
                </p>
                <p className="font-body text-[#374151]" style={{ fontSize: '12px' }}>
                  Введите Steam URL слева
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Import history ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History style={{ width: '15px', height: '15px', color: '#4B5563' }} />
            <p className="font-heading font-semibold text-[#9CA3AF]" style={{ fontSize: '14px' }}>
              История импорта
            </p>
            <span className="font-pixel text-[#374151] px-2 py-0.5 rounded-md"
                  style={{ fontSize: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {history.length}
            </span>
          </div>
          <Link href="/admin/products"
                className="flex items-center gap-1.5 font-body transition-colors"
                style={{ fontSize: '12px', color: '#4B5563' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#7C3AED')}
                onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}>
            Все продукты <ArrowUpRight style={{ width: '12px', height: '12px' }} />
          </Link>
        </div>

        {histLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse"
                   style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="h-24" style={{ background: 'rgba(255,255,255,0.04)' }} />
                <div className="p-3 space-y-2">
                  <div className="h-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', width: '80%' }} />
                  <div className="h-2 rounded-lg"   style={{ background: 'rgba(255,255,255,0.03)', width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
               style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Package style={{ width: '32px', height: '32px', color: '#1F2937', marginBottom: '12px' }} />
            <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>
              Нет импортированных игр. Начните с вставки Steam URL выше.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {history.map((g, i) => <ImportedCard key={g.id} g={g} delay={i * 0.04} />)}
          </div>
        )}
      </motion.div>
    </div>
  );
}
