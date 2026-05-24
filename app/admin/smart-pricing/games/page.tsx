'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, X, ChevronLeft,
  Settings2, Gamepad2, RefreshCw,
  CheckCircle2, CircleDashed,
} from 'lucide-react';
import type { ArcaneGame } from '@/lib/arcaneApi';
import { STRATEGY_META } from '@/lib/smartPricing/strategies';
import type { PricingStrategy } from '@/lib/smartPricing/types';
import GamePricingModal, { type GameItem } from '@/components/admin/smart-pricing/GamePricingModal';
import { useT } from '@/lib/i18n';

interface GamePricingStatus {
  finalPriceUsd?:   number | null;
  finalPriceUzs?:   number | null;
  marginPercent?:   number | null;
  pricingStrategy?: PricingStrategy;
  supplierPriceUsd?: number | null;
  youSavePercent?:  number | null;
}

interface GameRow extends ArcaneGame {
  pricing?: GamePricingStatus;
  pricingLoaded?: boolean;
}

type FilterType = 'all' | 'configured' | 'not_configured';

function formatUzs(n: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n));
}

function MarginBadge({ value }: { value: number | null | undefined }) {
  if (value == null) return null;
  const color = value >= 15 ? '#22C55E' : value >= 5 ? '#F59E0B' : '#EF4444';
  return (
    <span
      className="font-pixel rounded px-1.5 py-0.5"
      style={{ fontSize: '8px', color, background: color + '18', border: `1px solid ${color}30`, letterSpacing: '0.04em' }}
    >
      {value.toFixed(1)}%
    </span>
  );
}

