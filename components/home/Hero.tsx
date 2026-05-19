'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Zap, Shield, Clock, Star } from 'lucide-react';

const featuredGames = [
  {
    id: '2',
    title: 'Elden Ring',
    genre: 'Action RPG',
    price: 299000,
    rating: 4.9,
    image: 'https://picsum.photos/seed/eldenring/400/600',
    badge: 'HOT',
    badgeColor: '#7C3AED',
  },
  {
    id: '4',
    title: 'GTA VI',
    genre: 'Open World',
    price: 399000,
    rating: 5.0,
    image: 'https://picsum.photos/seed/gtavi/400/600',
    badge: 'NEW',
    badgeColor: '#06B6D4',
  },
  {
    id: '1',
    title: 'Cyberpunk 2077',
    genre: 'RPG / Action',
    price: 249000,
    originalPrice: 349000,
    discount: 29,
    rating: 4.8,
    image: 'https://picsum.photos/seed/cyber2077/400/600',
    badge: '-29%',
    badgeColor: '#EF4444',
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: '#06060E' }}>

      {/* === BACKGROUND LAYERS === */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0E0820] via-[#06060E] to-[#060D14]" />
      <div className="absolute inset-0 bg-grid-lines bg-[size:48px_48px] opacity-[0.28]" />

      {/* Atmospheric glows */}
      <div className="absolute -top-40 -left-40 w-[800px] h-[800px] rounded-full blur-[200px] pointer-events-none" style={{ background: 'rgba(124,58,237,0.07)' }} />
      <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full blur-[180px] pointer-events-none" style={{ background: 'rgba(6,182,212,0.045)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] rounded-full blur-[140px] pointer-events-none" style={{ background: 'rgba(124,58,237,0.025)' }} />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7C3AED]/60 to-transparent" />

      {/* Subtle scanlines */}
      <div className="absolute inset-0 scanlines opacity-[0.12] pointer-events-none" />

      {/* Corner markers */}
      {([
        { pos: 'top-[108px] left-5', t: true, l: true },
        { pos: 'top-[108px] right-5', t: true, l: false },
        { pos: 'bottom-[72px] left-5', t: false, l: true },
        { pos: 'bottom-[72px] right-5', t: false, l: false },
      ] as const).map(({ pos, t, l }) => (
        <div key={pos} className={`absolute ${pos} w-4 h-4 opacity-25`}>
          <div className={`absolute w-full h-px bg-[#7C3AED] ${t ? 'top-0' : 'bottom-0'}`} />
          <div className={`absolute h-full w-px bg-[#7C3AED] ${l ? 'left-0' : 'right-0'}`} />
        </div>
      ))}

      {/* === MAIN CONTENT === */}
      <div className="relative flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pt-28 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-center">

            {/* ─── LEFT: Text ─── */}
            <div className="order-2 lg:order-1 flex flex-col">

              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease }}
                className="mb-7"
              >
                <span
                  className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5"
                  style={{
                    background: 'rgba(124,58,237,0.08)',
                    border: '1px solid rgba(124,58,237,0.22)',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-pulse" />
                  <span className="font-pixel text-[#9D60FA]" style={{ fontSize: '8px', letterSpacing: '0.14em' }}>
                    ИГРОВОЙ МАГАЗИН №1 В УЗБЕКИСТАНЕ
                  </span>
                </span>
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease }}
                className="mb-4"
              >
                <h1
                  className="font-heading font-bold text-white leading-[1.04] tracking-tight"
                  style={{ fontSize: 'clamp(42px, 5.5vw, 70px)' }}
                >
                  Игры{' '}
                  <span style={{
                    background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 40%, #22D3EE 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    нового
                  </span>
                  <br />уровня
                </h1>
              </motion.div>

              {/* Arcade sub-line */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center gap-3 mb-7"
              >
                <div className="h-px w-8 bg-[#7C3AED]/50" />
                <span className="font-pixel text-[#F59E0B] animate-blink" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                  INSERT COIN TO PLAY
                </span>
                <div className="h-px w-24 bg-gradient-to-r from-[#7C3AED]/40 to-transparent" />
              </motion.div>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25, ease }}
                className="font-body text-gray-400 leading-relaxed mb-9 max-w-[490px]"
                style={{ fontSize: 'clamp(14px, 1.4vw, 16px)' }}
              >
                Мгновенная доставка лицензионных ключей для PC, PlayStation и Xbox.
                Эксклюзивные скидки, Mystery Cases и{' '}
                <span className="text-[#F59E0B] font-medium">Arcane Coins</span>{' '}
                с каждой покупкой.
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35, ease }}
                className="flex flex-wrap gap-3 mb-10"
              >
                <Link
                  href="/catalog"
                  className="group relative inline-flex items-center gap-2 font-heading font-semibold text-white px-7 py-3.5 rounded-lg overflow-hidden transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    fontSize: '15px',
                    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                    boxShadow: '0 4px 24px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
                  }}
                >
                  <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <span>Перейти в каталог</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                </Link>

                <Link
                  href="/catalog?filter=deals"
                  className="group inline-flex items-center gap-2 font-heading font-semibold px-7 py-3.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    fontSize: '15px',
                    color: '#FCD34D',
                    background: 'rgba(245,158,11,0.06)',
                    border: '1.5px solid rgba(245,158,11,0.3)',
                    boxShadow: '0 0 20px rgba(245,158,11,0.07)',
                  }}
                >
                  <Zap className="w-4 h-4" />
                  <span>Горячие скидки</span>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45, ease }}
                className="flex items-center gap-8 mb-8"
              >
                {[
                  { value: '500+', label: 'Игр' },
                  { value: '50K+', label: 'Игроков' },
                  { value: '4.9★', label: 'Рейтинг' },
                  { value: '99%', label: 'Довольных' },
                ].map((s, i, arr) => (
                  <div key={s.label} className="flex items-center gap-8">
                    <div className="flex flex-col">
                      <span
                        className="font-heading font-bold text-white leading-none"
                        style={{ fontSize: 'clamp(20px, 2.2vw, 28px)' }}
                      >
                        {s.value}
                      </span>
                      <span className="font-body text-gray-500 text-xs mt-1">{s.label}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="h-8 w-px bg-[#1E1E2E]" />
                    )}
                  </div>
                ))}
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.55 }}
                className="flex flex-wrap items-center gap-5"
              >
                {[
                  { icon: Shield, label: 'Защищённые платежи' },
                  { icon: Clock, label: 'Мгновенная доставка' },
                  { icon: Zap, label: 'Поддержка 24/7' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-gray-500">
                    <Icon className="w-3.5 h-3.5 text-[#7C3AED]/50" />
                    <span className="font-body text-xs">{label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ─── RIGHT: Game Cards ─── */}
            <div className="order-1 lg:order-2">
              <div className="relative h-[440px] sm:h-[520px] lg:h-[580px]">

                {/* Ambient glow below cards */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-20 rounded-full blur-[50px] pointer-events-none"
                  style={{ background: 'rgba(124,58,237,0.22)' }}
                />

                {featuredGames.map((game, i) => {
                  const isCenter = i === 1;
                  return (
                    <div
                      key={game.id}
                      className="absolute bottom-0"
                      style={
                        i === 0
                          ? { left: 0, width: '44%', height: '73%', zIndex: 1 }
                          : i === 1
                          ? { left: '50%', transform: 'translateX(-50%)', width: '52%', height: '100%', zIndex: 3 }
                          : { right: 0, width: '44%', height: '73%', zIndex: 1 }
                      }
                    >
                      <motion.div
                        className="w-full h-full"
                        initial={{ opacity: 0, y: 56, rotate: i === 0 ? -4 : i === 2 ? 4 : 0 }}
                        animate={{ opacity: 1, y: 0, rotate: i === 0 ? -4 : i === 2 ? 4 : 0 }}
                        transition={{ duration: 0.85, delay: 0.28 + i * 0.13, ease }}
                        whileHover={{ scale: 1.035, y: -5, transition: { duration: 0.25, ease: 'easeOut' } }}
                      >
                        <div
                          className="relative w-full h-full rounded-xl overflow-hidden"
                          style={{
                            boxShadow: isCenter
                              ? '0 0 70px rgba(124,58,237,0.28), 0 28px 70px rgba(0,0,0,0.75)'
                              : '0 12px 48px rgba(0,0,0,0.55)',
                            border: isCenter
                              ? '1.5px solid rgba(124,58,237,0.42)'
                              : '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <Image
                            src={game.image}
                            alt={game.title}
                            fill
                            className="object-cover transition-transform duration-700"
                            unoptimized
                          />

                          {/* Vignette */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/25" />

                          {/* Badge */}
                          <div
                            className="absolute top-3 left-3 font-pixel px-2 py-1 text-white rounded"
                            style={{
                              fontSize: '8px',
                              letterSpacing: '0.06em',
                              background: game.badgeColor,
                              boxShadow: `0 0 14px ${game.badgeColor}90`,
                            }}
                          >
                            {game.badge}
                          </div>

                          {/* Card info */}
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p
                              className="font-heading font-semibold text-white leading-tight"
                              style={{ fontSize: isCenter ? '15px' : '12px' }}
                            >
                              {game.title}
                            </p>
                            {isCenter && (
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                                  <span className="font-body text-white text-xs">{game.rating}</span>
                                </div>
                                <span className="font-heading font-bold text-[#06B6D4] text-sm">
                                  {(game.price / 1000).toFixed(0)}K сум
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}

                {/* Floating: Arcane Coins */}
                <motion.div
                  initial={{ opacity: 0, y: 14, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.95, duration: 0.55, ease }}
                  className="absolute -bottom-3 -left-3 z-20 flex items-center gap-3 rounded-xl px-3.5 py-2.5"
                  style={{
                    background: 'rgba(8,8,14,0.96)',
                    border: '1px solid rgba(245,158,11,0.22)',
                    boxShadow: '0 0 28px rgba(245,158,11,0.1), 0 8px 32px rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/coin_header.png"
                    alt=""
                    aria-hidden="true"
                    style={{
                      display: 'block',
                      width: '32px',
                      height: '32px',
                      objectFit: 'cover',
                      objectPosition: 'center top',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <p className="font-pixel text-[#F59E0B] leading-none mb-1" style={{ fontSize: '9px' }}>
                      ARCANE COINS
                    </p>
                    <p className="font-body text-gray-400 text-xs">+250 с каждой покупки</p>
                  </div>
                </motion.div>

                {/* Floating: Online */}
                <motion.div
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.05, duration: 0.5, ease }}
                  className="absolute -top-2 -right-2 z-20 flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{
                    background: 'rgba(8,8,14,0.96)',
                    border: '1px solid rgba(124,58,237,0.18)',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" />
                  <span className="font-pixel text-gray-400" style={{ fontSize: '8px' }}>ONLINE: 3,241</span>
                </motion.div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* === BOTTOM TRUST BAR === */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.85 }}
        className="relative border-t"
        style={{
          borderColor: 'rgba(30,30,46,0.6)',
          background: 'rgba(10,10,18,0.85)',
          backdropFilter: 'blur(24px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[
              { icon: '⚡', label: 'Мгновенная доставка', desc: 'Ключ сразу после оплаты' },
              { icon: '🛡️', label: 'Лицензионные ключи', desc: '100% подлинность' },
              { icon: '💬', label: 'Поддержка 24/7', desc: 'Telegram и Email' },
              { icon: '🪙', label: 'Arcane Coins', desc: 'Бонусы за каждую покупку' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="font-body font-medium text-white text-sm leading-tight">{item.label}</p>
                  <p className="font-body text-gray-500 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

    </section>
  );
}
