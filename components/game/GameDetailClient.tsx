'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star, Calendar, Monitor, Package, Users,
  Zap, Tag, Apple, Terminal, Shield, Globe, Check,
  Award, ChevronRight, Maximize2, ShoppingCart, Heart, Cpu,
  Play, Volume2, VolumeX,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import GameCard from '@/components/catalog/GameCard';
import ReviewSection from '@/components/game/ReviewSection';
import TrustIndicators from '@/components/product/TrustIndicators';
import FullscreenGallery from '@/components/product/FullscreenGallery';
import { useWishlist } from '@/hooks/useWishlist';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { parseMedia, isVideoMedia, isYouTubeMedia } from '@/lib/media';
import { useHls, isHlsUrl } from '@/hooks/useHls';
import type { GameListItem } from '@/lib/db/games';
import type { getGameBySlug } from '@/lib/db/games';

type GameDetail = NonNullable<Awaited<ReturnType<typeof getGameBySlug>>>;

function PlatformIcon({ p }: { p: string }) {
  if (p === 'Mac')   return <Apple className="w-3.5 h-3.5" />;
  if (p === 'Linux') return <Terminal className="w-3.5 h-3.5" />;
  return <Monitor className="w-3.5 h-3.5" />;
}

/* ── Inline HLS video player ── */
function InlineVideo({ encoded }: { encoded: string }) {
  const { src: rawSrc } = parseMedia(encoded);
  // Strip "video:" scheme prefix used in DB storage format
  const src = rawSrc.replace(/^video:/, '');
  const vidRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted,   setMuted]   = useState(false);

  useHls(vidRef, src);

  const toggle = () => {
    const v = vidRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = vidRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <div className="absolute inset-0 bg-black" onClick={toggle}>
      <video
        ref={vidRef}
        src={isHlsUrl(src) ? undefined : src}
        playsInline
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'contain' }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {/* Dark overlay when paused */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
           style={{ background: 'rgba(0,0,0,0.45)', opacity: playing ? 0 : 1 }} />
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
               style={{ background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(10px)', border: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}>
            <Play style={{ width: '30px', height: '30px', color: '#fff', marginLeft: '4px' }} />
          </div>
        </div>
      )}
      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-4 py-3 opacity-0 hover:opacity-100 transition-opacity duration-200"
           style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}
           onClick={e => e.stopPropagation()}>
        <button onClick={toggle} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10">
          {playing
            ? <span style={{ color: '#fff', fontSize: '14px' }}>⏸</span>
            : <Play style={{ width: '14px', height: '14px', color: '#fff', marginLeft: '1px' }} />}
        </button>
        <button onClick={toggleMute} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10">
          {muted
            ? <VolumeX style={{ width: '14px', height: '14px', color: '#fff' }} />
            : <Volume2 style={{ width: '14px', height: '14px', color: '#fff' }} />}
        </button>
        <div className="flex-1" />
        <span className="font-body text-white/40" style={{ fontSize: '10px', letterSpacing: '0.08em' }}>ТРЕЙЛЕР</span>
      </div>
    </div>
  );
}

