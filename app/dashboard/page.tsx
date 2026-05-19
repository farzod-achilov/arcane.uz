'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Zap, Heart, ShoppingBag, Star, Send, Gamepad2,
  TrendingUp, Crown, Award, Package, LogOut, Settings,
  Check, X, ChevronRight,
} from 'lucide-react';
import { useUser } from '@/lib/userContext';
import {
  getLevelFromXp, getXpProgress, LEVELS, ACHIEVEMENTS,
  COINS_HISTORY, ORDER_HISTORY,
} from '@/lib/mockUserData';
import { products } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';

const TABS = ['Обзор', 'Заказы', 'Монеты', 'Достижения'] as const;
type Tab = typeof TABS[number];

/* ── Level Badge ──────────────────────────────────────── */
function LevelBadge({ xp }: { xp: number }) {
  const { level, levelCfg } = getXpProgress(xp);
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-pixel"
         style={{
           background: levelCfg.bg,
           border: `1px solid ${levelCfg.border}`,
           color: levelCfg.color,
           fontSize: '8px',
           letterSpacing: '0.08em',
           boxShadow: `0 0 10px ${levelCfg.glow}`,
         }}>
      {level.toUpperCase()}
    </div>
  );
}

/* ── XP Progress bar ──────────────────────────────────── */
function XpBar({ xp }: { xp: number }) {
  const { level, progress, xpToNext, levelCfg } = getXpProgress(xp);
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1.5">
        <span className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
          {xp.toLocaleString('ru')} XP
        </span>
        <span className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
          {level !== 'Arcane' ? `+${xpToNext.toLocaleString('ru')} до следующего` : 'MAX'}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${levelCfg.color}, ${levelCfg.color}bb)`,
                   boxShadow: `0 0 8px ${levelCfg.glow}` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoggedIn, wishlist, logout } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Обзор');
  const [connectingTelegram, setConnTg] = useState(false);
  const [connectingSteam, setConnSteam] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) router.replace('/login');
  }, [isLoggedIn, router]);

  if (!user) return null;

  const { level, levelCfg } = getXpProgress(user.xp);
  const ordersData = ORDER_HISTORY.map((o) => ({
    ...o, product: products.find((p) => p.id === o.productId),
  }));
  const wishlistProducts = products.filter((p) => wishlist.includes(p.id)).slice(0, 4);

  const handleConnectSteam = async () => {
    setConnSteam(true);
    await new Promise((r) => setTimeout(r, 1500));
    setConnSteam(false);
  };

  return (
    <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
             backgroundSize: '52px 52px', opacity: 0.018,
           }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* ── PROFILE HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl overflow-hidden mb-6"
          style={{ background: '#0D0D16', border: '1px solid rgba(124,58,237,0.18)' }}
        >
          {/* BG glow */}
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: `radial-gradient(ellipse 60% 100% at 20% 50%, ${levelCfg.glow} 0%, transparent 65%)`, opacity: 0.5 }} />
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
              {/* Level glow dot */}
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
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Coins badge */}
              <div className="flex items-center gap-2 rounded-xl px-4 py-2.5"
                   style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)' }}>
                <Zap style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
                <span className="font-pixel text-[#FCD34D]" style={{ fontSize: '11px', letterSpacing: '0.06em' }}>
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
            {/* Telegram */}
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
                className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all duration-200"
                style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.08)', color: '#4B5563', fontSize: '12px' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.3)'; (e.currentTarget as HTMLElement).style.color = '#06B6D4'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#4B5563'; }}
              >
                <Send style={{ width: '12px', height: '12px' }} />
                <span className="font-body">Привязать Telegram</span>
              </button>
            )}

            {/* Steam */}
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
                className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all duration-200"
                style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.08)', color: '#4B5563', fontSize: '12px' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(102,192,244,0.3)'; (e.currentTarget as HTMLElement).style.color = '#66C0F4'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#4B5563'; }}
              >
                <Gamepad2 style={{ width: '12px', height: '12px' }} />
                <span className="font-body">{connectingSteam ? 'Подключение...' : 'Привязать Steam'}</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* ── TABS ── */}
        <div className="flex gap-1 p-1 rounded-xl mb-6"
             style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative rounded-lg px-5 py-2 font-heading font-medium transition-all duration-200"
              style={{
                fontSize: '13px',
                color: activeTab === tab ? '#E2E8F0' : '#4B5563',
                background: activeTab === tab ? 'rgba(124,58,237,0.15)' : 'transparent',
                border: activeTab === tab ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid lg:grid-cols-3 gap-5"
            >
              {/* Stats */}
              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Заказов',  value: ORDER_HISTORY.length, icon: ShoppingBag, color: '#7C3AED' },
                  { label: 'Вишлист',  value: wishlist.length,      icon: Heart,       color: '#EF4444' },
                  { label: 'Монеты',   value: user.coins,            icon: Zap,         color: '#F59E0B' },
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
                  Множитель монет: <span style={{ color: levelCfg.color }}>
                    {level === 'Rookie' ? '1×' : level === 'Player' ? '1.5×' : level === 'Elite' ? '2×' : level === 'Phantom' ? '2.5×' : '3×'}
                  </span>
                </p>
              </div>

              {/* Recent orders preview */}
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
                {ordersData.slice(0, 2).map((o) => o.product && (
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
                      <span className="font-body text-[#22C55E]" style={{ fontSize: '10.5px' }}>Выполнен</span>
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
                  <Link href="/wishlist" className="font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors flex items-center gap-1"
                        style={{ fontSize: '12px' }}>
                    Все <ChevronRight style={{ width: '12px', height: '12px' }} />
                  </Link>
                </div>
                {wishlistProducts.length === 0 ? (
                  <div className="py-8 text-center">
                    <Heart className="mx-auto mb-2 text-[#1F2937]" style={{ width: '24px', height: '24px' }} />
                    <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Вишлист пуст</p>
                    <Link href="/catalog" className="font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors mt-1 block"
                          style={{ fontSize: '12px' }}>
                      Перейти в каталог →
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 grid grid-cols-2 gap-2">
                    {wishlistProducts.map((p) => (
                      <Link key={p.id} href={`/product/${p.id}`}
                            className="relative aspect-[2/3] rounded-xl overflow-hidden group">
                        <Image src={p.image} alt={p.title} fill unoptimized className="object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(13,13,22,0.85) 100%)' }} />
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {ordersData.map((o) => o.product && (
                <div key={o.id} className="flex items-center gap-4 rounded-2xl px-5 py-4"
                     style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="relative w-12 h-14 rounded-xl overflow-hidden flex-shrink-0">
                    <Image src={o.product.image} alt={o.product.title} fill unoptimized className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[#374151] mb-0.5" style={{ fontSize: '11px' }}>#{o.id}</p>
                    <p className="font-heading font-semibold text-white line-clamp-1" style={{ fontSize: '14px' }}>{o.product.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-pixel rounded" style={{ fontSize: '7px', color: '#9D60FA', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', padding: '2px 6px' }}>
                        {o.platform}
                      </span>
                      <span className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{o.date}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-heading font-bold text-white mb-1" style={{ fontSize: '15px' }}>{formatPrice(o.price)}</p>
                    <div className="flex items-center gap-1 justify-end">
                      <Zap style={{ width: '10px', height: '10px', color: '#F59E0B' }} />
                      <span className="font-body text-[#F59E0B]" style={{ fontSize: '11px' }}>+{o.coinsEarned}</span>
                    </div>
                    <span className="font-body text-[#22C55E]" style={{ fontSize: '10.5px' }}>Выполнен</span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* ── COINS TAB ── */}
          {activeTab === 'Монеты' && (
            <motion.div key="coins"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {/* Balance hero */}
              <div className="rounded-2xl p-6 mb-5 text-center"
                   style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Zap className="mx-auto mb-3" style={{ width: '32px', height: '32px', color: '#F59E0B' }} />
                <p className="font-pixel text-[#FCD34D] mb-1"
                   style={{ fontSize: '28px', textShadow: '0 0 20px rgba(252,211,77,0.5)', letterSpacing: '0.04em' }}>
                  {user.coins.toLocaleString('ru')}
                </p>
                <p className="font-body text-[#6B7280]" style={{ fontSize: '13px' }}>Arcane Coins</p>
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
                {COINS_HISTORY.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3.5"
                       style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
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
                    <span className="font-heading font-bold" style={{ fontSize: '14px', color: t.type === 'spent' ? '#F87171' : t.type === 'bonus' ? '#22D3EE' : '#FCD34D' }}>
                      {t.amount > 0 ? '+' : ''}{t.amount}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── ACHIEVEMENTS TAB ── */}
          {activeTab === 'Достижения' && (
            <motion.div key="achievements"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
            >
              {ACHIEVEMENTS.map((a, i) => {
                const rarityColors: Record<string, { border: string; bg: string }> = {
                  common:    { border: 'rgba(156,163,175,0.2)',  bg: 'rgba(156,163,175,0.05)' },
                  rare:      { border: 'rgba(59,130,246,0.25)', bg: 'rgba(59,130,246,0.07)'  },
                  epic:      { border: 'rgba(124,58,237,0.3)',  bg: 'rgba(124,58,237,0.08)'  },
                  legendary: { border: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.08)'  },
                };
                const rc = rarityColors[a.rarity];
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl p-4 text-center"
                    style={{
                      background: a.earned ? rc.bg : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${a.earned ? rc.border : 'rgba(255,255,255,0.05)'}`,
                      opacity: a.earned ? 1 : 0.45,
                    }}
                  >
                    <div className="text-3xl mb-2.5">{a.icon}</div>
                    <p className="font-heading font-semibold text-white mb-1" style={{ fontSize: '12.5px' }}>{a.title}</p>
                    <p className="font-body text-[#4B5563]" style={{ fontSize: '10.5px', lineHeight: '1.4' }}>{a.desc}</p>
                    {a.earned && a.earnedDate && (
                      <p className="font-body text-[#374151] mt-2" style={{ fontSize: '10px' }}>{a.earnedDate}</p>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Telegram connect modal */}
      <AnimatePresence>
        {connectingTelegram && (
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
              className="rounded-2xl p-6 w-full max-w-sm relative"
              style={{ background: '#0D0D16', border: '1px solid rgba(6,182,212,0.3)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setConnTg(false)}
                      className="absolute top-4 right-4 text-[#4B5563] hover:text-[#9CA3AF]">
                <X style={{ width: '16px', height: '16px' }} />
              </button>
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                     style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)' }}>
                  <Send style={{ width: '22px', height: '22px', color: '#06B6D4' }} />
                </div>
                <h3 className="font-heading font-bold text-white mb-1" style={{ fontSize: '18px' }}>Привязать Telegram</h3>
                <p className="font-body text-[#6B7280]" style={{ fontSize: '13px' }}>Введите ваш username в Telegram</p>
              </div>
              <input
                type="text"
                placeholder="@username"
                className="w-full font-body text-white outline-none rounded-xl px-4 py-3 mb-4 placeholder:text-[#2D2D44]"
                style={{ background: '#07070D', border: '1px solid rgba(6,182,212,0.25)', fontSize: '14px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value;
                    if (val) { (useUser as unknown as { connectTelegram?: (v: string) => void }).connectTelegram?.(val); setConnTg(false); }
                  }
                }}
              />
              <p className="font-body text-[#374151] text-center" style={{ fontSize: '11.5px' }}>
                После привязки вы будете получать уведомления о заказах и ценах
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