function StrategyBadge({ strategy }: { strategy?: PricingStrategy | null }) {
  if (!strategy) return null;
  const meta = STRATEGY_META[strategy];
  return (
    <span
      className="font-body rounded-lg px-2 py-0.5 flex items-center gap-1"
      style={{ fontSize: '10px', color: meta.color, background: meta.color + '15', border: `1px solid ${meta.color}30` }}
    >
      <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

export default function GamesSmartPricingPage() {
  const { t } = useT();
  const [games,       setGames]       = useState<GameRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState<FilterType>('all');
  const [selected,    setSelected]    = useState<GameItem | null>(null);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [refreshKey,  setRefreshKey]  = useState(0);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/arcane/games?limit=200');
      const json = await res.json();
      if (json.success) {
        const rows: GameRow[] = (json.data as ArcaneGame[]).map(g => ({ ...g, pricingLoaded: false }));
        setGames(rows);

        // Load pricing for each game in parallel (batched)
        const ids = rows.map(r => r.id);
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

        for (const chunk of chunks) {
          await Promise.all(chunk.map(async (id) => {
            try {
              const pr  = await fetch(`/api/admin/game/${id}/pricing`);
              const pj  = await pr.json();
              if (pj.success && pj.data) {
                setGames(prev => prev.map(g =>
                  g.id === id ? { ...g, pricing: pj.data, pricingLoaded: true } : g
                ));
              } else {
                setGames(prev => prev.map(g =>
                  g.id === id ? { ...g, pricingLoaded: true } : g
                ));
              }
            } catch {
              setGames(prev => prev.map(g =>
                g.id === id ? { ...g, pricingLoaded: true } : g
              ));
            }
          }));
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGames(); }, [fetchGames, refreshKey]);

  const handleSaved = useCallback((gameId: string, pricingData: GamePricingStatus) => {
    setGames(prev => prev.map(g =>
      g.id === gameId ? { ...g, pricing: pricingData, pricingLoaded: true } : g
    ));
  }, []);

  const openModal = (game: GameRow) => {
    setSelected({
      id:        game.id,
      title:     game.title,
      cover:     game.cover,
      genres:    game.genres,
      platforms: game.platforms,
      priceUsd:  game.priceUsd ?? undefined,
      priceUzs:  game.priceUzs ?? undefined,
    });
    setModalOpen(true);
  };

  const filtered = games.filter(g => {
    const matchSearch = !search || g.title.toLowerCase().includes(search.toLowerCase());
    const configured  = !!(g.pricing?.finalPriceUsd);
    const matchFilter =
      filter === 'all'            ? true :
      filter === 'configured'     ? configured :
      filter === 'not_configured' ? !configured : true;
    return matchSearch && matchFilter;
  });

  const configuredCount    = games.filter(g => g.pricing?.finalPriceUsd).length;
  const notConfiguredCount = games.filter(g => g.pricingLoaded && !g.pricing?.finalPriceUsd).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/smart-pricing"
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 font-body transition-all duration-200"
          style={{ fontSize: '12px', color: '#4B5563', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <ChevronLeft style={{ width: '13px', height: '13px' }} />
          {t.gamePricing.backToSmart}
        </Link>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-white" style={{ fontSize: '20px' }}>
            {t.gamePricing.title}
          </h1>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
            {t.gamePricing.subtitle}
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="flex items-center gap-2 rounded-xl px-3 py-2 font-body transition-all duration-200"
          style={{ fontSize: '12px', color: '#6B7280', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <RefreshCw style={{ width: '12px', height: '12px' }} />
          {t.common.refresh}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t.gamePricing.totalGames,     value: games.length,       icon: Gamepad2,     color: '#7C3AED' },
          { label: t.gamePricing.configured,     value: configuredCount,    icon: CheckCircle2, color: '#22C55E' },
          { label: t.gamePricing.notConfigured,  value: notConfiguredCount, icon: CircleDashed, color: '#F59E0B' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: color + '15', border: `1px solid ${color}30` }}>
              <Icon style={{ width: '15px', height: '15px', color }} />
            </div>
            <div>
              <p className="font-heading font-bold text-white" style={{ fontSize: '20px', lineHeight: 1 }}>{value}</p>
              <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Search style={{ width: '14px', height: '14px', color: '#4B5563', flexShrink: 0 }} />
          <input
            type="text"
            placeholder={t.gamePricing.searchGames}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none font-body text-white placeholder-[#374151]"
            style={{ fontSize: '13px' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-[#4B5563] hover:text-white transition-colors">
              <X style={{ width: '12px', height: '12px' }} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {([
            { key: 'all',            label: t.gamePricing.allFilter },
            { key: 'configured',     label: t.gamePricing.configuredFilter },
            { key: 'not_configured', label: t.gamePricing.noPricingFilter },
          ] as { key: FilterType; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="rounded-lg px-3 py-1.5 font-body transition-all duration-200"
              style={{
                fontSize:   '11px',
                color:      filter === key ? '#fff' : '#4B5563',
                background: filter === key ? 'rgba(124,58,237,0.25)' : 'transparent',
                border:     filter === key ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Games table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Table header */}
        <div
          className="grid px-4 py-3"
          style={{
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          {[t.gamePricing.game, t.gamePricing.strategy, t.gamePricing.supplier, t.gamePricing.finalPrice, t.gamePricing.margin, ''].map((h) => (
            <span key={h} className="font-body text-[#374151]" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {h}
            </span>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw style={{ width: '20px', height: '20px', color: '#7C3AED' }} />
            </motion.div>
            <p className="font-body text-[#374151]" style={{ fontSize: '12px' }}>{t.common.loading}</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Gamepad2 style={{ width: '32px', height: '32px', color: '#1F2937' }} />
            <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>{t.gamePricing.noGamesFound}</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {!loading && filtered.map((game, i) => {
            const hasPricing   = !!(game.pricing?.finalPriceUsd);
            const strategy     = game.pricing?.pricingStrategy ?? null;
            const stratMeta    = strategy ? STRATEGY_META[strategy] : null;
            const margin       = game.pricing?.marginPercent   != null ? Number(game.pricing.marginPercent)   : null;
            const supplierUsd  = game.pricing?.supplierPriceUsd != null ? Number(game.pricing.supplierPriceUsd) : null;
            const finalUsd     = game.pricing?.finalPriceUsd   != null ? Number(game.pricing.finalPriceUsd)   : null;
            const finalUzs     = game.pricing?.finalPriceUzs   != null ? Number(game.pricing.finalPriceUzs)   : null;

            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02, duration: 0.2 }}
                className="grid px-4 py-3 items-center group transition-colors duration-150"
                style={{
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Game column */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {game.cover ? (
                      <Image src={game.cover} alt={game.title} width={36} height={36} className="w-full h-full object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 style={{ width: '14px', height: '14px', color: '#374151' }} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading font-semibold text-white truncate" style={{ fontSize: '13px' }}>{game.title}</p>
                    {game.genres?.length > 0 && (
                      <p className="font-body text-[#374151] truncate" style={{ fontSize: '10px' }}>{game.genres.slice(0, 2).join(' · ')}</p>
                    )}
                  </div>
                  {/* Status dot */}
                  {!game.pricingLoaded ? (
                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#374151' }} />
                  ) : hasPricing ? (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#374151' }} />
                  )}
                </div>

                {/* Strategy */}
                <div>
                  {hasPricing && strategy ? (
                    <StrategyBadge strategy={strategy} />
                  ) : (
                    <span className="font-body text-[#2D3748]" style={{ fontSize: '11px' }}>—</span>
                  )}
                </div>

                {/* Supplier price */}
                <div>
                  {supplierUsd != null ? (
                    <span className="font-heading font-semibold text-[#6B7280]" style={{ fontSize: '12px' }}>
                      ${Number(supplierUsd).toFixed(2)}
                    </span>
                  ) : (
                    <span className="font-body text-[#2D3748]" style={{ fontSize: '11px' }}>—</span>
                  )}
                </div>

                {/* Final price */}
                <div className="space-y-0.5">
                  {finalUsd != null ? (
                    <>
                      <p className="font-heading font-bold text-white" style={{ fontSize: '13px' }}>${finalUsd.toFixed(2)}</p>
                      {finalUzs != null && (
                        <p className="font-body text-[#374151]" style={{ fontSize: '10px' }}>{formatUzs(finalUzs)} сум</p>
                      )}
                    </>
                  ) : (
                    <span className="font-body" style={{ fontSize: '11px', color: '#2D3748' }}>
                      {game.priceUsd ? `$${Number(game.priceUsd).toFixed(2)}` : t.common.notSet}
                    </span>
                  )}
                </div>

                {/* Margin */}
                <div>
                  <MarginBadge value={margin} />
                </div>

                {/* Action button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => openModal(game)}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 font-body transition-all duration-200"
                    style={{
                      fontSize:   '11px',
                      color:      hasPricing ? '#7C3AED' : '#4B5563',
                      background: hasPricing ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.04)',
                      border:     hasPricing ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <Settings2 style={{ width: '11px', height: '11px' }} />
                    {hasPricing ? t.gamePricing.editPricing : t.gamePricing.setPricing}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}
          >
            <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
              {t.gamePricing.showing} {filtered.length} {t.gamePricing.of} {games.length} {t.gamePricing.games}
            </span>
            <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
              {configuredCount} {t.gamePricing.configured} · {notConfiguredCount} {t.gamePricing.pending}
            </span>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && selected && (
          <GamePricingModal
            game={selected}
            onClose={() => { setModalOpen(false); setSelected(null); }}
            onSaved={(id, data) => handleSaved(id, data as GamePricingStatus)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
