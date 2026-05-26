import { getServerSession } from 'next-auth';
import { redirect }         from 'next/navigation';
import Image                from 'next/image';
import Link                 from 'next/link';
import {
  Zap, ShoppingBag, Heart, Star, Settings, BookOpen,
  Package, ChevronRight, Crown, Calendar, TrendingUp,
} from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma }      from '@/lib/prisma';
import { formatPrice } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Профиль — Arcane' };

/* ── Level config (mirrors mockUserData) ────────────── */
type LevelName = 'Rookie' | 'Player' | 'Elite' | 'Phantom' | 'Arcane';

const LEVELS: Record<LevelName, { xpMin: number; xpMax: number; color: string; bg: string; border: string; glow: string }> = {
  Rookie:  { xpMin: 0,     xpMax: 999,    color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.22)', glow: 'rgba(156,163,175,0.15)' },
  Player:  { xpMin: 1000,  xpMax: 4999,   color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  glow: 'rgba(59,130,246,0.18)'  },
  Elite:   { xpMin: 5000,  xpMax: 14999,  color: '#7C3AED', bg: 'rgba(124,58,237,0.1)',  border: 'rgba(124,58,237,0.28)', glow: 'rgba(124,58,237,0.2)'   },
  Phantom: { xpMin: 15000, xpMax: 49999,  color: '#06B6D4', bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.28)',  glow: 'rgba(6,182,212,0.2)'    },
  Arcane:  { xpMin: 50000, xpMax: 999999, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)',  glow: 'rgba(245,158,11,0.22)'  },
};

function getLevel(xp: number): LevelName {
  if (xp >= 50000) return 'Arcane';
  if (xp >= 15000) return 'Phantom';
  if (xp >= 5000)  return 'Elite';
  if (xp >= 1000)  return 'Player';
  return 'Rookie';
}

function getXpProgress(xp: number) {
  const name = getLevel(xp);
  const cfg  = LEVELS[name];
  const pct  = Math.min(100, Math.round(((xp - cfg.xpMin) / (cfg.xpMax - cfg.xpMin + 1)) * 100));
  return { name, cfg, pct, xpToNext: Math.max(0, cfg.xpMax + 1 - xp) };
}

/* ── Status label ────────────────────────────────────── */
const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:        { label: 'Ожидает оплаты',  color: '#6B7280' },
  PAID:           { label: 'Оплачен',         color: '#06B6D4' },
  WAITING_MANUAL: { label: 'У оператора',     color: '#FB923C' },
  COMPLETED:      { label: 'Доставлен',       color: '#22C55E' },
  CANCELLED:      { label: 'Отменён',         color: '#EF4444' },
};

/* ── Data fetcher ────────────────────────────────────── */
async function getProfileData(userId: string) {
  const [user, recentOrders, wishlistCount] = await Promise.all([
    prisma.users.findUnique({
      where:  { id: userId },
      select: { id: true, username: true, email: true, avatar: true, arcCoins: true, xp: true, level: true, totalSpent: true, createdAt: true, _count: { select: { orders: true, wishlists: true } } },
    }),
    prisma.orders.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      take:    5,
      select: {
        id: true, status: true, totalPrice: true, createdAt: true,
        items: { take: 1, select: { game: { select: { title: true, cover: true, slug: true } } } },
      },
    }),
    prisma.wishlists.count({ where: { userId } }),
  ]);
  return { user, recentOrders, wishlistCount };
}