/* ── Inner gallery component ── */
function GallerySection({ screenshots, title }: { screenshots: string[]; title: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [fsOpen, setFsOpen]       = useState(false);
  const openFs  = useCallback(() => setFsOpen(true),  []);
  const closeFs = useCallback(() => setFsOpen(false), []);
  const prev    = useCallback(() => setActiveIdx(i => (i === 0 ? screenshots.length - 1 : i - 1)), [screenshots.length]);
  const next    = useCallback(() => setActiveIdx(i => (i === screenshots.length - 1 ? 0 : i + 1)), [screenshots.length]);

  const currentEncoded = screenshots[activeIdx] ?? '';
  const isVideo   = isVideoMedia(currentEncoded);
  const isYouTube = isYouTubeMedia(currentEncoded);
  const { src: currentSrc, thumb: currentThumb } = parseMedia(currentEncoded);

  return (
    <>
      {/* Large preview */}
      <div
        className="group relative rounded-[20px] overflow-hidden mb-4"
        style={{
          aspectRatio: '16/7',
          maxHeight: '520px',
          background: '#05050E',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 0 80px rgba(0,0,0,0.6)',
          cursor: isVideo ? 'default' : 'zoom-in',
        }}
        onClick={() => { if (!isVideo) openFs(); }}
      >
        <AnimatePresence mode="wait">
          {isYouTube ? (
            <motion.iframe
              key={`yt-${activeIdx}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              src={currentSrc}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen" allowFullScreen
              style={{ border: 'none' }}
            />
          ) : isVideo ? (
            <motion.div
              key={`v-${activeIdx}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <InlineVideo encoded={currentEncoded} />
            </motion.div>
          ) : (
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={currentSrc}
                alt={`${title} screenshot ${activeIdx + 1}`}
                fill unoptimized
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video badge */}
        {isVideo && (
          <div className="absolute top-4 left-4 font-pixel flex items-center gap-1.5 pointer-events-none" style={{
            fontSize: '9px', letterSpacing: '0.08em',
            padding: '5px 12px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #EF4444, #F97316)', color: '#fff',
            boxShadow: '0 0 16px rgba(239,68,68,0.5)',
          }}>
            ▶ ТРЕЙЛЕР
          </div>
        )}

        {/* Gradient overlay */}
        {!isVideo && (
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(to top, rgba(4,4,10,0.55) 0%, transparent 40%)',
          }} />
        )}

        {/* Counter */}
        <div className="absolute bottom-4 left-4 font-body pointer-events-none" style={{
          fontSize: '11px', color: '#6B7280',
          background: 'rgba(4,4,10,0.7)', backdropFilter: 'blur(8px)',
          padding: '4px 10px', borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {activeIdx + 1} / {screenshots.length}
        </div>

        {/* Fullscreen btn (images only) */}
        {!isVideo && (
          <div className="absolute bottom-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none" style={{
            background: 'rgba(4,4,10,0.75)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <Maximize2 style={{ width: '16px', height: '16px', color: '#fff' }} />
          </div>
        )}

        {/* Arrows */}
        {screenshots.length > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
              style={{ background: 'rgba(4,4,10,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.5)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              <ChevronRight style={{ width: '18px', height: '18px', color: '#fff', transform: 'rotate(180deg)' }} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
              style={{ background: 'rgba(4,4,10,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.5)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              <ChevronRight style={{ width: '18px', height: '18px', color: '#fff' }} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail rail */}
      <div className="flex gap-2.5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
        {screenshots.map((encoded, i) => {
          const isVid = isVideoMedia(encoded);
          const { src, thumb } = parseMedia(encoded);
          const thumbSrc = isVid ? (thumb ?? null) : src;
          return (
            <motion.button
              key={i}
              onClick={() => setActiveIdx(i)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="flex-shrink-0 relative rounded-xl overflow-hidden"
              style={{
                width: '140px', height: '80px',
                border: `2px solid ${i === activeIdx ? (isVid ? '#EF4444' : '#7C3AED') : 'rgba(255,255,255,0.06)'}`,
                boxShadow: i === activeIdx ? (isVid ? '0 0 18px rgba(239,68,68,0.5)' : '0 0 18px rgba(124,58,237,0.55)') : 'none',
                background: '#05050E',
              }}
            >
              {thumbSrc ? (
                <>
                  <Image
                    src={thumbSrc} alt=""
                    fill unoptimized
                    className="object-cover transition-all duration-300"
                    style={{
                      opacity: i === activeIdx ? 1 : 0.4,
                      filter: i === activeIdx ? 'none' : 'saturate(0.6)',
                    }}
                  />
                  {isVid && (
                    <div className="absolute inset-0 flex items-center justify-center"
                         style={{ background: 'rgba(0,0,0,0.3)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center"
                           style={{ background: i === activeIdx ? 'rgba(239,68,68,0.85)' : 'rgba(239,68,68,0.5)' }}>
                        <Play style={{ width: '14px', height: '14px', color: '#fff', marginLeft: '2px' }} />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center"
                     style={{ background: i === activeIdx ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.07)' }}>
                  <Play style={{ width: '22px', height: '22px', color: i === activeIdx ? '#F87171' : '#4B5563', fill: i === activeIdx ? '#F87171' : '#4B5563' }} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {fsOpen && (
          <FullscreenGallery
            media={screenshots}
            startIndex={activeIdx}
            onClose={closeFs}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function GameDetailClient({
  game,
  similar,
}: {
  game: GameDetail;
  similar: GameListItem[];
}) {
  const { isIn, toggle } = useWishlist();
  const { data: session } = useSession();
  const router = useRouter();
  const isWishlisted = isIn(game.id);

  const isManual = game.deliveryType === 'MANUAL';
  const inStock  = game.stockStore > 0 || isManual;

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (!session) { router.push('/login'); return; }
    toggle(game.id);
  }

  return (
    <div style={{ background: '#04040A', minHeight: '100vh', paddingTop: '72px' }}>

      {/* ── Ambient blurred artwork bg ── */}
      {game.cover && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <Image
            src={game.cover} alt="" fill unoptimized priority
            className="object-cover"
            style={{ filter: 'blur(100px) saturate(0.25) brightness(0.1)', transform: 'scale(1.15)' }}
          />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(4,4,10,0.65) 0%, rgba(4,4,10,0.85) 30%, rgba(4,4,10,0.97) 60%, #04040A 100%)',
          }} />
        </div>
      )}

      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{
        zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,1) 1px,transparent 1px)',
        backgroundSize: '64px 64px',
        opacity: 0.016,
      }} />

      {/* Top radial glow */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{
        zIndex: 0,
        height: '700px',
        background: 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(124,58,237,0.1) 0%, transparent 70%)',
      }} />

      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-120%)} 100%{transform:translateX(200%)} }
        @keyframes float-y { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Breadcrumb ── */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 py-3">
            <div className="flex items-center gap-2 font-body" style={{ fontSize: '12px', color: '#374151' }}>
              <Link href="/" className="hover:text-white transition-colors">Главная</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/catalog" className="hover:text-white transition-colors">Каталог</Link>
              <ChevronRight className="w-3 h-3" />
              <span style={{ color: '#6B7280' }} className="truncate max-w-[200px]">{game.title}</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            HERO: LEFT info + RIGHT artwork
        ══════════════════════════════════════════ */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-16">
          <div className="grid lg:grid-cols-[1fr_1.15fr] gap-10 xl:gap-20 items-start">

            {/* ── LEFT: info + price ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Genre badges */}
              {game.genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  {game.genres.slice(0, 4).map((g) => (
                    <Link
                      key={g}
                      href={`/catalog?genre=${encodeURIComponent(g)}`}
                      className="flex items-center gap-1.5 font-pixel capitalize transition-opacity hover:opacity-80"
                      style={{
                        fontSize: '9px', letterSpacing: '0.1em',
                        color: '#9D60FA',
                        background: 'rgba(124,58,237,0.1)',
                        border: '1px solid rgba(124,58,237,0.25)',
                        padding: '5px 12px', borderRadius: '99px',
                      }}
                    >
                      <Tag style={{ width: '8px', height: '8px' }} />
                      {g}
                    </Link>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1
                className="font-heading font-bold text-white mb-2"
                style={{
                  fontSize: 'clamp(32px, 5vw, 58px)',
                  lineHeight: '1.03',
                  letterSpacing: '-0.025em',
                  textShadow: '0 0 80px rgba(124,58,237,0.25)',
                }}
              >
                {game.title}
              </h1>

              {/* Accent divider */}
              <div className="mb-5" style={{
                height: '1px',
                background: 'linear-gradient(90deg, rgba(124,58,237,0.6), rgba(6,182,212,0.3), transparent)',
              }} />

              {/* Rating + date + developer */}
              <div className="flex flex-wrap items-center gap-4 mb-5">
                {game.rating != null && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} style={{
                          width: '15px', height: '15px',
                          color: s <= Math.round(game.rating!) ? '#F59E0B' : '#1F2937',
                          fill: s <= Math.round(game.rating!) ? '#F59E0B' : 'transparent',
                        }} />
                      ))}
                    </div>
                    <span className="font-heading font-bold" style={{ color: '#F59E0B', fontSize: '17px' }}>
                      {game.rating.toFixed(1)}
                    </span>
                  </div>
                )}
                {game.releaseDate && (
                  <div className="flex items-center gap-1.5" style={{ color: '#374151', fontSize: '12px' }}>
                    <Calendar style={{ width: '11px', height: '11px', color: '#4B5563' }} />
                    <span className="font-body">
                      {new Date(game.releaseDate).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })}
                    </span>
                  </div>
                )}
                {game.developer && (
                  <div className="flex items-center gap-1.5" style={{ color: '#374151', fontSize: '12px' }}>
                    <Users style={{ width: '11px', height: '11px', color: '#4B5563' }} />
                    <span className="font-body" style={{ color: '#6B7280' }}>{game.developer}</span>
                  </div>
                )}
              </div>

              {/* Platform chips */}
              {game.platforms.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {game.platforms.map((p) => (
                    <div key={p} className="flex items-center gap-2 font-heading font-semibold rounded-xl" style={{
                      padding: '8px 16px', fontSize: '12px',
                      background: 'rgba(124,58,237,0.1)',
                      border: '1px solid rgba(124,58,237,0.25)',
                      color: '#C4B5FD',
                    }}>
                      <PlatformIcon p={p} />
                      {p}
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              {game.description && (
                <p className="font-body leading-relaxed mb-6" style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.75' }}>
                  {game.description.length > 320
                    ? game.description.slice(0, 320) + '…'
                    : game.description}
                </p>
              )}

              {/* Developer / Publisher */}
              {(game.developer || game.publisher) && (
                <div className="flex items-center gap-4 mb-6">
                  {game.developer && (
                    <div>
                      <p className="font-pixel uppercase mb-0.5" style={{ fontSize: '8px', letterSpacing: '0.1em', color: '#374151' }}>Разработчик</p>
                      <p className="font-body" style={{ color: '#6B7280', fontSize: '13px' }}>{game.developer}</p>
                    </div>
                  )}
                  {game.publisher && game.publisher !== game.developer && (
                    <>
                      <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.07)' }} />
                      <div>
                        <p className="font-pixel uppercase mb-0.5" style={{ fontSize: '8px', letterSpacing: '0.1em', color: '#374151' }}>Издатель</p>
                        <p className="font-body" style={{ color: '#6B7280', fontSize: '13px' }}>{game.publisher}</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── PRICE BOX ── */}
              <div
                className="rounded-3xl p-5 mb-4"
                style={{
                  background: 'rgba(8,8,18,0.85)',
                  border: '1px solid rgba(124,58,237,0.18)',
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 0 60px rgba(124,58,237,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              >
                {/* Stock */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full" style={{
                    background: isManual ? '#A78BFA' : inStock ? '#22C55E' : '#6B7280'
                  }} />
                  <span className="font-body text-sm" style={{
                    color: isManual ? '#A78BFA' : inStock ? '#22C55E' : '#6B7280'
                  }}>
                    {isManual ? 'Ручная доставка' : inStock ? `В наличии · ${game.stockStore} шт.` : 'Нет в наличии'}
                  </span>
                </div>

                {/* Price + coins */}
                {game.priceUzs != null && (
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <span className="font-heading font-bold" style={{
                        fontSize: 'clamp(26px, 4vw, 36px)',
                        letterSpacing: '-0.025em', color: '#fff',
                        textShadow: '0 0 40px rgba(255,255,255,0.08)',
                      }}>
                        {formatPrice(game.priceUzs)}
                      </span>
                      {game.priceUsd != null && (
                        <p className="font-body mt-0.5" style={{ fontSize: '12px', color: '#4B5563' }}>
                          ≈ ${game.priceUsd.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5" style={{
                      background: 'rgba(124,58,237,0.1)',
                      border: '1px solid rgba(124,58,237,0.2)',
                    }}>
                      <Zap style={{ width: '11px', height: '11px', color: '#9D60FA' }} />
                      <span className="font-heading font-semibold" style={{ color: '#9D60FA', fontSize: '11px' }}>
                        +{Math.round(game.priceUzs / 1000)} Arcane Coins
                      </span>
                    </div>
                  </div>
                )}

                {/* Buttons row */}
                <div className="flex gap-3">
                  {inStock ? (
                    <Link
                      href={`/checkout?gameId=${game.id}`}
                      className="flex-1 relative overflow-hidden rounded-2xl font-heading font-bold flex items-center justify-center gap-2 text-white"
                      style={{
                        padding: '15px 24px', fontSize: '14px', letterSpacing: '0.02em',
                        background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 45%, #0891B2 100%)',
                        boxShadow: '0 0 40px rgba(124,58,237,0.45), 0 0 80px rgba(124,58,237,0.15), 0 8px 24px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="absolute inset-0 pointer-events-none" style={{
                        background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.1) 50%, transparent 65%)',
                        animation: 'shimmer 2.8s ease infinite',
                      }} />
                      <ShoppingCart style={{ width: '16px', height: '16px', position: 'relative', zIndex: 1 }} />
                      <span style={{ position: 'relative', zIndex: 1 }}>Купить сейчас</span>
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="flex-1 rounded-2xl font-heading font-bold text-sm cursor-not-allowed flex items-center justify-center"
                      style={{
                        padding: '15px 24px',
                        background: 'rgba(107,114,128,0.1)',
                        color: '#6B7280',
                        border: '1px solid rgba(107,114,128,0.2)',
                      }}
                    >
                      Нет в наличии
                    </button>
                  )}

                  {/* Wishlist button */}
                  <motion.button
                    onClick={handleWishlist}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.93 }}
                    className="rounded-2xl flex items-center justify-center"
                    style={{
                      padding: '15px 16px',
                      background: isWishlisted ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isWishlisted ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.07)'}`,
                      color: isWishlisted ? '#F87171' : '#374151',
                      boxShadow: isWishlisted ? '0 0 20px rgba(239,68,68,0.25)' : 'none',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <Heart
                      style={{ width: '20px', height: '20px' }}
                      className={isWishlisted ? 'fill-current text-red-400' : ''}
                    />
                  </motion.button>
                </div>
              </div>

              {/* Trust mini row */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { icon: Shield, label: 'Гарантия',  sub: 'Подлинности' },
                  { icon: Globe,  label: 'RU / CIS',  sub: 'Регион' },
                  { icon: Check,  label: 'Проверено', sub: 'Вручную' },
                ].map(item => (
                  <div key={item.label} className="flex flex-col items-center text-center gap-1.5 rounded-2xl py-3.5" style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <item.icon style={{ width: '14px', height: '14px', color: '#7C3AED' }} />
                    <span className="font-heading font-semibold" style={{ color: '#9CA3AF', fontSize: '11px' }}>{item.label}</span>
                    <span className="font-body" style={{ color: '#374151', fontSize: '10px' }}>{item.sub}</span>
                  </div>
                ))}
              </div>

              {/* Delivery note */}
              <div className="flex items-center gap-3 rounded-2xl p-4" style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <Zap style={{ width: '16px', height: '16px', color: isManual ? '#A78BFA' : '#22C55E', flexShrink: 0 }} />
                <div>
                  <p className="font-heading font-semibold" style={{ color: isManual ? '#A78BFA' : '#22C55E', fontSize: '13px' }}>
                    {isManual ? 'Ручная доставка' : 'Мгновенная доставка'}
                  </p>
                  <p className="font-body" style={{ color: '#374151', fontSize: '12px' }}>
                    {isManual
                      ? 'Администратор обработает заказ вручную после оплаты'
                      : 'Ключ отправляется на email сразу после оплаты'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ── RIGHT: Cinematic artwork ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative lg:sticky lg:top-[100px]"
            >
              {/* Artwork glow halo */}
              <div className="absolute inset-0 pointer-events-none" style={{
                borderRadius: '28px',
                background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(124,58,237,0.2) 0%, transparent 70%)',
                filter: 'blur(40px)',
                transform: 'scale(1.1)',
                zIndex: -1,
              }} />

              {/* Main 16:9 artwork frame */}
              {game.cover ? (
                <div className="relative rounded-[24px] overflow-hidden" style={{
                  aspectRatio: '16/9',
                  border: '1px solid rgba(124,58,237,0.2)',
                  boxShadow: '0 0 0 1px rgba(124,58,237,0.1), 0 0 80px rgba(124,58,237,0.2), 0 40px 100px rgba(0,0,0,0.7)',
                  background: '#07070F',
                }}>
                  <Image
                    src={game.cover} alt={game.title}
                    fill priority unoptimized
                    className="object-cover"
                  />

                  {/* Gradient overlays */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(to top, rgba(4,4,10,0.75) 0%, rgba(4,4,10,0.1) 45%, transparent 70%)',
                  }} />
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(to right, rgba(4,4,10,0.35) 0%, transparent 35%)',
                  }} />

                  {/* Developer chip */}
                  {game.developer && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2" style={{
                      background: 'rgba(4,4,10,0.75)', backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '6px 12px', borderRadius: '10px',
                    }}>
                      <Cpu style={{ width: '11px', height: '11px', color: '#7C3AED' }} />
                      <span className="font-body" style={{ color: '#9CA3AF', fontSize: '11px' }}>{game.developer}</span>
                    </div>
                  )}

                  {/* Screenshot count chip */}
                  {game.screenshots.length > 0 && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-1.5" style={{
                      background: 'rgba(4,4,10,0.75)', backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '6px 10px', borderRadius: '10px',
                    }}>
                      <Maximize2 style={{ width: '10px', height: '10px', color: '#6B7280' }} />
                      <span className="font-body" style={{ color: '#6B7280', fontSize: '10px' }}>
                        {game.screenshots.length} скриншотов
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative rounded-[24px] overflow-hidden flex items-center justify-center" style={{
                  aspectRatio: '16/9',
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))',
                  border: '1px solid rgba(124,58,237,0.2)',
                }}>
                  <Package style={{ width: '64px', height: '64px', color: 'rgba(255,255,255,0.15)' }} />
                </div>
              )}

              {/* Floating glow under card */}
              <div className="absolute pointer-events-none" style={{
                bottom: '-30px', left: '10%', right: '10%', height: '60px',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(124,58,237,0.35) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }} />

              {/* Floating stat: Rating */}
              {game.rating != null && (
                <motion.div
                  initial={{ opacity: 0, x: 20, y: -5 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  className="absolute rounded-2xl px-4 py-3"
                  style={{
                    top: '-12px', right: '-16px',
                    background: 'rgba(8,8,18,0.9)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    boxShadow: '0 0 30px rgba(245,158,11,0.08), 0 8px 32px rgba(0,0,0,0.5)',
                    animation: 'float-y 4s ease-in-out infinite',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                      background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Star style={{ width: '14px', height: '14px', color: '#F59E0B', fill: '#F59E0B' }} />
                    </div>
                    <div>
                      <p className="font-heading font-bold" style={{ color: '#fff', fontSize: '18px', lineHeight: 1 }}>
                        {game.rating.toFixed(1)}
                      </p>
                      <p className="font-body" style={{ color: '#4B5563', fontSize: '10px', marginTop: '2px' }}>Рейтинг игры</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Floating stat: Award (if rating >= 4.5) */}
              {game.rating != null && game.rating >= 4.5 && (
                <motion.div
                  initial={{ opacity: 0, x: -20, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  className="absolute rounded-2xl px-4 py-3"
                  style={{
                    bottom: '20px', left: '-18px',
                    background: 'rgba(8,8,18,0.9)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(124,58,237,0.2)',
                    boxShadow: '0 0 30px rgba(124,58,237,0.1), 0 8px 32px rgba(0,0,0,0.5)',
                    animation: 'float-y 5s ease-in-out 1s infinite',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Award style={{ width: '18px', height: '18px', color: '#9D60FA' }} />
                    <div>
                      <p className="font-heading font-semibold" style={{ color: '#fff', fontSize: '11px' }}>Выбор редакции</p>
                      <p className="font-body" style={{ color: '#4B5563', fontSize: '10px' }}>Arcane.uz 2025</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            GALLERY SECTION
        ══════════════════════════════════════════ */}
        {game.screenshots.length > 0 && (
          <section style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '48px', paddingBottom: '48px' }}>
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10">
              <div className="flex items-center gap-3 mb-6">
                <div style={{ width: '3px', height: '22px', background: 'linear-gradient(to bottom, #7C3AED, #06B6D4)', borderRadius: '2px' }} />
                <h2 className="font-heading font-bold text-white" style={{ fontSize: '18px' }}>Скриншоты</h2>
                <span className="font-body" style={{ color: '#374151', fontSize: '12px' }}>
                  {game.screenshots.length} медиафайлов
                </span>
              </div>

              <GallerySection screenshots={game.screenshots} title={game.title} />
            </div>
          </section>
        )}

        {/* ── Trust indicators ── */}
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10">
          <TrustIndicators />
        </div>

        {/* ── Reviews ── */}
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 mt-8">
          <ReviewSection slug={game.slug} />
        </div>

        {/* ── Similar games ── */}
        {similar.length > 0 && (
          <div
            className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 pb-20"
            style={{ marginTop: '64px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div style={{ width: '3px', height: '22px', background: 'linear-gradient(to bottom, #7C3AED, #06B6D4)', borderRadius: '2px' }} />
              <h2 className="font-heading font-bold text-xl text-white">Похожие игры</h2>
              <Link
                href="/catalog"
                className="font-body text-sm transition-colors hover:text-white ml-auto"
                style={{ color: '#6B7280' }}
              >
                Весь каталог →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {similar.map((g, i) => <GameCard key={g.id} game={g} index={i} />)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
