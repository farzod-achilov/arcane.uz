'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Zap, Heart, ShoppingBag, Award, Package, LogOut, Settings,
  Check, X, ChevronRight, Crown, Send, Gamepad2, Clock,
  TrendingUp, Bell, Star, Activity, Coins,
} from 'lucide-react';
import { useUser } from '@/lib/userContext';
import {
  getLevelFromXp, getXpProgress, LEVELS, ACHIEVEMENTS,
  COINS_HISTORY, ORDER_HISTORY, ACTIVITY_FEED, STATUS_CONFIG,
  type LevelName,
} from '@/lib/mockUserData';
import { products } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';

const TABS = ['Обзор', 'Заказы', 'Монеты', 'Достижения', 'Активность'] as const;
type Tab = typeof TABS[number];

const LEVEL_ORDER: LevelName[] = ['Rookie', 'Player', 'Elite', 'Phantom', 'Arcane'];

/* ── Level Badge ──────────────────────────────────────── */
function LevelBadge({ xp }: { xp: number }) {
  const { level, levelCfg } = getXpProgress(xp);
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-pixel"
         style={{
           background: levelCfg.bg, border: `1px solid ${levelCfg.border}`,
           color: levelCfg.color, fontSize: '8px', letterSpacing: '0.08em',
           boxShadow: `0 0 10px ${levelCfg.glow}`,
         }}>
      {level.toUpperCase()}
    </div>
  );
}

