import { getServerSession } from 'next-auth';
import { redirect }         from 'next/navigation';
import Image                from 'next/image';
import Link                 from 'next/link';
import {
  Zap, ShoppingBag, Heart, Star, Settings, BookOpen,
  Package, ChevronRight, Crown, Calendar, TrendingUp,
  Box, History, Wallet, Gift, Users,
} from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma }      from '@/lib/prisma';
import { formatPrice } from '@/lib/utils';
import ReferralCard    from '@/components/profile/ReferralCard';
import crypto          from 'crypto';
import type { Metadata } from 'next';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDB = any;

export const metadata: Metadata = { title: 'Профиль — Arcane' };

/* ── Level config ────────────────────────────────────── */
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

/* ── Rarity colors ───────────────────────────────────── */
const RARITY_COLOR: Record<string, string> = {
  COMMON:    '#9CA3AF',
  RARE:      '#3B82F6',
  EPIC:      '#7C3AED',
  LEGENDARY: '#F59E0B',
};
const RARITY_LABEL: Record<string, string> = {
  COMMON: 'Обычный', RARE: 'Редкий', EPIC: 'Эпический', LEGENDARY: 'Легендарный',
};

/* ── Deposit status ──────────────────────────────────── */
const DEPOSIT_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:  { label: 'Ожидает',   color: '#F59E0B' },
  APPROVED: { label: 'Одобрено',  color: '#22C55E' },
  REJECTED: { label: 'Отклонено', color: '#EF4444' },
};
const DEPOSIT_METHOD: Record<string, string> = {
  click: 'Click', payme: 'Payme', card: 'Карта',
};

/* ── Order status label ──────────────────────────────── */
const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:        { label: 'Ожидает оплаты',  color: '#6B7280' },
  PAID:           { label: 'Оплачен',         color: '#06B6D4' },
  WAITING_MANUAL: { label: 'У оператора',     color: '#FB923C' },
  COMPLETED:      { label: 'Доставлен',       color: '#22C55E' },
  CANCELLED:      { label: 'Отменён',         color: '#EF4444' },
};

/* ── Data fetchers ───────────────────────────────────── */
async function getBaseData(userId: string) {
  const [user, wishlistCount] = await Promise.all([
    prisma.users.findUnique({
      where:  { id: userId },
      select: {
        id: true, username: true, email: true, avatar: true,
        arcCoins: true, balanceUzs: true, xp: true, level: true,
        totalSpent: true, createdAt: true,
        _count: { select: { orders: true, wishlists: true } },
      },
    }),
    prisma.wishlists.count({ where: { userId } }),
  ]);
  return { user, wishlistCount };
}