/* ── Page ────────────────────────────────────────────── */
export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login?callbackUrl=/profile');

  const { user, recentOrders, wishlistCount } = await getProfileData(session.user.id);
  if (!user) redirect('/login');

  const { name: levelName, cfg: levelCfg, pct: xpPct, xpToNext } = getXpProgress(user.xp);
  const joinYear = new Date(user.createdAt).getFullYear();

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '96px', paddingBottom: '80px' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: '30%', width: '500px', height: '300px', background: `radial-gradient(ellipse, ${levelCfg.glow} 0%, transparent 70%)`, filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">

        {/* ── Hero card ── */}
        <div className="rounded-3xl overflow-hidden mb-6"
             style={{ background: '#0D0D16', border: `1px solid ${levelCfg.border}` }}>

          {/* Top accent line */}
          <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${levelCfg.color}, transparent)` }} />

          <div className="p-7 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user.avatar ? (
                <Image
                  src={user.avatar} alt={user.username}
                  width={80} height={80} unoptimized
                  className="rounded-2xl object-cover"
                  style={{ border: `2px solid ${levelCfg.border}`, boxShadow: `0 0 24px ${levelCfg.glow}` }}
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-heading font-bold text-white"
                     style={{ background: `linear-gradient(135deg, ${levelCfg.color}40, ${levelCfg.color}20)`, border: `2px solid ${levelCfg.border}`, fontSize: '28px', boxShadow: `0 0 24px ${levelCfg.glow}` }}>
                  {user.username[0]?.toUpperCase()}
                </div>
              )}
              {/* Level badge */}
              <div className="absolute -bottom-2 -right-2 flex items-center gap-1 rounded-lg px-2 py-0.5"
                   style={{ background: levelCfg.bg, border: `1px solid ${levelCfg.border}` }}>
                <Crown style={{ width: '9px', height: '9px', color: levelCfg.color }} />
                <span className="font-pixel" style={{ fontSize: '7px', color: levelCfg.color, letterSpacing: '0.06em' }}>
                  {levelName.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Name + XP */}
            <div className="flex-1 min-w-0">
              <h1 className="font-heading font-bold text-white mb-0.5" style={{ fontSize: '26px' }}>{user.username}</h1>
              <p className="font-body text-[#4B5563] mb-4" style={{ fontSize: '13px' }}>{user.email}</p>

              {/* XP bar */}
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>
                  {user.xp.toLocaleString('ru')} XP
                </span>
                <span className="font-body" style={{ fontSize: '11px', color: levelCfg.color }}>
                  {xpToNext > 0 ? `до ${getLevel(user.xp + xpToNext)} ещё ${xpToNext.toLocaleString('ru')} XP` : 'Максимальный уровень'}
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${xpPct}%`, background: `linear-gradient(90deg, ${levelCfg.color}88, ${levelCfg.color})`, boxShadow: `0 0 8px ${levelCfg.glow}` }}
                />
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-semibold text-sm transition-all hover:opacity-90"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF' }}
              >
                <Settings style={{ width: '13px', height: '13px' }} />
                Настройки
              </Link>
              <Link
                href="/library"
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-semibold text-sm transition-all hover:opacity-90"
                style={{ background: `${levelCfg.color}15`, border: `1px solid ${levelCfg.border}`, color: levelCfg.color }}
              >
                <BookOpen style={{ width: '13px', height: '13px' }} />
                Библиотека
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Arcane Coins',  value: user.arcCoins.toLocaleString('ru'), icon: Zap,         color: '#F59E0B' },
            { label: 'Заказов',       value: user._count.orders.toString(),       icon: ShoppingBag, color: '#7C3AED' },
            { label: 'В вишлисте',   value: wishlistCount.toString(),             icon: Heart,       color: '#EF4444' },
            { label: 'Потрачено',     value: user.totalSpent > 0 ? formatPrice(user.totalSpent) : '0 сум', icon: TrendingUp, color: '#22C55E' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl p-4 relative overflow-hidden"
                 style={{ background: '#0D0D16', border: `1px solid ${color}18` }}>
              <div className="absolute top-0 right-0 w-16 h-16"
                   style={{ background: `radial-gradient(circle at top right, ${color}12, transparent 70%)` }} />
              <Icon style={{ width: '14px', height: '14px', color, marginBottom: '10px' }} />
              <p className="font-heading font-bold text-white mb-0.5" style={{ fontSize: '18px' }}>{value}</p>
              <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Recent orders ── */}
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl overflow-hidden"
               style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between px-5 py-4"
                 style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <ShoppingBag style={{ width: '14px', height: '14px', color: '#7C3AED' }} />
                <span className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>Последние заказы</span>
              </div>
              <Link href="/library"
                    className="font-body text-[#4B5563] hover:text-white transition-colors flex items-center gap-1"
                    style={{ fontSize: '12px' }}>
                Все заказы <ChevronRight style={{ width: '12px', height: '12px' }} />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <Package style={{ width: '32px', height: '32px', color: '#1F2937' }} />
                <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Заказов пока нет</p>
                <Link href="/catalog"
                      className="font-body text-[#7C3AED] hover:opacity-80 transition-opacity"
                      style={{ fontSize: '12px' }}>
                  Перейти в каталог →
                </Link>
              </div>
            ) : (
              <div>
                {recentOrders.map((order) => {
                  const st   = STATUS_LABEL[order.status] ?? { label: order.status, color: '#6B7280' };
                  const game = order.items[0]?.game;
                  return (
                    <div
                      key={order.id}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.015] transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      {/* Cover */}
                      <div className="w-10 h-12 rounded-lg overflow-hidden flex-shrink-0"
                           style={{ background: 'rgba(255,255,255,0.05)' }}>
                        {game?.cover ? (
                          <Image src={game.cover} alt={game.title} width={40} height={48} unoptimized className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package style={{ width: '16px', height: '16px', color: '#374151' }} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-[#D1D5DB] truncate" style={{ fontSize: '13px' }}>
                          {game?.title ?? 'Игра'}
                        </p>
                        <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>
                          {new Date(order.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </p>
                      </div>

                      {/* Price */}
                      <p className="font-heading font-semibold text-[#9CA3AF] flex-shrink-0" style={{ fontSize: '12px' }}>
                        {formatPrice(order.totalPrice)}
                      </p>

                      {/* Status */}
                      <span className="font-body rounded-full px-2.5 py-1 flex-shrink-0"
                            style={{ fontSize: '10px', color: st.color, background: `${st.color}18`, border: `1px solid ${st.color}25` }}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Side: level info + links ── */}
          <div className="space-y-4">
            {/* Level card */}
            <div className="rounded-2xl p-5"
                 style={{ background: levelCfg.bg, border: `1px solid ${levelCfg.border}` }}>
              <div className="flex items-center gap-2 mb-4">
                <Crown style={{ width: '15px', height: '15px', color: levelCfg.color }} />
                <span className="font-pixel" style={{ fontSize: '9px', color: levelCfg.color, letterSpacing: '0.1em' }}>
                  ВАШ УРОВЕНЬ
                </span>
              </div>
              <p className="font-heading font-bold text-white mb-1" style={{ fontSize: '22px' }}>{levelName}</p>
              <p className="font-body text-[#6B7280] mb-4" style={{ fontSize: '12px' }}>
                Уровень {user.level} · {user.xp.toLocaleString('ru')} XP
              </p>
              <div className="h-1.5 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full"
                     style={{ width: `${xpPct}%`, background: levelCfg.color, boxShadow: `0 0 6px ${levelCfg.glow}` }} />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Star style={{ width: '11px', height: '11px', color: levelCfg.color }} />
                <span className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>
                  {xpPct}% до следующего уровня
                </span>
              </div>
            </div>

            {/* Links */}
            <div className="rounded-2xl overflow-hidden"
                 style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
              {[
                { href: '/library',  icon: BookOpen,    label: 'Моя библиотека',  sub: `${user._count.orders} игр` },
                { href: '/wishlist', icon: Heart,       label: 'Вишлист',         sub: `${wishlistCount} игр` },
                { href: '/catalog',  icon: Package,     label: 'Каталог',         sub: 'Все игры' },
                { href: '/settings', icon: Settings,    label: 'Настройки',       sub: 'Профиль и безопасность' },
              ].map(({ href, icon: Icon, label, sub }, i, arr) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors group"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                >
                  <Icon style={{ width: '14px', height: '14px', color: '#4B5563' }} />
                  <div className="flex-1">
                    <p className="font-body text-[#D1D5DB]" style={{ fontSize: '13px' }}>{label}</p>
                    <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>{sub}</p>
                  </div>
                  <ChevronRight style={{ width: '13px', height: '13px', color: '#1F2937' }}
                                className="group-hover:text-[#4B5563] transition-colors" />
                </Link>
              ))}
            </div>

            {/* Join date */}
            <div className="flex items-center gap-2 px-2">
              <Calendar style={{ width: '12px', height: '12px', color: '#1F2937' }} />
              <span className="font-body text-[#1F2937]" style={{ fontSize: '11px' }}>
                В сообществе с {joinYear} года
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