/* ── XP Bar ───────────────────────────────────────────── */
function XpBar({ xp, compact = false }: { xp: number; compact?: boolean }) {
  const { level, progress, xpToNext, levelCfg } = getXpProgress(xp);
  return (
    <div className="w-full">
      {!compact && (
        <div className="flex justify-between mb-1.5">
          <span className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
            {xp.toLocaleString('ru')} XP
          </span>
          <span className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
            {level !== 'Arcane' ? `+${xpToNext.toLocaleString('ru')} до след.` : 'MAX LEVEL'}
          </span>
        </div>
      )}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${levelCfg.color}, ${levelCfg.color}bb)`,
                   boxShadow: `0 0 8px ${levelCfg.glow}` }}
        />
      </div>
      {compact && (
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: '9px', color: '#374151', fontFamily: 'var(--font-pixel)' }}>{xp.toLocaleString()} XP</span>
          <span style={{ fontSize: '9px', color: '#374151', fontFamily: 'var(--font-pixel)' }}>{progress}%</span>
        </div>
      )}
    </div>
  );
}

/* ── Time ago ─────────────────────────────────────────── */
function timeAgo(ts: number): string {
  const d = (Date.now() - ts) / 1000;
  if (d < 60)   return 'только что';
  if (d < 3600) return `${Math.floor(d / 60)} мин назад`;
  if (d < 86400)return `${Math.floor(d / 3600)} ч назад`;
  return `${Math.floor(d / 86400)} дн назад`;
}

export default function DashboardPage() {
  const { user, isLoggedIn, wishlist, logout, connectTelegram, connectSteam } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab]   = useState<Tab>('Обзор');
  const [connectingTg, setConnTg]   = useState(false);
  const [connectingSteam, setConnSteam] = useState(false);
  const [tgInput, setTgInput]       = useState('');

  useEffect(() => {
    if (!isLoggedIn) router.replace('/login');
  }, [isLoggedIn, router]);

  if (!user) return null;

  const { level, levelCfg } = getXpProgress(user.xp);
  const currentLevelIdx = LEVEL_ORDER.indexOf(level as LevelName);

  const ordersData = ORDER_HISTORY.map((o) => ({
    ...o, product: products.find((p) => p.id === o.productId),
  }));
  const wishlistProducts = products.filter((p) => wishlist.includes(p.id)).slice(0, 4);

  const handleConnectSteam = async () => {
    setConnSteam(true);
    await new Promise((r) => setTimeout(r, 1500));
    connectSteam();
    setConnSteam(false);
  };

  const handleConnectTg = () => {
    if (!tgInput.trim()) return;
    connectTelegram(tgInput);
    setConnTg(false);
    setTgInput('');
  };

  /* Cashback rate based on level */
  const cashbackRate = { Rookie: 1, Player: 1.5, Elite: 2, Phantom: 2.5, Arcane: 3 }[level] ?? 1;

  return (
    <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
             backgroundSize: '52px 52px', opacity: 0.018,
           }} />
      <div className="fixed top-0 left-0 right-0 h-px pointer-events-none"
           style={{ background: `linear-gradient(90deg, transparent, ${levelCfg.color}50, rgba(6,182,212,0.3), transparent)` }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* ── PROFILE HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl overflow-hidden mb-6"
          style={{ background: '#0D0D16', border: `1px solid ${levelCfg.border}` }}
        >
          {/* BG glow */}
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: `radial-gradient(ellipse 55% 120% at 15% 50%, ${levelCfg.glow} 0%, transparent 65%)`, opacity: 0.6 }} />
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: 'radial-gradient(ellipse 40% 80% at 85% 50%, rgba(6,182,212,0.04) 0%, transparent 60%)' }} />
          <div className="absolute top-0 left-0 right-0 h-px"
               style={{ background: `linear-gradient(90deg, transparent, ${levelCfg.color}60, rgba(6,182,212,0.3), transparent)` }} />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden"
                   style={{ border: `2px solid ${levelCfg.color}60`, boxShadow: `0 0 20px ${levelCfg.glow}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                   style={{ background: levelCfg.color, border: '2px solid #05040B', boxShadow: `0 0 8px ${levelCfg.glow}` }}>
                <Crown style={{ width: '9px', height: '9px', color: '#fff' }} />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="font-heading font-bold text-white" style={{ fontSize: '20px' }}>{user.name}</h1>
                <LevelBadge xp={user.xp} />
              </div>
              <p className="font-body text-[#4B5563] mb-3" style={{ fontSize: '12px' }}>
                {user.email} · С нами с {new Date(user.joinDate).toLocaleDateString('ru', { year: 'numeric', month: 'long' })}
              </p>
              <XpBar xp={user.xp} />
            </div>

            {/* Coins + actions */}
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <div className="flex items-center gap-2 rounded-xl px-4 py-2.5"
                   style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)' }}>
                <Zap style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
                <span className="font-pixel text-[#FCD34D]" style={{ fontSize: '11px', letterSpacing: '0.06em', textShadow: '0 0 10px rgba(252,211,77,0.5)' }}>
                  {user.coins.toLocaleString('ru')}
                </span>
              </div>
              <Link href="/settings"
                    className="p-2.5 rounded-xl text-[#4B5563] hover:text-[#9CA3AF] transition-colors"
                    style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Settings style={{ width: '16px', height: '16px' }} />
              </Link>
              <button onClick={() => { logout(); router.push('/'); }}
                      className="p-2.5 rounded-xl text-[#4B5563] hover:text-[#F87171] transition-colors"
                      style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.07)' }}>
                <LogOut style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>

          {/* Connected accounts */}
          <div className="flex flex-wrap gap-2 px-6 pb-5">
            {user.telegram ? (
              <div className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5"
                   style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
                <Send style={{ width: '12px', height: '12px', color: '#06B6D4' }} />
                <span className="font-body text-[#06B6D4]" style={{ fontSize: '12px' }}>{user.telegram}</span>
                <Check style={{ width: '11px', height: '11px', color: '#22C55E' }} />
              </div>
            ) : (
              <button
                onClick={() => setConnTg(true)}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all duration-200 font-body"
                style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.08)', color: '#4B5563', fontSize: '12px' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.3)'; (e.currentTarget as HTMLElement).style.color = '#06B6D4'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#4B5563'; }}
              >
                <Send style={{ width: '12px', height: '12px' }} />
                Привязать Telegram
              </button>
            )}

            {user.steamUsername ? (
              <div className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5"
                   style={{ background: 'rgba(102,192,244,0.08)', border: '1px solid rgba(102,192,244,0.2)' }}>
                <Gamepad2 style={{ width: '12px', height: '12px', color: '#66C0F4' }} />
                <span className="font-body text-[#66C0F4]" style={{ fontSize: '12px' }}>{user.steamUsername}</span>
                <Check style={{ width: '11px', height: '11px', color: '#22C55E' }} />
              </div>
            ) : (
              <button
                onClick={handleConnectSteam}
                disabled={connectingSteam}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all duration-200 font-body"
                style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.08)', color: '#4B5563', fontSize: '12px' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(102,192,244,0.3)'; (e.currentTarget as HTMLElement).style.color = '#66C0F4'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#4B5563'; }}
              >
                <Gamepad2 style={{ width: '12px', height: '12px' }} />
                {connectingSteam ? 'Подключение...' : 'Привязать Steam'}
              </button>
            )}
          </div>
        </motion.div>

        {/* ── TABS ── */}
        <div className="flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto"
             style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content', maxWidth: '100%' }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative rounded-lg px-4 py-2 font-heading font-medium transition-all duration-200 whitespace-nowrap"
              style={{
                fontSize: '13px',
                color: activeTab === tab ? '#E2E8F0' : '#4B5563',
                background: activeTab === tab ? 'rgba(124,58,237,0.15)' : 'transparent',
                border: activeTab === tab ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                boxShadow: activeTab === tab ? '0 0 12px rgba(124,58,237,0.1)' : 'none',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'Обзор' && (
            <motion.div key="overview"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
              className="grid lg:grid-cols-3 gap-5"
            >
              {/* Stats */}
              <div className="lg:col-span-2 grid grid-cols-3 gap-3">
                {[
                  { label: 'Заказов',  value: ORDER_HISTORY.length, icon: ShoppingBag, color: '#7C3AED' },
                  { label: 'Вишлист',  value: wishlist.length,       icon: Heart,       color: '#EF4444' },
                  { label: 'Монеты',   value: user.coins,             icon: Zap,         color: '#F59E0B' },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl p-4"
                       style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                         style={{ background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
                      <s.icon style={{ width: '15px', height: '15px', color: s.color }} />
                    </div>
                    <p className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>{s.value.toLocaleString('ru')}</p>
                    <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Level card */}
              <div className="rounded-2xl p-5"
                   style={{ background: '#0D0D16', border: `1px solid ${levelCfg.border}` }}>
                <p className="font-heading font-semibold text-[#9CA3AF] mb-4"
                   style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Уровень аккаунта
                </p>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                       style={{ background: levelCfg.bg, border: `1px solid ${levelCfg.border}`,
                                boxShadow: `0 0 20px ${levelCfg.glow}` }}>
                    <Award style={{ width: '26px', height: '26px', color: levelCfg.color }} />
                  </div>
                  <p className="font-pixel text-white mb-0.5"
                     style={{ fontSize: '14px', textShadow: `0 0 12px ${levelCfg.glow}`, letterSpacing: '0.06em' }}>
                    {level}
                  </p>
                  <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{user.xp.toLocaleString('ru')} XP</p>
                </div>
                <XpBar xp={user.xp} />
                <p className="font-body text-[#374151] text-center mt-2" style={{ fontSize: '10.5px' }}>
                  Кэшбэк: <span style={{ color: levelCfg.color }}>{cashbackRate}%</span>
                  {' '}· Множитель: <span style={{ color: levelCfg.color }}>{LEVELS[level as LevelName].multiplier}</span>
                </p>
              </div>

              {/* Recent orders */}
              <div className="lg:col-span-2 rounded-2xl overflow-hidden"
                   style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between px-5 py-4"
                     style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2">
                    <ShoppingBag style={{ width: '14px', height: '14px', color: '#7C3AED' }} />
                    <span className="font-heading font-semibold text-[#9CA3AF]"
                          style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Последние заказы
                    </span>
                  </div>
                  <button onClick={() => setActiveTab('Заказы')}
                          className="font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors flex items-center gap-1"
                          style={{ fontSize: '12px' }}>
                    Все <ChevronRight style={{ width: '12px', height: '12px' }} />
                  </button>
                </div>
                {ordersData.slice(0, 3).map((o) => o.product && (
                  <div key={o.id} className="flex items-center gap-4 px-5 py-3.5"
                       style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="relative w-10 h-12 rounded-xl overflow-hidden flex-shrink-0">
                      <Image src={o.product.image} alt={o.product.title} fill unoptimized className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-white line-clamp-1" style={{ fontSize: '13px' }}>{o.product.title}</p>
                      <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{o.platform} · {o.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-heading font-bold text-white" style={{ fontSize: '13px' }}>{formatPrice(o.price)}</p>
                      <span className="font-body" style={{
                        fontSize: '10.5px',
                        color: STATUS_CONFIG[o.status].color
                      }}>{STATUS_CONFIG[o.status].label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Wishlist preview */}
              <div className="rounded-2xl overflow-hidden"
                   style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between px-5 py-4"
                     style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2">
                    <Heart style={{ width: '14px', height: '14px', color: '#EF4444' }} />
                    <span className="font-heading font-semibold text-[#9CA3AF]"
                          style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Вишлист
                    </span>
                  </div>
                  <Link href="/wishlist"
                        className="font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors flex items-center gap-1"
                        style={{ fontSize: '12px' }}>
                    Все <ChevronRight style={{ width: '12px', height: '12px' }} />
                  </Link>
                </div>
                {wishlistProducts.length === 0 ? (
                  <div className="py-8 text-center">
                    <Heart className="mx-auto mb-2 text-[#1F2937]" style={{ width: '24px', height: '24px' }} />
                    <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Вишлист пуст</p>
                    <Link href="/catalog"
                          className="font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors mt-1 block"
                          style={{ fontSize: '12px' }}>
                      Перейти в каталог →
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 grid grid-cols-2 gap-2">
                    {wishlistProducts.map((p) => (
                      <Link key={p.id} href={`/product/${p.id}`}
                            className="relative aspect-[2/3] rounded-xl overflow-hidden group">
                        <Image src={p.image} alt={p.title} fill unoptimized
                               className="object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0"
                             style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(13,13,22,0.9) 100%)' }} />
                        <p className="absolute bottom-2 left-2 right-2 font-heading font-semibold text-white line-clamp-1"
                           style={{ fontSize: '10.5px' }}>{p.title}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── ORDERS TAB ── */}
          {activeTab === 'Заказы' && (
            <motion.div key="orders"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {ordersData.map((o, i) => {
                if (!o.product) return null;
                const sc = STATUS_CONFIG[o.status];
                return (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-4 rounded-2xl px-5 py-4"
                    style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.25)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
                  >
                    <div className="relative w-12 h-14 rounded-xl overflow-hidden flex-shrink-0">
                      <Image src={o.product.image} alt={o.product.title} fill unoptimized className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[#374151] mb-0.5" style={{ fontSize: '11px' }}>#{o.id}</p>
                      <p className="font-heading font-semibold text-white line-clamp-1" style={{ fontSize: '14px' }}>{o.product.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-pixel rounded" style={{
                          fontSize: '7px', color: '#9D60FA', background: 'rgba(124,58,237,0.1)',
                          border: '1px solid rgba(124,58,237,0.2)', padding: '2px 6px',
                        }}>{o.platform}</span>
                        <span className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{o.date}</span>
                        <div className="flex items-center gap-0.5">
                          <Zap style={{ width: '9px', height: '9px', color: '#F59E0B' }} />
                          <span className="font-body text-[#F59E0B]" style={{ fontSize: '10px' }}>+{o.coinsEarned} монет</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-heading font-bold text-white mb-1.5" style={{ fontSize: '15px' }}>{formatPrice(o.price)}</p>
                      <div className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                           style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
                        <span className="font-body" style={{ fontSize: '11px', color: sc.color }}>{sc.label}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ── COINS TAB ── */}
          {activeTab === 'Монеты' && (
            <motion.div key="coins"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Balance hero */}
              <div className="rounded-2xl p-6 text-center relative overflow-hidden"
                   style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="absolute inset-0 pointer-events-none"
                     style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 100%, rgba(245,158,11,0.08), transparent)' }} />
                <Zap className="mx-auto mb-3 relative z-10" style={{ width: '32px', height: '32px', color: '#F59E0B' }} />
                <motion.p
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="font-pixel text-[#FCD34D] mb-1 relative z-10"
                  style={{ fontSize: '28px', textShadow: '0 0 20px rgba(252,211,77,0.5)', letterSpacing: '0.04em' }}
                >
                  {user.coins.toLocaleString('ru')}
                </motion.p>
                <p className="font-body text-[#6B7280] mb-4 relative z-10" style={{ fontSize: '13px' }}>Arcane Coins</p>
                <div className="flex justify-center gap-4 flex-wrap">
                  {[
                    { label: 'Кэшбэк', value: `${cashbackRate}%`, color: '#F59E0B' },
                    { label: 'Множитель', value: `${LEVELS[level as LevelName].multiplier}`, color: levelCfg.color },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="font-pixel" style={{ fontSize: '13px', color: s.color }}>{s.value}</p>
                      <p className="font-body text-[#4B5563]" style={{ fontSize: '10px' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seasonal bonus banner */}
              <div className="rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden"
                   style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)' }}>
                <div className="absolute inset-0 pointer-events-none"
                     style={{ background: 'radial-gradient(ellipse at left, rgba(6,182,212,0.06), transparent 60%)' }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10"
                     style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)' }}>
                  <Star style={{ width: '16px', height: '16px', color: '#06B6D4' }} />
                </div>
                <div className="relative z-10">
                  <p className="font-heading font-semibold text-[#22D3EE]" style={{ fontSize: '13px' }}>
                    🎉 Майский бонус активен
                  </p>
                  <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
                    Все покупки в мае дают 2× Arcane Coins
                  </p>
                </div>
                <div className="ml-auto flex-shrink-0 relative z-10">
                  <span className="font-pixel text-[#22D3EE]" style={{ fontSize: '14px', textShadow: '0 0 8px rgba(34,211,238,0.6)' }}>
                    2×
                  </span>
                </div>
              </div>

              {/* History */}
              <div className="rounded-2xl overflow-hidden"
                   style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="font-heading font-semibold text-[#9CA3AF]"
                        style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    История транзакций
                  </span>
                </div>
                {COINS_HISTORY.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between px-5 py-3.5"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                           style={{
                             background: t.type === 'spent' ? 'rgba(239,68,68,0.1)' : t.type === 'bonus' ? 'rgba(6,182,212,0.1)' : 'rgba(245,158,11,0.1)',
                             border: `1px solid ${t.type === 'spent' ? 'rgba(239,68,68,0.2)' : t.type === 'bonus' ? 'rgba(6,182,212,0.2)' : 'rgba(245,158,11,0.2)'}`,
                           }}>
                        <Zap style={{ width: '13px', height: '13px', color: t.type === 'spent' ? '#EF4444' : t.type === 'bonus' ? '#06B6D4' : '#F59E0B' }} />
                      </div>
                      <div>
                        <p className="font-body text-[#9CA3AF]" style={{ fontSize: '13px' }}>{t.desc}</p>
                        <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>{t.date}</p>
                      </div>
                    </div>
                    <span className="font-heading font-bold" style={{
                      fontSize: '14px',
                      color: t.type === 'spent' ? '#F87171' : t.type === 'bonus' ? '#22D3EE' : '#FCD34D',
                    }}>
                      {t.amount > 0 ? '+' : ''}{t.amount}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── ACHIEVEMENTS TAB ── */}
          {activeTab === 'Достижения' && (
            <motion.div key="achievements"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
            >
              {/* Stats row */}
              <div className="flex gap-4 mb-5 flex-wrap">
                {[
                  { label: 'Получено',    value: ACHIEVEMENTS.filter(a => a.earned).length, color: '#22C55E' },
                  { label: 'В процессе',  value: ACHIEVEMENTS.filter(a => !a.earned).length, color: '#F59E0B' },
                  { label: 'Легендарных', value: ACHIEVEMENTS.filter(a => a.earned && a.rarity === 'legendary').length, color: '#F59E0B' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl px-4 py-2.5"
                       style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="font-heading font-bold text-white" style={{ fontSize: '18px', color: s.color }}>{s.value}</p>
                    <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {ACHIEVEMENTS.map((a, i) => {
                  const rc: Record<string, { border: string; bg: string; color: string }> = {
                    common:    { border: 'rgba(156,163,175,0.2)',  bg: 'rgba(156,163,175,0.05)', color: '#9CA3AF' },
                    rare:      { border: 'rgba(59,130,246,0.25)', bg: 'rgba(59,130,246,0.07)',  color: '#3B82F6' },
                    epic:      { border: 'rgba(124,58,237,0.3)',  bg: 'rgba(124,58,237,0.08)', color: '#7C3AED' },
                    legendary: { border: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.08)', color: '#F59E0B' },
                  };
                  const c = rc[a.rarity];
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, scale: 0.93 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="rounded-2xl p-4 flex flex-col"
                      style={{
                        background: a.earned ? c.bg : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${a.earned ? c.border : 'rgba(255,255,255,0.05)'}`,
                        opacity: a.earned ? 1 : 0.6,
                      }}
                    >
                      <div className="text-3xl mb-2.5">{a.icon}</div>
                      <p className="font-heading font-semibold text-white mb-1" style={{ fontSize: '12.5px' }}>{a.title}</p>
                      <p className="font-body text-[#4B5563] mb-2.5 flex-1" style={{ fontSize: '10.5px', lineHeight: '1.4' }}>{a.desc}</p>

                      {/* Progress bar for unearned */}
                      {!a.earned && a.progress !== undefined && a.progressMax !== undefined && (
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-body text-[#374151]" style={{ fontSize: '9px' }}>
                              {a.progress.toLocaleString('ru')} / {a.progressMax.toLocaleString('ru')}
                            </span>
                            <span className="font-body" style={{ fontSize: '9px', color: c.color }}>
                              {Math.round((a.progress / a.progressMax) * 100)}%
                            </span>
                          </div>
                          <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.round((a.progress / a.progressMax) * 100)}%`,
                                background: c.color, opacity: 0.7,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {a.earned && a.earnedDate && (
                        <p className="font-body text-[#374151] mt-auto" style={{ fontSize: '10px' }}>
                          ✓ {a.earnedDate}
                        </p>
                      )}
                      {!a.earned && (
                        <div className="mt-2 rounded-lg px-2 py-0.5 text-center"
                             style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <span className="font-pixel" style={{ fontSize: '7px', color: '#374151', letterSpacing: '0.06em' }}>
                            {a.rarity.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── ACTIVITY TAB ── */}
          {activeTab === 'Активность' && (
            <motion.div key="activity"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {/* Level progression visual */}
              <div className="rounded-2xl p-5 mb-2"
                   style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="font-heading font-semibold text-[#9CA3AF] mb-4"
                   style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Путь прокачки
                </p>
                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
                  {LEVEL_ORDER.map((lvl, idx) => {
                    const cfg = LEVELS[lvl];
                    const isCurrent = lvl === level;
                    const isPast    = idx < currentLevelIdx;
                    return (
                      <div key={lvl} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <div
                          className="flex flex-col items-center gap-1"
                          style={{ opacity: isPast ? 0.6 : 1 }}
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                            style={{
                              background: isCurrent ? cfg.bg : isPast ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${isCurrent ? cfg.border : isPast ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
                              boxShadow: isCurrent ? `0 0 14px ${cfg.glow}` : 'none',
                            }}
                          >
                            {isPast && <Check style={{ width: '14px', height: '14px', color: cfg.color }} />}
                            {isCurrent && <Crown style={{ width: '14px', height: '14px', color: cfg.color }} />}
                            {!isPast && !isCurrent && <Award style={{ width: '14px', height: '14px', color: '#1F2937' }} />}
                          </div>
                          <span className="font-pixel whitespace-nowrap"
                                style={{ fontSize: '7px', color: isCurrent ? cfg.color : isPast ? '#374151' : '#1F2937',
                                         letterSpacing: '0.04em' }}>
                            {lvl.toUpperCase()}
                          </span>
                        </div>
                        {idx < LEVEL_ORDER.length - 1 && (
                          <div className="w-6 sm:w-10 h-px flex-shrink-0"
                               style={{ background: idx < currentLevelIdx ? levelCfg.color : 'rgba(255,255,255,0.06)' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Activity feed */}
              <div className="rounded-2xl overflow-hidden"
                   style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="font-heading font-semibold text-[#9CA3AF]"
                        style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Последняя активность
                  </span>
                </div>
                {ACTIVITY_FEED.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 px-5 py-3.5"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                         style={{ background: `${item.color}12`, border: `1px solid ${item.color}25` }}>
                      {item.icon}
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[#9CA3AF] line-clamp-1" style={{ fontSize: '13px' }}>{item.title}</p>
                      <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>{item.desc}</p>
                    </div>
                    {/* Time */}
                    <span className="font-body text-[#2D2D44] flex-shrink-0" style={{ fontSize: '11px' }}>
                      {timeAgo(item.time)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Telegram connect modal ── */}
      <AnimatePresence>
        {connectingTg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center px-4"
            style={{ background: 'rgba(4,3,10,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={() => setConnTg(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className="rounded-2xl p-6 w-full max-w-sm relative overflow-hidden"
              style={{ background: '#0D0D16', border: '1px solid rgba(6,182,212,0.3)',
                       boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(6,182,212,0.08)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-px"
                   style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.6), transparent)' }} />
              <button onClick={() => { setConnTg(false); setTgInput(''); }}
                      className="absolute top-4 right-4 text-[#4B5563] hover:text-[#9CA3AF] transition-colors">
                <X style={{ width: '16px', height: '16px' }} />
              </button>

              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                     style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)',
                              boxShadow: '0 0 20px rgba(6,182,212,0.12)' }}>
                  <Send style={{ width: '22px', height: '22px', color: '#06B6D4' }} />
                </div>
                <h3 className="font-heading font-bold text-white mb-1" style={{ fontSize: '18px' }}>
                  Привязать Telegram
                </h3>
                <p className="font-body text-[#6B7280]" style={{ fontSize: '13px' }}>
                  Введите ваш username в Telegram
                </p>
              </div>

              {/* Bonus hint */}
              <div className="flex items-center gap-2.5 rounded-xl p-3 mb-4"
                   style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
                <Zap style={{ width: '13px', height: '13px', color: '#F59E0B', flexShrink: 0 }} />
                <p className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>
                  Получите <span style={{ color: '#FCD34D' }}>+200 Arcane Coins</span> за привязку
                </p>
              </div>

              <input
                type="text"
                placeholder="@username"
                value={tgInput}
                onChange={(e) => setTgInput(e.target.value)}
                className="w-full font-body text-white outline-none rounded-xl px-4 py-3 mb-4 placeholder:text-[#2D2D44]"
                style={{ background: '#07070D', border: '1px solid rgba(6,182,212,0.25)', fontSize: '14px' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConnectTg(); }}
                autoFocus
              />

              <button
                onClick={handleConnectTg}
                disabled={!tgInput.trim()}
                className="w-full rounded-xl font-heading font-semibold text-white py-3 transition-all duration-200"
                style={{
                  background: tgInput.trim()
                    ? 'linear-gradient(135deg, #06B6D4, #7C3AED)'
                    : 'rgba(255,255,255,0.05)',
                  fontSize: '14px',
                  cursor: tgInput.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: tgInput.trim() ? '0 0 20px rgba(6,182,212,0.3)' : 'none',
                }}
              >
                Привязать аккаунт
              </button>

              <p className="font-body text-[#374151] text-center mt-3" style={{ fontSize: '11.5px' }}>
                Вы будете получать уведомления о заказах и скидках
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
