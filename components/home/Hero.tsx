'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight, Zap, Shield, Clock, Star,
  ShoppingBag, Flame,
} from 'lucide-react';
import { useDict } from '@/lib/locale/client';

/* ─────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────── */
const E = [0.22, 1, 0.36, 1] as const;

interface GameData {
  id: string;
  title: string;
  genre: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  image: string;
  badge: string;
  badgeColor: string;
  accent: string;
  glow: string;
}

const GAMES: GameData[] = [
  {
    id: 'elden-ring',
    title: 'Elden Ring',
    genre: 'Action RPG',
    price: 299000,
    rating: 4.9,
    image: 'https://media.rawg.io/media/games/b29/b294fdd866dcdb643e7bab370a552855.jpg',
    badge: 'HOT',
    badgeColor: '#EF4444',
    accent: '#F59E0B',
    glow: 'rgba(245,158,11,0.28)',
  },
  {
    id: 'gta-vi',
    title: 'GTA VI',
    genre: 'Open World',
    price: 479000,
    rating: 5.0,
    image: 'https://media.rawg.io/media/games/734/7342a1cd82c8997ec620084ae4c2e7e4.jpg',
    badge: 'НОВИНКА',
    badgeColor: '#06B6D4',
    accent: '#06B6D4',
    glow: 'rgba(6,182,212,0.35)',
  },
  {
    id: 'cyberpunk-2077',
    title: 'Cyberpunk 2077',
    genre: 'RPG / Action',
    price: 249000,
    originalPrice: 349000,
    discount: 29,
    rating: 4.8,
    image: 'https://media.rawg.io/media/games/26d/26d4437715bee60138dab4a7c8c59c92.jpg',
    badge: '−29%',
    badgeColor: '#EF4444',
    accent: '#F59E0B',
    glow: 'rgba(234,179,8,0.22)',
  },
];

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: `${4 + (i * 6.1) % 92}%`,
  top: `${8 + (i * 7.7) % 84}%`,
  size: 1 + (i % 3),
  color: i % 3 === 0 ? '#7C3AED' : i % 3 === 1 ? '#06B6D4' : '#F59E0B',
  dur: 4 + (i % 4),
  delay: (i * 0.38) % 3,
}));

/* ─────────────────────────────────────────────────────────
   Animated counter
───────────────────────────────────────────────────────── */
function AnimCount({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let cur = 0;
    const inc = to / 55;
    const id = setInterval(() => {
      cur += inc;
      if (cur >= to) { setV(to); clearInterval(id); }
      else setV(Math.floor(cur));
    }, 20);
    return () => clearInterval(id);
  }, [to]);
  return <>{v.toLocaleString('ru')}{suffix}</>;
}

