'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, Bell, User, Menu, X, LogOut, TrendingUp, TrendingDown, Heart } from 'lucide-react';
import SearchOverlay from '@/components/ui/SearchOverlay';
import NotificationDropdown from '@/components/user/NotificationDropdown';
import { useUser } from '@/lib/userContext';
import { useCoin, coinTimeAgo } from '@/lib/coinContext';

const TICKER_ITEMS = [
  'ARCANE.UZ',
  'INSERT COIN TO PLAY',
  'HIGH SCORE: 9 999 999',
  'PLAYER 1 — READY',
  'БЕСПЛАТНАЯ ДОСТАВКА ОТ 500 000 СУМ',
  'ЗАРАБАТЫВАЙ ARCANE COINS',
  'НОВИНКИ КАЖДУЮ НЕДЕЛЮ',
  '№1 ИГРОВОЙ МАГАЗИН В УЗБЕКИСТАНЕ',
  'МГНОВЕННАЯ ДОСТАВКА КЛЮЧЕЙ',
];

export default function Navbar() {
  const [isScrolled,   setIsScrolled]   = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen,  setIsNotifOpen]  = useState(false);
  const [isCoinOpen,   setIsCoinOpen]   = useState(false);
  const [cartCount] = useState(2);
  const coinRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router   = useRouter();
  const { user, isLoggedIn, unreadCount, logout } = useUser();
  const { balance, history } = useCoin();

  // Close coin dropdown on outside click
  useEffect(() => {
    if (!isCoinOpen) return;
    const handler = (e: MouseEvent) => {
      if (coinRef.current && !coinRef.current.contains(e.target as Node)) {
        setIsCoinOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isCoinOpen]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/',            label: 'Главная'   },
    { href: '/catalog',     label: 'Каталог'   },
    { href: '/deals',       label: 'Скидки'    },
    { href: '/new-releases', label: 'Новинки'  },
    ...(isLoggedIn ? [{ href: '/library', label: 'Библиотека' }] : []),
  ];

  // Cmd/Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    const base = href.split('?')[0];
    return pathname.startsWith(base) && base !== '/';
  };

  return (
    <>
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* ══════════════════════════════════════════════════════
          TIER 1 — PREMIUM ARCADE TICKER
      ══════════════════════════════════════════════════════ */}
      <div
        className="fixed top-0 left-0 right-0 z-50 overflow-hidden flex items-center select-none"
        style={{
          height: '32px',
          background: 'linear-gradient(90deg, #05020C 0%, #0C041A 30%, #07101C 65%, #05020C 100%)',
          borderBottom: '1px solid rgba(124,58,237,0.2)',
        }}
      >
        {/* Edge fade masks */}
        <div
          className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, #05020C 60%, transparent)' }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(270deg, #05020C 60%, transparent)' }}
        />

        {/* Left status dot */}
        <div className="absolute left-5 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]"
            style={{ boxShadow: '0 0 6px rgba(124,58,237,0.9), 0 0 14px rgba(124,58,237,0.4)' }}
          />
        </div>
        {/* Right status dot */}
        <div className="absolute right-5 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"
            style={{ boxShadow: '0 0 6px rgba(6,182,212,0.9), 0 0 14px rgba(6,182,212,0.4)' }}
          />
        </div>

        {/* Scrolling ticker */}
        <div
          className="flex items-center whitespace-nowrap"
          style={{ animation: 'marqueeScroll 50s linear infinite' }}
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center">
              <span
                className="font-pixel"
                style={{
                  fontSize: '8px',
                  color: i % 3 === 0 ? 'rgba(157,96,250,0.75)' : 'rgba(124,58,237,0.5)',
                  letterSpacing: '0.14em',
                }}
              >
                {item}
              </span>
              <span
                className="mx-6 font-pixel"
                style={{
                  fontSize: '7px',
                  color: i % 2 === 0 ? 'rgba(6,182,212,0.4)' : 'rgba(124,58,237,0.35)',
                }}
              >
                ◈
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TIER 2 — MAIN CINEMATIC HEADER
      ══════════════════════════════════════════════════════ */}
      <motion.header
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-8 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: isScrolled
            ? 'rgba(6,5,11,0.95)'
            : 'linear-gradient(180deg, rgba(9,7,16,0.97) 0%, rgba(9,8,14,0.88) 100%)',
          backdropFilter: 'blur(28px) saturate(170%)',
          WebkitBackdropFilter: 'blur(28px) saturate(170%)',
          borderBottom: `1px solid ${isScrolled ? 'rgba(124,58,237,0.28)' : 'rgba(124,58,237,0.13)'}`,
          boxShadow: isScrolled
            ? '0 8px 60px rgba(0,0,0,0.6), 0 0 1px rgba(124,58,237,0.25)'
            : 'none',
        }}
      >
        {/* ── Grid texture overlay ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
            opacity: 0.022,
          }}
        />

        {/* ── Top gradient glow line ── */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(124,58,237,0.4) 20%, rgba(124,58,237,0.85) 45%, rgba(6,182,212,0.7) 70%, rgba(6,182,212,0.3) 85%, transparent 100%)',
          }}
        />
        {/* ── Bottom subtle line ── */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 5%, rgba(124,58,237,0.2) 40%, rgba(124,58,237,0.12) 60%, transparent 95%)',
          }}
        />

        {/* ── Left ambient glow ── */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[500px] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at left center, rgba(124,58,237,0.1) 0%, transparent 75%)',
          }}
        />
        {/* ── Right ambient glow ── */}
        <div
          className="absolute right-0 top-0 bottom-0 w-80 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at right center, rgba(6,182,212,0.07) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex items-center justify-between gap-6" style={{ height: '88px' }}>

            {/* ════════════════════════════════
                LOGO — Futuristic Frame + Glow
            ════════════════════════════════ */}
            <Link href="/" className="group relative flex items-center shrink-0 px-2 py-1">
              {/* Corner bracket — top-left */}
              <span
                className="absolute top-0 left-0 w-3 h-3 opacity-50 group-hover:opacity-100 transition-all duration-400"
                style={{ borderTop: '1.5px solid #7C3AED', borderLeft: '1.5px solid #7C3AED' }}
              />
              {/* Corner bracket — top-right */}
              <span
                className="absolute top-0 right-0 w-3 h-3 opacity-50 group-hover:opacity-100 transition-all duration-400"
                style={{ borderTop: '1.5px solid #7C3AED', borderRight: '1.5px solid #7C3AED' }}
              />
              {/* Corner bracket — bottom-left */}
              <span
                className="absolute bottom-0 left-0 w-3 h-3 opacity-40 group-hover:opacity-90 transition-all duration-400"
                style={{ borderBottom: '1.5px solid #06B6D4', borderLeft: '1.5px solid #06B6D4' }}
              />
              {/* Corner bracket — bottom-right */}
              <span
                className="absolute bottom-0 right-0 w-3 h-3 opacity-40 group-hover:opacity-90 transition-all duration-400"
                style={{ borderBottom: '1.5px solid #06B6D4', borderRight: '1.5px solid #06B6D4' }}
              />

              {/* Ambient glow halo */}
              <motion.div
                animate={{ opacity: [0.25, 0.45, 0.25] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(124,58,237,0.22) 0%, transparent 70%)',
                  filter: 'blur(10px)',
                  transform: 'scale(1.25)',
                }}
              />

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo_header.png"
                alt="ARCANE.UZ"
                className="relative z-10 transition-all duration-500 group-hover:scale-[1.04]"
                style={{
                  width: '232px',
                  height: '72px',
                  objectFit: 'cover',
                  objectPosition: 'center 35%',
                  filter:
                    'drop-shadow(0 0 8px rgba(124,58,237,0.7)) drop-shadow(0 0 22px rgba(124,58,237,0.32))',
                  transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1), filter 0.4s ease',
                }}
              />
            </Link>

            {/* ════════════════════════════════
                NAV LINKS
            ════════════════════════════════ */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-5 py-3 rounded-xl overflow-hidden group"
                    style={{ color: active ? '#E2E8F0' : '#6B7280' }}
                  >
                    {/* Background layer */}
                    <span
                      className="absolute inset-0 rounded-xl transition-opacity duration-200"
                      style={{
                        background: 'rgba(124,58,237,0.07)',
                        opacity: active ? 1 : 0,
                      }}
                    />
                    <span
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{ background: 'rgba(124,58,237,0.055)' }}
                    />

                    {/* Active indicator dot */}
                    {active && (
                      <motion.span
                        layoutId="navActiveDot"
                        className="absolute top-2 right-2 w-1 h-1 rounded-full bg-[#9D60FA]"
                        style={{ boxShadow: '0 0 5px rgba(157,96,250,0.95), 0 0 10px rgba(157,96,250,0.4)' }}
                      />
                    )}

                    <span className="relative z-10 font-heading text-[13px] font-medium tracking-wide transition-colors duration-200 group-hover:text-[#E2E8F0]">
                      {link.label}
                    </span>

                    {/* Animated underline */}
                    {active ? (
                      <motion.span
                        layoutId="navActiveUnderline"
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 h-px"
                        style={{
                          width: '24px',
                          background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
                          borderRadius: '1px',
                          boxShadow: '0 0 8px rgba(124,58,237,0.7)',
                        }}
                      />
                    ) : (
                      <span
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 h-px w-0 group-hover:w-5 transition-all duration-300"
                        style={{
                          background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
                          borderRadius: '1px',
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* ════════════════════════════════
                RIGHT ZONE — COINS + ICONS
            ════════════════════════════════ */}
            <div className="flex items-center gap-1.5">

              {/* ── ARCANE COIN BLOCK ── */}
              <div ref={coinRef} className="hidden lg:block relative">
                <motion.button
                  onClick={() => setIsCoinOpen(v => !v)}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  aria-label="ARCANE COIN баланс"
                  className="flex items-center gap-0 relative cursor-pointer select-none"
                  style={{
                    borderRadius: '16px',
                    padding: '2px',
                    background: isCoinOpen
                      ? 'linear-gradient(135deg, rgba(245,158,11,0.75) 0%, rgba(180,100,0,0.5) 50%, rgba(245,158,11,0.65) 100%)'
                      : 'linear-gradient(135deg, rgba(245,158,11,0.55) 0%, rgba(180,100,0,0.3) 50%, rgba(245,158,11,0.45) 100%)',
                    boxShadow: isCoinOpen
                      ? '0 0 35px rgba(245,158,11,0.45), 0 4px 20px rgba(0,0,0,0.5)'
                      : '0 0 20px rgba(245,158,11,0.18), 0 4px 16px rgba(0,0,0,0.4)',
                  }}
                >
                  {/* Inner pill */}
                  <div
                    className="flex items-center gap-2.5 relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #0F0900 0%, #1A0E00 60%, #120A00 100%)',
                      borderRadius: '14px',
                      padding: '0 14px 0 4px',
                      height: '44px',
                    }}
                  >
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: 'radial-gradient(ellipse at 25% 50%, rgba(245,158,11,0.18) 0%, transparent 70%)' }} />
                    <div className="absolute top-0 left-4 right-4 h-px pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(252,211,77,0.5) 50%, transparent)' }} />
                    <motion.div
                      animate={{ x: ['-180%', '280%'] }}
                      transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(255,220,100,0.07) 50%, transparent)', width: '60%' }}
                    />

                    {/* Coin icon */}
                    <div className="relative z-10 flex items-center justify-center flex-shrink-0" style={{ width: '38px', height: '38px' }}>
                      <motion.div className="absolute inset-0 rounded-full pointer-events-none"
                        animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.85, 1.05, 0.85] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.35) 0%, transparent 70%)' }}
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/coin_header.png" alt="" aria-hidden="true"
                        style={{ width: '38px', height: '38px', objectFit: 'cover', objectPosition: 'center 15%',
                          filter: 'drop-shadow(0 0 6px rgba(245,158,11,1)) drop-shadow(0 0 14px rgba(245,158,11,0.6))',
                          position: 'relative', zIndex: 1 }}
                      />
                    </div>

                    {/* Balance */}
                    <div className="relative z-10 flex flex-col items-start" style={{ gap: '2px' }}>
                      <motion.span key={balance} className="font-heading font-bold block leading-none tabular-nums"
                        style={{ fontSize: '15px', color: '#FCD34D', letterSpacing: '-0.01em',
                          textShadow: '0 0 12px rgba(252,211,77,0.7), 0 0 28px rgba(245,158,11,0.4)' }}
                        initial={{ scale: 1.15, color: '#ffffff' }} animate={{ scale: 1, color: '#FCD34D' }}
                        transition={{ duration: 0.35 }}>
                        {balance.toLocaleString()}
                      </motion.span>
                      <span className="font-pixel block"
                        style={{ fontSize: '6.5px', color: 'rgba(245,158,11,0.5)', letterSpacing: '0.14em', lineHeight: 1 }}>
                        ARCANE COIN
                      </span>
                    </div>
                  </div>
                </motion.button>

                {/* ── COIN HISTORY DROPDOWN ── */}
                <AnimatePresence>
                  {isCoinOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-[calc(100%+10px)] z-50"
                      style={{ width: '320px' }}
                    >
                      {/* Outer glow */}
                      <div className="absolute -inset-2 rounded-3xl pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.2), transparent 70%)', filter: 'blur(12px)' }} />

                      <div className="relative rounded-2xl overflow-hidden"
                        style={{ background: 'linear-gradient(160deg, rgba(15,9,0,0.98), rgba(10,6,0,0.99))',
                          border: '1px solid rgba(245,158,11,0.28)',
                          boxShadow: '0 20px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(245,158,11,0.1)' }}>

                        {/* Top accent line */}
                        <div className="h-[2px]"
                          style={{ background: 'linear-gradient(90deg, transparent, #F59E0B, #FCD34D 50%, #F59E0B, transparent)' }} />

                        {/* Balance header */}
                        <div className="px-5 py-4 relative overflow-hidden"
                          style={{ borderBottom: '1px solid rgba(245,158,11,0.1)' }}>
                          <div className="absolute inset-0 pointer-events-none"
                            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.1), transparent 70%)' }} />
                          <p className="font-pixel mb-2 relative z-10"
                            style={{ fontSize: '7px', color: 'rgba(245,158,11,0.45)', letterSpacing: '0.18em' }}>
                            ◆ ARCANE COIN БАЛАНС
                          </p>
                          <div className="flex items-end gap-2 relative z-10">
                            <motion.span key={balance} className="font-heading font-black tabular-nums"
                              style={{ fontSize: '32px', lineHeight: 1, color: '#FCD34D',
                                textShadow: '0 0 20px rgba(252,211,77,0.7), 0 0 50px rgba(245,158,11,0.4)' }}
                              initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
                              {balance.toLocaleString()}
                            </motion.span>
                            <span className="font-pixel mb-1"
                              style={{ fontSize: '9px', color: 'rgba(245,158,11,0.45)', letterSpacing: '0.12em' }}>
                              ARCANE
                            </span>
                          </div>
                          {/* Mini bar */}
                          <div className="mt-2 h-1 rounded-full overflow-hidden relative z-10"
                            style={{ background: 'rgba(245,158,11,0.08)' }}>
                            <motion.div className="h-full rounded-full"
                              style={{ background: 'linear-gradient(90deg, #F59E0B, #FCD34D)', width: `${Math.min(100, (balance / 10000) * 100)}%` }}
                              initial={{ width: 0 }} animate={{ width: `${Math.min(100, (balance / 10000) * 100)}%` }}
                              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
                          </div>
                          <p className="font-pixel mt-1 relative z-10"
                            style={{ fontSize: '6.5px', color: 'rgba(245,158,11,0.28)', letterSpacing: '0.1em' }}>
                            {Math.min(100, Math.round((balance / 10000) * 100))}% ДО ЗОЛОТОГО РАНГА
                          </p>
                        </div>

                        {/* History list */}
                        <div className="px-3 py-2"
                          style={{ borderBottom: '1px solid rgba(245,158,11,0.08)' }}>
                          <p className="font-pixel px-2 py-1.5"
                            style={{ fontSize: '7px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.16em' }}>
                            ◆ ИСТОРИЯ ТРАНЗАКЦИЙ
                          </p>
                        </div>

                        <div className="overflow-y-auto" style={{ maxHeight: '260px' }}>
                          {history.length === 0 ? (
                            <div className="px-5 py-8 text-center">
                              <p className="font-pixel" style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em' }}>
                                НЕТ ТРАНЗАКЦИЙ
                              </p>
                            </div>
                          ) : history.map((tx, i) => (
                            <motion.div key={tx.id}
                              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              className="flex items-center gap-3 px-4 py-3 relative group"
                              style={{ borderBottom: '1px solid rgba(255,255,255,0.035)' }}>
                              {/* Hover bg */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                                style={{ background: 'rgba(245,158,11,0.04)' }} />

                              {/* Icon */}
                              <div className="relative z-10 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{
                                  background: tx.type === 'earn' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                  border: `1px solid ${tx.type === 'earn' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                                }}>
                                {tx.type === 'earn'
                                  ? <TrendingUp className="w-3.5 h-3.5" style={{ color: '#22C55E' }} />
                                  : <TrendingDown className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />}
                              </div>

                              {/* Label + time */}
                              <div className="relative z-10 flex-1 min-w-0">
                                <p className="font-body text-white/70 truncate" style={{ fontSize: '12px' }}>
                                  {tx.label}
                                </p>
                                <p className="font-pixel mt-0.5" style={{ fontSize: '7px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.08em' }}>
                                  {coinTimeAgo(tx.timestamp)}
                                </p>
                              </div>

                              {/* Amount */}
                              <div className="relative z-10 flex-shrink-0 text-right">
                                <span className="font-heading font-bold tabular-nums"
                                  style={{ fontSize: '13px', color: tx.type === 'earn' ? '#22C55E' : '#EF4444' }}>
                                  {tx.type === 'earn' ? '+' : '−'}{tx.amount.toLocaleString()}
                                </span>
                                <p className="font-pixel" style={{ fontSize: '6.5px', color: 'rgba(245,158,11,0.35)', letterSpacing: '0.08em' }}>
                                  ARC
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3"
                          style={{ borderTop: '1px solid rgba(245,158,11,0.08)',
                            background: 'linear-gradient(180deg, transparent, rgba(245,158,11,0.03))' }}>
                          <p className="font-pixel text-center"
                            style={{ fontSize: '7px', color: 'rgba(245,158,11,0.3)', letterSpacing: '0.14em' }}>
                            ЗАРАБАТЫВАЙ ПРОДАВАЯ ДРОПЫ В КЕЙСАХ
                          </p>
                        </div>

                        <div className="h-[1px]"
                          style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent)' }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider */}
              <div
                className="hidden lg:block h-9 w-px mx-0.5"
                style={{
                  background:
                    'linear-gradient(180deg, transparent, rgba(124,58,237,0.22) 30%, rgba(124,58,237,0.22) 70%, transparent)',
                }}
              />

              {/* ── SEARCH ── */}
              <button
                className="group relative p-2.5 rounded-xl transition-all duration-200"
                aria-label="Поиск"
                onClick={() => setIsSearchOpen(true)}
              >
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(6,182,212,0.08)' }}
                />
                <Search
                  className="relative z-10 w-[18px] h-[18px] transition-colors duration-200 text-[#6B7280] group-hover:text-[#22D3EE]"
                />
              </button>

              {/* ── NOTIFICATIONS ── */}
              <div className="hidden sm:block relative">
                <button
                  className="group relative p-2.5 rounded-xl transition-all duration-200"
                  aria-label="Уведомления"
                  onClick={() => setIsNotifOpen((v) => !v)}
                >
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: 'rgba(124,58,237,0.08)' }}
                  />
                  <Bell
                    className="relative z-10 w-[18px] h-[18px] transition-colors duration-200 text-[#6B7280] group-hover:text-[#9D60FA]"
                  />
                  {unreadCount > 0 && (
                    <motion.span
                      animate={{ scale: [1, 1.35, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 2.5 }}
                      className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#7C3AED]"
                      style={{ boxShadow: '0 0 5px rgba(124,58,237,0.9)' }}
                    />
                  )}
                </button>
                <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
              </div>

              {/* ── CART ── */}
              <Link
                href="/checkout"
                className="group relative p-2.5 rounded-xl transition-all duration-200 block"
                aria-label="Корзина"
              >
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(124,58,237,0.08)' }}
                />
                <ShoppingCart
                  className="relative z-10 w-[18px] h-[18px] transition-colors duration-200 text-[#6B7280] group-hover:text-white"
                />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#7C3AED] rounded-[5px] flex items-center justify-center text-white font-pixel animate-pixel-pulse z-20"
                    style={{
                      fontSize: '8px',
                      paddingInline: '3px',
                      boxShadow: '0 0 10px rgba(124,58,237,0.8), 0 0 20px rgba(124,58,237,0.3)',
                    }}
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Link>

              {/* ── LOGIN / USER BUTTON ── */}
              {isLoggedIn && user ? (
                <div className="hidden sm:flex items-center gap-1.5">
                  {/* Wishlist link */}
                  <Link
                    href="/wishlist"
                    className="group relative flex items-center gap-2 rounded-xl transition-all duration-200 p-2.5"
                    title="Вишлист"
                    style={{ color: pathname.startsWith('/wishlist') ? '#EF4444' : '#6B7280' }}
                  >
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                         style={{ background: 'rgba(239,68,68,0.08)' }} />
                    <Heart className="relative z-10 w-[18px] h-[18px] transition-colors duration-200 group-hover:text-[#F87171]" />
                  </Link>
                  {/* Avatar + name */}
                  <Link
                    href="/profile"
                    className="group flex items-center gap-2.5 rounded-xl transition-all duration-200 relative"
                    style={{
                      background: 'rgba(124,58,237,0.08)',
                      border: '1px solid rgba(124,58,237,0.3)',
                      padding: '6px 14px 6px 8px',
                      height: '46px',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-lg object-cover" />
                    <span className="font-heading font-semibold text-[#C4B5FD]"
                          style={{ fontSize: '13px' }}>
                      {user.name.split(' ')[0]}
                    </span>
                  </Link>
                  <button
                    onClick={() => { logout(); router.push('/'); }}
                    className="p-2.5 rounded-xl text-[#4B5563] hover:text-[#F87171] hover:bg-red-400/10 transition-all duration-200"
                    aria-label="Выйти"
                  >
                    <LogOut className="w-[16px] h-[16px]" />
                  </button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.025 }}
                  whileTap={{ scale: 0.975 }}
                  onClick={() => router.push('/login')}
                  className="hidden sm:flex items-center gap-2.5 relative overflow-hidden font-heading text-[13px] font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.14) 0%, rgba(76,29,149,0.09) 100%)',
                    border: '1px solid rgba(124,58,237,0.42)',
                    borderRadius: '12px',
                    padding: '0 20px',
                    height: '46px',
                    color: '#C4B5FD',
                    letterSpacing: '0.045em',
                    boxShadow: '0 0 24px rgba(124,58,237,0.1), inset 0 1px 0 rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                       style={{ background: 'linear-gradient(90deg, transparent, rgba(157,96,250,0.55) 40%, rgba(157,96,250,0.55) 60%, transparent)' }} />
                  <User className="w-[14px] h-[14px] relative z-10" />
                  <span className="relative z-10">Войти</span>
                </motion.button>
              )}

              {/* ── MOBILE TOGGLE ── */}
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="md:hidden p-2.5 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/5"
                aria-label="Меню"
              >
                <AnimatePresence mode="wait">
                  {isMobileOpen ? (
                    <motion.span
                      key="x"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ══════════════════════════════════════════════════════
          MOBILE MENU
      ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 right-0 z-40 md:hidden"
            style={{
              top: 'calc(32px + 88px)',
              background: 'rgba(6,5,11,0.98)',
              backdropFilter: 'blur(28px)',
              borderBottom: '1px solid rgba(124,58,237,0.18)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            }}
          >
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, ease: 'easeOut' }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileOpen(false)}
                    className="block px-4 py-3 rounded-xl transition-all duration-200 font-heading text-sm font-medium hover:bg-[#7C3AED]/8 hover:text-white"
                    style={{ color: isActive(link.href) ? '#E2E8F0' : '#6B7280' }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <div
                className="mt-3 pt-3 flex items-center gap-3 px-2"
                style={{ borderTop: '1px solid rgba(124,58,237,0.12)' }}
              >
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    background: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.22)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/coin_header.png"
                    alt="монеты"
                    style={{ width: '30px', height: '30px', objectFit: 'cover', objectPosition: 'center top' }}
                  />
                  <span className="font-pixel text-[#FCD34D]" style={{ fontSize: '10px' }}>
                    {balance.toLocaleString()}
                  </span>
                </div>
                <button
                  className="flex-1 font-heading text-white rounded-xl py-2.5 px-4 font-semibold"
                  style={{
                    fontSize: '12px',
                    letterSpacing: '0.08em',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(76,29,149,0.95))',
                    border: '1px solid rgba(124,58,237,0.5)',
                    boxShadow: '0 0 20px rgba(124,58,237,0.25)',
                  }}
                >
                  ВОЙТИ
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