async function getInventory(userId: string) {
  return prisma.inventory.findMany({
    where:   { userId },
    include: {
      drop_rewards: {
        select: { name: true, rarity: true, type: true, imageUrl: true, drop_machines: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take:    40,
  });
}

async function getCaseHistory(userId: string) {
  return prisma.drop_history.findMany({
    where:   { userId },
    include: {
      drop_machines: { select: { name: true, theme: true, price: true } },
      drop_rewards:  { select: { name: true, rarity: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
    take:    30,
  });
}

async function getDeposits(userId: string) {
  return prisma.deposit_requests.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
    take:    30,
    select:  { id: true, amount: true, method: true, status: true, comment: true, createdAt: true },
  });
}

async function getOrders(userId: string) {
  return prisma.orders.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
    take:    5,
    select: {
      id: true, status: true, totalPrice: true, createdAt: true,
      items: { take: 1, select: { game: { select: { title: true, cover: true } } } },
    },
  });
}

async function getReferralData(userId: string) {
  let user = await (prisma.users.findUnique as AnyDB)({
    where:  { id: userId },
    select: { referralCode: true },
  });

  if (!user?.referralCode) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    await (prisma.users.update as AnyDB)({
      where: { id: userId },
      data:  { referralCode: code },
    });
    user = { referralCode: code };
  }

  const [totalReferrals, coinsAgg] = await Promise.all([
    (prisma.users.count as AnyDB)({ where: { referredBy: userId } }),
    prisma.transactions.aggregate({
      where: { userId, type: 'REFERRAL_BONUS' },
      _sum:  { amount: true },
    }),
  ]);

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://arcane.uz';
  return {
    code:             user.referralCode as string,
    referralLink:     `${baseUrl}/register?ref=${user.referralCode}`,
    totalReferrals:   totalReferrals as number,
    totalCoinsEarned: (coinsAgg._sum?.amount ?? 0) as number,
  };
}

type Tab = 'overview' | 'inventory' | 'cases' | 'deposits' | 'referral';

/* ── Page ────────────────────────────────────────────── */
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login?callbackUrl=/profile');

  const tab: Tab = (['overview', 'inventory', 'cases', 'deposits', 'referral'].includes(searchParams.tab ?? '')
    ? searchParams.tab as Tab
    : 'overview');

  const { user, wishlistCount } = await getBaseData(session.user.id);
  if (!user) redirect('/login');

  const [inventory, caseHistory, deposits, recentOrders, referralData] = await Promise.all([
    tab === 'inventory' ? getInventory(session.user.id)      : Promise.resolve(null),
    tab === 'cases'     ? getCaseHistory(session.user.id)    : Promise.resolve(null),
    tab === 'deposits'  ? getDeposits(session.user.id)       : Promise.resolve(null),
    tab === 'overview'  ? getOrders(session.user.id)         : Promise.resolve(null),
    tab === 'referral'  ? getReferralData(session.user.id)   : Promise.resolve(null),
  ]);

  const { name: levelName, cfg: levelCfg, pct: xpPct, xpToNext } = getXpProgress(user.xp);
  const joinYear = new Date(user.createdAt).getFullYear();

  const TABS = [
    { id: 'overview'  as Tab, label: 'Обзор',      icon: TrendingUp },
    { id: 'inventory' as Tab, label: 'Инвентарь',  icon: Box        },
    { id: 'cases'     as Tab, label: 'Кейсы',      icon: Gift       },
    { id: 'deposits'  as Tab, label: 'Баланс',     icon: Wallet     },
    { id: 'referral'  as Tab, label: 'Рефералы',   icon: Users      },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '96px', paddingBottom: '80px' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: '30%', width: '500px', height: '300px',
          background: `radial-gradient(ellipse, ${levelCfg.glow} 0%, transparent 70%)`, filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">

        {/* ── Hero card ── */}
        <div className="rounded-3xl overflow-hidden mb-5"
             style={{ background: '#0D0D16', border: `1px solid ${levelCfg.border}` }}>
          <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${levelCfg.color}, transparent)` }} />
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user.avatar ? (
                <Image src={user.avatar} alt={user.username} width={72} height={72} unoptimized
                  className="rounded-2xl object-cover"
                  style={{ border: `2px solid ${levelCfg.border}`, boxShadow: `0 0 24px ${levelCfg.glow}` }} />
              ) : (
                <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center font-heading font-bold text-white"
                     style={{ background: `linear-gradient(135deg, ${levelCfg.color}40, ${levelCfg.color}20)`,
                       border: `2px solid ${levelCfg.border}`, fontSize: '26px', boxShadow: `0 0 24px ${levelCfg.glow}` }}>
                  {user.username[0]?.toUpperCase()}
                </div>
              )}
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
              <h1 className="font-heading font-bold text-white mb-0.5" style={{ fontSize: '24px' }}>{user.username}</h1>
              <p className="font-body text-[#4B5563] mb-3" style={{ fontSize: '12px' }}>{user.email}</p>
              <div className="mb-1 flex items-center justify-between">
                <span className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>
                  {user.xp.toLocaleString('ru')} XP
                </span>
                <span className="font-body" style={{ fontSize: '11px', color: levelCfg.color }}>
                  {xpToNext > 0 ? `до следующего: ${xpToNext.toLocaleString('ru')} XP` : 'Максимум'}
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: `${xpPct}%`,
                  background: `linear-gradient(90deg, ${levelCfg.color}88, ${levelCfg.color})`, boxShadow: `0 0 8px ${levelCfg.glow}` }} />
              </div>
            </div>

            {/* Balance chips */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                   style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
                <Zap style={{ width: '12px', height: '12px', color: '#F59E0B' }} />
                <span className="font-heading font-bold text-white" style={{ fontSize: '12px' }}>
                  {user.arcCoins.toLocaleString('ru')} ARC
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                   style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.18)' }}>
                <Wallet style={{ width: '12px', height: '12px', color: '#06B6D4' }} />
                <span className="font-heading font-bold text-white" style={{ fontSize: '12px' }}>
                  {formatPrice(user.balanceUzs)}
                </span>
              </div>
              <Link href="/deposit"
                className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 font-heading font-semibold text-xs text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
                + Пополнить
              </Link>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {TABS.map(t => (
            <Link
              key={t.id}
              href={`/profile?tab=${t.id}`}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-semibold text-sm whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: tab === t.id ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                border:     `1px solid ${tab === t.id ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.07)'}`,
                color:      tab === t.id ? '#A78BFA' : '#6B7280',
              }}
            >
              <t.icon style={{ width: '13px', height: '13px' }} />
              {t.label}
            </Link>
          ))}
        </div>

        {/* ════════════════════════════════════════════════
            TAB: OVERVIEW
        ════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
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

            <div className="grid lg:grid-cols-3 gap-5">
              {/* Recent orders */}
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
                    Все <ChevronRight style={{ width: '12px', height: '12px' }} />
                  </Link>
                </div>
                {recentOrders?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Package style={{ width: '28px', height: '28px', color: '#1F2937' }} />
                    <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Заказов пока нет</p>
                    <Link href="/catalog" className="font-body text-[#7C3AED] hover:opacity-80" style={{ fontSize: '12px' }}>
                      В каталог →
                    </Link>
                  </div>
                ) : (
                  recentOrders?.map(order => {
                    const st   = ORDER_STATUS[order.status] ?? { label: order.status, color: '#6B7280' };
                    const game = order.items[0]?.game;
                    return (
                      <div key={order.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.015]"
                           style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="w-9 h-11 rounded-lg overflow-hidden flex-shrink-0"
                             style={{ background: 'rgba(255,255,255,0.05)' }}>
                          {game?.cover
                            ? <Image src={game.cover} alt={game.title} width={36} height={44} unoptimized className="object-cover w-full h-full" />
                            : <div className="w-full h-full flex items-center justify-center"><Package style={{ width: '14px', height: '14px', color: '#374151' }} /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-[#D1D5DB] truncate" style={{ fontSize: '13px' }}>{game?.title ?? 'Игра'}</p>
                          <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>
                            {new Date(order.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </p>
                        </div>
                        <p className="font-heading font-semibold text-[#9CA3AF] flex-shrink-0" style={{ fontSize: '12px' }}>
                          {formatPrice(order.totalPrice)}
                        </p>
                        <span className="font-body rounded-full px-2.5 py-1 flex-shrink-0"
                              style={{ fontSize: '10px', color: st.color, background: `${st.color}18`, border: `1px solid ${st.color}25` }}>
                          {st.label}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Side: level + links */}
              <div className="space-y-4">
                <div className="rounded-2xl p-5" style={{ background: levelCfg.bg, border: `1px solid ${levelCfg.border}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Crown style={{ width: '14px', height: '14px', color: levelCfg.color }} />
                    <span className="font-pixel" style={{ fontSize: '9px', color: levelCfg.color, letterSpacing: '0.1em' }}>ВАШ УРОВЕНЬ</span>
                  </div>
                  <p className="font-heading font-bold text-white mb-0.5" style={{ fontSize: '20px' }}>{levelName}</p>
                  <p className="font-body text-[#6B7280] mb-3" style={{ fontSize: '12px' }}>
                    Уровень {user.level} · {user.xp.toLocaleString('ru')} XP
                  </p>
                  <div className="h-1.5 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full" style={{ width: `${xpPct}%`, background: levelCfg.color }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Star style={{ width: '10px', height: '10px', color: levelCfg.color }} />
                    <span className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>{xpPct}% до следующего</span>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {[
                    { href: '/library',  icon: BookOpen, label: 'Библиотека',  sub: `${user._count.orders} игр` },
                    { href: '/wishlist', icon: Heart,    label: 'Вишлист',     sub: `${wishlistCount} игр` },
                    { href: '/cases',    icon: Gift,     label: 'Кейсы',       sub: 'Открыть кейс' },
                    { href: '/settings', icon: Settings, label: 'Настройки',   sub: 'Профиль' },
                  ].map(({ href, icon: Icon, label, sub }, i, arr) => (
                    <Link key={href} href={href}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors group"
                      style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <Icon style={{ width: '13px', height: '13px', color: '#4B5563' }} />
                      <div className="flex-1">
                        <p className="font-body text-[#D1D5DB]" style={{ fontSize: '13px' }}>{label}</p>
                        <p className="font-body text-[#374151]" style={{ fontSize: '10.5px' }}>{sub}</p>
                      </div>
                      <ChevronRight style={{ width: '12px', height: '12px', color: '#1F2937' }} />
                    </Link>
                  ))}
                </div>

                <div className="flex items-center gap-2 px-2">
                  <Calendar style={{ width: '11px', height: '11px', color: '#1F2937' }} />
                  <span className="font-body text-[#1F2937]" style={{ fontSize: '11px' }}>В сообществе с {joinYear} года</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════
            TAB: INVENTORY
        ════════════════════════════════════════════════ */}
        {tab === 'inventory' && (
          <div>
            {!inventory || inventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl"
                   style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Box style={{ width: '36px', height: '36px', color: '#1F2937' }} />
                <p className="font-body text-[#374151]" style={{ fontSize: '14px' }}>Инвентарь пуст</p>
                <Link href="/cases"
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 font-heading font-semibold text-sm text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
                  Открыть кейс
                </Link>
              </div>
            ) : (
              <>
                <p className="font-body text-[#4B5563] mb-4" style={{ fontSize: '12px' }}>
                  {inventory.length} предметов
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {inventory.map(item => {
                    const rarity  = item.drop_rewards.rarity;
                    const color   = RARITY_COLOR[rarity] ?? '#9CA3AF';
                    const isCoins = item.drop_rewards.type === 'COINS';
                    return (
                      <div key={item.id} className="rounded-2xl overflow-hidden relative"
                           style={{ background: '#0D0D16', border: `1px solid ${color}20` }}>
                        <div className="absolute top-0 left-0 right-0 h-0.5"
                             style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
                        {/* Image area */}
                        <div className="aspect-square flex items-center justify-center relative"
                             style={{ background: `${color}08` }}>
                          {item.drop_rewards.imageUrl ? (
                            <Image src={item.drop_rewards.imageUrl} alt={item.drop_rewards.name}
                              fill unoptimized className="object-cover" />
                          ) : (
                            <div className="text-4xl">{isCoins ? '🪙' : '🎮'}</div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="p-2.5">
                          <p className="font-body text-[#D1D5DB] truncate mb-1" style={{ fontSize: '12px' }}>
                            {item.drop_rewards.name}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="font-body rounded-full px-2 py-0.5"
                                  style={{ fontSize: '9px', color, background: `${color}15`, border: `1px solid ${color}25` }}>
                              {RARITY_LABEL[rarity]}
                            </span>
                            <span className="font-body text-[#374151]" style={{ fontSize: '9px' }}>
                              {new Date(item.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                          <p className="font-body text-[#4B5563] mt-1 truncate" style={{ fontSize: '9.5px' }}>
                            {item.drop_rewards.drop_machines?.name}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: CASE HISTORY
        ════════════════════════════════════════════════ */}
        {tab === 'cases' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <History style={{ width: '14px', height: '14px', color: '#9D60FA' }} />
              <span className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>
                История открытий
              </span>
              {caseHistory && (
                <span className="ml-auto font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
                  {caseHistory.length} записей
                </span>
              )}
            </div>
            {!caseHistory || caseHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Gift style={{ width: '32px', height: '32px', color: '#1F2937' }} />
                <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Кейсы ещё не открывались</p>
                <Link href="/cases" className="font-body text-[#7C3AED] hover:opacity-80" style={{ fontSize: '12px' }}>
                  Открыть первый кейс →
                </Link>
              </div>
            ) : (
              caseHistory.map(h => {
                const rarity = h.drop_rewards.rarity;
                const color  = RARITY_COLOR[rarity] ?? '#9CA3AF';
                return (
                  <div key={h.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.015]"
                       style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {/* Case icon */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                         style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                      <Gift style={{ width: '16px', height: '16px', color }} />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[#D1D5DB] truncate" style={{ fontSize: '13px' }}>
                        {h.drop_rewards.name}
                      </p>
                      <p className="font-body text-[#4B5563]" style={{ fontSize: '10.5px' }}>
                        {h.drop_machines.name}
                      </p>
                    </div>
                    {/* Rarity */}
                    <span className="font-body rounded-full px-2.5 py-1 flex-shrink-0"
                          style={{ fontSize: '10px', color, background: `${color}15`, border: `1px solid ${color}25` }}>
                      {RARITY_LABEL[rarity]}
                    </span>
                    {/* Price */}
                    <p className="font-heading font-semibold text-[#9CA3AF] flex-shrink-0" style={{ fontSize: '12px' }}>
                      {formatPrice(h.drop_machines.price)}
                    </p>
                    {/* Date */}
                    <p className="font-body text-[#374151] flex-shrink-0" style={{ fontSize: '10.5px' }}>
                      {new Date(h.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: DEPOSITS / BALANCE
        ════════════════════════════════════════════════ */}
        {tab === 'deposits' && (
          <div className="space-y-4">
            {/* Current balance */}
            <div className="rounded-2xl p-5" style={{ background: '#0D0D16', border: '1px solid rgba(6,182,212,0.2)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body text-[#4B5563] mb-1" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Текущий баланс
                  </p>
                  <p className="font-heading font-bold text-white" style={{ fontSize: '28px' }}>
                    {formatPrice(user.balanceUzs)}
                  </p>
                </div>
                <Link href="/deposit"
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-semibold text-sm text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
                  <Wallet style={{ width: '13px', height: '13px' }} />
                  Пополнить
                </Link>
              </div>
            </div>

            {/* Deposits list */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <History style={{ width: '14px', height: '14px', color: '#06B6D4' }} />
                <span className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>История пополнений</span>
              </div>
              {!deposits || deposits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <Wallet style={{ width: '28px', height: '28px', color: '#1F2937' }} />
                  <p className="font-body text-[#374151]" style={{ fontSize: '13px' }}>Пополнений пока не было</p>
                  <Link href="/deposit" className="font-body text-[#7C3AED] hover:opacity-80" style={{ fontSize: '12px' }}>
                    Пополнить баланс →
                  </Link>
                </div>
              ) : (
                deposits.map(dep => {
                  const st = DEPOSIT_STATUS[dep.status] ?? { label: dep.status, color: '#6B7280' };
                  return (
                    <div key={dep.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.015]"
                         style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                           style={{ background: `${st.color}12`, border: `1px solid ${st.color}25` }}>
                        <Wallet style={{ width: '14px', height: '14px', color: st.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-[#D1D5DB]" style={{ fontSize: '13px' }}>
                          {DEPOSIT_METHOD[dep.method] ?? dep.method}
                        </p>
                        {dep.comment && (
                          <p className="font-body text-[#4B5563] truncate" style={{ fontSize: '10.5px' }}>{dep.comment}</p>
                        )}
                      </div>
                      <p className="font-heading font-bold text-white flex-shrink-0" style={{ fontSize: '14px' }}>
                        +{formatPrice(dep.amount)}
                      </p>
                      <span className="font-body rounded-full px-2.5 py-1 flex-shrink-0"
                            style={{ fontSize: '10px', color: st.color, background: `${st.color}15`, border: `1px solid ${st.color}25` }}>
                        {st.label}
                      </span>
                      <p className="font-body text-[#374151] flex-shrink-0" style={{ fontSize: '10.5px' }}>
                        {new Date(dep.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: REFERRAL
        ════════════════════════════════════════════════ */}
        {tab === 'referral' && referralData && (
          <ReferralCard
            code={referralData.code}
            referralLink={referralData.referralLink}
            totalReferrals={referralData.totalReferrals}
            totalCoinsEarned={referralData.totalCoinsEarned}
          />
        )}

      </div>
    </div>
  );
}