/* ─────────────────────────────────────────────────────────
   3-D tilt game card
───────────────────────────────────────────────────────── */
function GameCard({
  game, slot, delay,
}: {
  game: GameData;
  slot: 0 | 1 | 2;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rxS = useSpring(rx, { stiffness: 250, damping: 26 });
  const ryS = useSpring(ry, { stiffness: 250, damping: 26 });

  const h = useDict().home.hero;
  const isMain = slot === 1;
  const initRot = slot === 0 ? -5 : slot === 2 ? 5 : 0;

  const posStyle: React.CSSProperties =
    slot === 0 ? { left: 0,                                     width: '44%', height: '70%', bottom: 0, zIndex: 1 } :
    slot === 1 ? { left: '50%', transform: 'translateX(-50%)', width: '54%', height: '100%', bottom: 0, zIndex: 3 } :
                 { right: 0,                                    width: '44%', height: '70%', bottom: 0, zIndex: 2 };

  function onMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    ry.set(nx * 9);
    rx.set(-ny * 9);
  }
  function onLeave() { rx.set(0); ry.set(0); }

  return (
    <div className="absolute" style={posStyle}>
      <motion.div
        ref={ref}
        className="w-full h-full cursor-pointer"
        initial={{ opacity: 0, y: 70, rotate: initRot }}
        animate={{ opacity: 1, y: 0, rotate: initRot }}
        transition={{ duration: 0.9, delay, ease: E }}
        style={{ rotateX: rxS, rotateY: ryS, transformPerspective: 900 }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        whileHover={{ scale: 1.045, y: -10, transition: { duration: 0.28, ease: 'easeOut' } }}
      >
        <div
          className="relative w-full h-full rounded-2xl overflow-hidden"
          style={{
            boxShadow: isMain
              ? `0 0 80px ${game.glow}, 0 32px 80px rgba(0,0,0,0.82), inset 0 1px 0 rgba(255,255,255,0.07)`
              : `0 16px 48px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)`,
            border: isMain
              ? `1.5px solid ${game.accent}45`
              : '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <Image
            src={game.image}
            alt={game.title}
            fill
            className="object-cover"
            unoptimized
            priority={isMain}
          />

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/15 to-black/35" />

          {/* Cinematic color cast — center card only */}
          {isMain && (
            <>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: `linear-gradient(130deg, ${game.accent}10 0%, transparent 55%)` }}
              />
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ opacity: [0.3, 0.65, 0.3] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ background: `radial-gradient(ellipse at 80% 20%, ${game.accent}12 0%, transparent 60%)` }}
              />
            </>
          )}

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.75, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: delay + 0.35, duration: 0.3, ease: E }}
            className="absolute top-3 left-3 font-pixel rounded-lg px-2.5 py-1 text-white"
            style={{
              fontSize: '7px',
              letterSpacing: '0.08em',
              background: `linear-gradient(135deg, ${game.badgeColor}, ${game.badgeColor}CC)`,
              boxShadow: `0 0 14px ${game.badgeColor}70, 0 2px 8px rgba(0,0,0,0.4)`,
            }}
          >
            {game.badge === 'НОВИНКА' ? h.badgeNew : game.badge}
          </motion.div>

          {/* Platform chip */}
          <div
            className="absolute top-3 right-3 font-pixel rounded-md px-2 py-1"
            style={{
              fontSize: '6px',
              color: '#6B7280',
              background: 'rgba(0,0,0,0.55)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(6px)',
            }}
          >
            PC · PS5
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p
              className="font-heading font-bold text-white leading-tight"
              style={{ fontSize: isMain ? '16px' : '12px' }}
            >
              {game.title}
            </p>
            <p className="font-body text-gray-500 mt-0.5" style={{ fontSize: isMain ? '11px' : '9px' }}>
              {game.genre}
            </p>

            {isMain && (
              <div
                className="flex items-center justify-between mt-3 pt-3"
                style={{ borderTop: `1px solid ${game.accent}20` }}
              >
                <div className="flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                  <span className="font-body text-white" style={{ fontSize: '11px' }}>{game.rating}</span>
                  <span className="font-body text-gray-600 ml-1" style={{ fontSize: '10px' }}>· {h.reviewsCount}</span>
                </div>
                <div className="text-right">
                  {game.originalPrice && (
                    <p className="font-body text-gray-600 line-through" style={{ fontSize: '10px' }}>
                      {(game.originalPrice / 1000).toFixed(0)}K
                    </p>
                  )}
                  <p
                    className="font-heading font-bold leading-none"
                    style={{ color: game.accent, fontSize: '16px' }}
                  >
                    {(game.price / 1000).toFixed(0)}K {h.priceSuffix}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Hero
───────────────────────────────────────────────────────── */
export default function Hero() {
  const h = useDict().home.hero;
  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: '#05050E' }}
    >

      {/* ── Background gradient ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0E0820] via-[#05050E] to-[#060D14]" />

      {/* ── Grid lines ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(124,58,237,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.03,
        }}
      />

      {/* ── Ambient animated blobs ── */}
      <motion.div
        className="absolute -top-40 -left-40 w-[900px] h-[900px] rounded-full blur-[220px] pointer-events-none"
        animate={{ scale: [1, 1.14, 1], opacity: [0.07, 0.12, 0.07] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: '#7C3AED' }}
      />
      <motion.div
        className="absolute -bottom-60 -right-40 w-[800px] h-[800px] rounded-full blur-[200px] pointer-events-none"
        animate={{ scale: [1, 1.1, 1], opacity: [0.04, 0.08, 0.04] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
        style={{ background: '#06B6D4' }}
      />
      <motion.div
        className="absolute top-1/3 left-2/3 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none"
        animate={{ x: [-30, 30, -30], opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: '#7C3AED' }}
      />

      {/* ── Floating particles ── */}
      {PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            top: p.top,
            background: p.color,
          }}
          animate={{ y: [0, -22, 0], opacity: [0.18, 0.55, 0.18] }}
          transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
        />
      ))}

      {/* ── Top accent line ── */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.65) 40%, rgba(6,182,212,0.4) 60%, transparent)' }}
      />

      {/* ── Scanlines ── */}
      <div className="absolute inset-0 scanlines opacity-[0.1] pointer-events-none" />

      {/* ── Corner markers ── */}
      {([
        { pos: 'top-[108px] left-5',    t: true,  l: true  },
        { pos: 'top-[108px] right-5',   t: true,  l: false },
        { pos: 'bottom-[72px] left-5',  t: false, l: true  },
        { pos: 'bottom-[72px] right-5', t: false, l: false },
      ] as const).map(({ pos, t, l }) => (
        <div key={pos} className={`absolute ${pos} w-5 h-5 opacity-[0.18]`}>
          <div className={`absolute w-full h-px bg-[#7C3AED] ${t ? 'top-0' : 'bottom-0'}`} />
          <div className={`absolute h-full w-px bg-[#7C3AED] ${l ? 'left-0' : 'right-0'}`} />
        </div>
      ))}

      {/* ══ MAIN CONTENT ══ */}
      <div className="relative flex-1 flex items-center" style={{ zIndex: 1 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pt-28 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-center">

            {/* ─── LEFT: Text ─── */}
            <div className="order-2 lg:order-1 flex flex-col">

              {/* Live eyebrow */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: E }}
                className="mb-7"
              >
                <span
                  className="inline-flex items-center gap-2.5 rounded-full px-4 py-2"
                  style={{
                    background: 'rgba(124,58,237,0.08)',
                    border: '1px solid rgba(124,58,237,0.22)',
                    boxShadow: '0 0 24px rgba(124,58,237,0.07)',
                  }}
                >
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-[#10B981] flex-shrink-0"
                    animate={{ opacity: [1, 0.25, 1], scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="font-pixel text-[#9D60FA]" style={{ fontSize: '7.5px', letterSpacing: '0.14em' }}>
                    {h.eyebrow}
                  </span>
                  <span
                    className="font-pixel rounded-full px-2 py-0.5"
                    style={{
                      fontSize: '6.5px',
                      color: '#10B981',
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.25)',
                    }}
                  >
                    LIVE
                  </span>
                </span>
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.78, delay: 0.1, ease: E }}
                className="mb-5"
              >
                <h1
                  className="font-heading font-bold text-white leading-[1.03] tracking-tight"
                  style={{ fontSize: 'clamp(44px, 5.8vw, 74px)' }}
                >
                  {h.headlinePre && <>{h.headlinePre}{' '}</>}
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 35%, #22D3EE 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {h.headlineAccent}
                  </span>
                  <br />{h.headlinePost}
                </h1>
              </motion.div>

              {/* INSERT COIN line */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.22 }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="h-px w-8" style={{ background: 'rgba(124,58,237,0.5)' }} />
                <span className="font-pixel text-[#F59E0B] animate-blink" style={{ fontSize: '7.5px', letterSpacing: '0.1em' }}>
                  INSERT COIN TO PLAY
                </span>
                <div className="h-px w-24 bg-gradient-to-r from-[#7C3AED]/40 to-transparent" />
              </motion.div>

              {/* Sub-text */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.26, ease: E }}
                className="font-body text-gray-400 leading-relaxed mb-9 max-w-[490px]"
                style={{ fontSize: 'clamp(14px, 1.4vw, 16px)' }}
              >
                {h.subPre}
                <span className="text-[#F59E0B] font-medium">Arcane Coins</span>
                {h.subPost}
              </motion.p>

              {/* ── CTA Buttons ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.36, ease: E }}
                className="flex flex-wrap gap-3 mb-10"
              >
                {/* Primary */}
                <Link
                  href="/catalog"
                  className="group relative inline-flex items-center gap-2.5 font-heading font-semibold text-white rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    fontSize: '15px',
                    padding: '14px 28px',
                    background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                    boxShadow: '0 4px 28px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
                  }}
                >
                  {/* Shine sweep */}
                  <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
                  {/* Glow pulse */}
                  <motion.span
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    animate={{ boxShadow: ['0 0 0 rgba(124,58,237,0)', '0 0 22px rgba(124,58,237,0.55)', '0 0 0 rgba(124,58,237,0)'] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <span className="relative">{h.ctaCatalog}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200 relative flex-shrink-0" />
                </Link>

                {/* Secondary */}
                <Link
                  href="/catalog?filter=deals"
                  className="group relative inline-flex items-center gap-2 font-heading font-semibold rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    fontSize: '15px',
                    padding: '14px 28px',
                    color: '#FCD34D',
                    background: 'rgba(245,158,11,0.06)',
                    border: '1.5px solid rgba(245,158,11,0.28)',
                  }}
                >
                  <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-[#F59E0B]/10 to-transparent" />
                  <Zap className="w-4 h-4 relative flex-shrink-0" />
                  <span className="relative">{h.ctaDeals}</span>
                </Link>
              </motion.div>

              {/* ── Animated stats ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.46, ease: E }}
                className="flex items-center gap-6 sm:gap-10 mb-9"
              >
                {[
                  { to: 500,   suffix: '+',  label: h.statGames   },
                  { to: 50000, suffix: '+',  label: h.statPlayers },
                  { to: 99,    suffix: '%',  label: h.statHappy   },
                ].map((s, i, arr) => (
                  <div key={s.label} className="flex items-center gap-6 sm:gap-10">
                    <div>
                      <span
                        className="font-heading font-bold text-white leading-none block"
                        style={{ fontSize: 'clamp(20px, 2.2vw, 28px)' }}
                      >
                        <AnimCount to={s.to} suffix={s.suffix} />
                      </span>
                      <span className="font-body text-gray-500 text-xs mt-1 block">{s.label}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="h-8 w-px" style={{ background: '#1E1E2E' }} />
                    )}
                  </div>
                ))}
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.56 }}
                className="flex flex-wrap items-center gap-5"
              >
                {[
                  { icon: Shield, label: h.trustPayment  },
                  { icon: Clock,  label: h.trustDelivery },
                  { icon: Zap,    label: h.trustSupport  },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-gray-500">
                    <Icon className="w-3.5 h-3.5" style={{ color: 'rgba(124,58,237,0.5)' }} />
                    <span className="font-body text-xs">{label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ─── RIGHT: Game showcase ─── */}
            {/* The 3-card fan needs ~450px to breathe; on phones it's scaled
                down so the whole showcase (and its floating badges) fits the
                viewport instead of being clipped at the right edge. */}
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative h-[380px] xs:h-[440px] sm:h-[520px] lg:h-[580px] w-full max-w-[460px] scale-[0.82] xs:scale-90 sm:scale-100 origin-top">

                {/* Ground glow */}
                <motion.div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-24 rounded-full pointer-events-none"
                  style={{ background: 'rgba(124,58,237,0.22)', filter: 'blur(55px)' }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Game cards */}
                {GAMES.map((g, i) => (
                  <GameCard
                    key={g.id}
                    game={g}
                    slot={i as 0 | 1 | 2}
                    delay={0.3 + i * 0.13}
                  />
                ))}

                {/* ── Float: Arcane Coins ── */}
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.88 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 1.0, duration: 0.55, ease: E }}
                  className="absolute -bottom-3 -left-3 z-20"
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{
                      background: 'rgba(6,6,12,0.97)',
                      border: '1px solid rgba(245,158,11,0.25)',
                      boxShadow: '0 0 32px rgba(245,158,11,0.12), 0 8px 32px rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(20px)',
                    }}
                  >
                    <motion.div
                      animate={{ rotateY: [0, 180, 360] }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
                      style={{ transformStyle: 'preserve-3d', flexShrink: 0 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/coin_header.png"
                        alt=""
                        aria-hidden
                        style={{
                          display: 'block',
                          width: '34px',
                          height: '34px',
                          objectFit: 'cover',
                          objectPosition: 'center top',
                        }}
                      />
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="font-pixel text-[#F59E0B] leading-none" style={{ fontSize: '8.5px' }}>
                          ARCANE COINS
                        </p>
                        <motion.div
                          className="w-1 h-1 rounded-full bg-[#F59E0B]"
                          animate={{ opacity: [1, 0.25, 1] }}
                          transition={{ duration: 1.6, repeat: Infinity }}
                        />
                      </div>
                      <p className="font-body text-gray-400" style={{ fontSize: '11px' }}>{h.coinPerBuy}</p>
                    </div>
                  </motion.div>
                </motion.div>

                {/* ── Float: Online count ── */}
                <motion.div
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1, duration: 0.5, ease: E }}
                  className="absolute -top-2 -right-2 z-20"
                >
                  <div
                    className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
                    style={{
                      background: 'rgba(6,6,12,0.97)',
                      border: '1px solid rgba(124,58,237,0.18)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    }}
                  >
                    <motion.span
                      className="w-1.5 h-1.5 bg-[#10B981] rounded-full flex-shrink-0"
                      animate={{ opacity: [1, 0.25, 1], scale: [1, 1.6, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="font-pixel text-gray-400" style={{ fontSize: '7.5px' }}>
                      ONLINE: 3,241
                    </span>
                  </div>
                </motion.div>

                {/* ── Float: Purchases today ── */}
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2, duration: 0.5, ease: E }}
                  className="absolute top-1/3 -left-2 z-20 hidden lg:block"
                >
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{
                      background: 'rgba(6,6,12,0.96)',
                      border: '1px solid rgba(34,197,94,0.22)',
                      backdropFilter: 'blur(16px)',
                      boxShadow: '0 0 18px rgba(34,197,94,0.07)',
                    }}
                  >
                    <ShoppingBag className="w-3 h-3 flex-shrink-0" style={{ color: '#22C55E' }} />
                    <span className="font-pixel" style={{ fontSize: '7px', color: '#22C55E' }}>
                      {h.purchasedToday}
                    </span>
                  </div>
                </motion.div>

                {/* ── Float: Trending ── */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.15, duration: 0.5, ease: E }}
                  className="absolute top-3 left-1/2 -translate-x-1/2 z-10"
                >
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                    style={{
                      background: 'rgba(6,6,12,0.9)',
                      border: '1px solid rgba(239,68,68,0.28)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 0 14px rgba(239,68,68,0.08)',
                    }}
                  >
                    <Flame className="w-2.5 h-2.5 text-[#EF4444] flex-shrink-0" />
                    <span className="font-pixel" style={{ fontSize: '6px', color: '#EF4444', letterSpacing: '0.08em' }}>
                      TRENDING NOW
                    </span>
                  </motion.div>
                </motion.div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ BOTTOM TRUST BAR ══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.92 }}
        className="relative"
        style={{
          borderTop: '1px solid rgba(30,30,46,0.6)',
          background: 'rgba(7,7,14,0.9)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Top glow line */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.3) 30%, rgba(6,182,212,0.2) 70%, transparent)' }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[
              { icon: '⚡', label: h.bar.deliveryLabel, desc: h.bar.deliveryDesc },
              { icon: '🛡️', label: h.bar.licenseLabel,  desc: h.bar.licenseDesc  },
              { icon: '💬', label: h.bar.supportLabel,  desc: h.bar.supportDesc  },
              { icon: '🪙', label: h.bar.coinsLabel,    desc: h.bar.coinsDesc    },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.05 + i * 0.07 }}
                className="flex items-center gap-3 group"
              >
                <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  {item.icon}
                </span>
                <div>
                  <p className="font-body font-medium text-white text-sm leading-tight">{item.label}</p>
                  <p className="font-body text-gray-500 text-xs mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

    </section>
  );
}
