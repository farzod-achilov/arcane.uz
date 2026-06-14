import { getServerSession } from 'next-auth';
import { redirect }         from 'next/navigation';
import Link                 from 'next/link';
import Image                from 'next/image';
import {
  ShoppingBag, Heart, Wallet, BookOpen,
  Zap, TrendingUp, LayoutGrid, Package,
  ChevronRight, Star, Gift, Users,
} from 'lucide-react';
import { authOptions }      from '@/lib/auth';
import { prisma }           from '@/lib/prisma';
import { formatPrice }      from '@/lib/utils';
import { getXpProgress }    from '@/lib/mockUserData';
import type { Metadata }    from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Дашборд | Arcane',
};

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:        { label: 'Ожидает оплаты',  color: '#6B7280' },
  PAID:           { label: 'Оплачен',         color: '#06B6D4' },
  WAITING_MANUAL: { label: 'У оператора',     color: '#FB923C' },
  COMPLETED:      { label: 'Доставлен',       color: '#22C55E' },
  CANCELLED:      { label: 'Отменён',         color: '#EF4444' },
};

async function getData(userId: string) {
  const [user, wishlistCount, recentOrders] = await Promise.all([
    prisma.users.findUnique({
      where:  { id: userId },
      select: {
        username: true, avatar: true,
        arcCoins: true, balanceUzs: true,
        xp: true, totalSpent: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.wishlists.count({ where: { userId } }),
    prisma.orders.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      take:    3,
      select: {
        id: true, status: true, totalPrice: true, createdAt: true,
        items: { take: 1, select: { game: { select: { title: true, cover: true } } } },
      },
    }),
  ]);
  return { user, wishlistCount, recentOrders };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const { user, wishlistCount, recentOrders } = await getData(session.user.id);
  if (!user) redirect('/login');

  const { level, progress, xpToNext, levelCfg } = getXpProgress(user.xp);

  const quickLinks = [
    { href: '/catalog',    icon: LayoutGrid, label: 'Каталог',    color: '#7C3AED' },
    { href: '/library',    icon: BookOpen,   label: 'Библиотека', color: '#06B6D4' },
    { href: '/wishlist',   icon: Heart,      label: 'Вишлист',    color: '#EF4444' },
    { href: '/profile?tab=overview',  icon: Package,    label: 'Заказы',     color: '#22C55E' },
    { href: '/deposit',               icon: Wallet,     label: 'Пополнить',  color: '#F59E0B' },
    { href: '/cases',                 icon: Gift,       label: 'Кейсы',      color: '#FB923C' },
    { href: '/arc-shop',              icon: Zap,        label: 'ARC Shop',   color: '#A78BFA' },
    { href: '/profile?tab=referral',  icon: Users,      label: 'Рефералы',   color: '#34D399' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '96px' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Hero card ── */}
        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-5"
          style={{
            background: `linear-gradient(135deg, ${levelCfg.bg}, rgba(12,12,26,0.9))`,
            border: `1px solid ${levelCfg.border}`,
          }}
        >
          <div className="relative flex-shrink-0">
            <div
              className="w-16 h-16 rounded-2xl overflow-hidden"
              style={{ border: `2px solid ${levelCfg.border}` }}
            >
              {user.avatar ? (
                <Image src={user.avatar} alt={user.username} width={64} height={64} unoptimized className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-heading font-bold text-2xl"
                  style={{ background: levelCfg.bg, color: levelCfg.color }}
                >
                  {user.username[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-heading font-bold px-2 py-0.5 rounded-lg"
                style={{ background: levelCfg.bg, color: levelCfg.color, border: `1px solid ${levelCfg.border}` }}
              >
                {level}
              </span>
            </div>
            <h1 className="font-heading font-bold text-xl text-white truncate">{user.username}</h1>
            <div className="mt-2">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-body" style={{ color: levelCfg.color }}>{user.xp} XP</span>
                <span className="text-xs font-body text-gray-500">до следующего: {xpToNext} XP</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${levelCfg.color}, ${levelCfg.color}99)` }}
                />
              </div>
            </div>
          </div>

          <Link
            href="/profile"
            className="flex-shrink-0 flex items-center gap-1.5 text-sm font-body px-4 py-2 rounded-xl transition-all hover:bg-white/5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF' }}
          >
            Профиль <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'ARC Coins',   value: user.arcCoins.toLocaleString('ru'), icon: Zap,         color: '#F59E0B' },
            { label: 'Баланс',      value: formatPrice(user.balanceUzs),       icon: Wallet,      color: '#22C55E' },
            { label: 'Заказов',     value: user._count.orders.toString(),      icon: ShoppingBag, color: '#7C3AED' },
            { label: 'В вишлисте', value: wishlistCount.toString(),            icon: Heart,       color: '#EF4444' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-xl p-4"
              style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-xs font-body text-gray-500">{label}</span>
              </div>
              <p className="font-heading font-bold text-lg text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Bottom row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Quick links */}
          <div
            className="rounded-2xl p-5"
            style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="font-heading font-semibold text-sm text-white mb-4">Быстрый доступ</h2>
            <div className="grid grid-cols-4 gap-2">
              {quickLinks.map(({ href, icon: Icon, label, color }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="text-center leading-tight font-body" style={{ color: '#9CA3AF', fontSize: '10px' }}>
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent orders */}
          <div
            className="rounded-2xl p-5"
            style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-sm text-white">Последние заказы</h2>
              <Link href="/profile?tab=overview" className="text-xs font-body text-gray-500 hover:text-purple-400 transition-colors">
                Все →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingBag className="w-8 h-8 mb-2" style={{ color: '#374151' }} />
                <p className="text-xs font-body text-gray-600">Заказов пока нет</p>
                <Link
                  href="/catalog"
                  className="mt-3 text-xs font-body px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(124,58,237,0.15)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.25)' }}
                >
                  В каталог
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentOrders.map(order => {
                  const game    = order.items[0]?.game;
                  const st      = ORDER_STATUS[order.status] ?? { label: order.status, color: '#6B7280' };
                  const dateStr = new Date(order.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' });
                  return (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-white/5"
                      style={{ border: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      {game?.cover ? (
                        <Image
                          src={game.cover} alt={game.title ?? ''}
                          width={36} height={36} unoptimized
                          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: '#1A1A28' }}>
                          <Star className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-body text-white truncate">{game?.title ?? '—'}</p>
                        <p className="text-xs font-body text-gray-600">{dateStr}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className="font-body px-1.5 py-0.5 rounded-md"
                          style={{ background: `${st.color}18`, color: st.color, fontSize: '10px' }}
                        >
                          {st.label}
                        </span>
                        <span className="text-xs font-body text-gray-500">{formatPrice(order.totalPrice)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {user.totalSpent > 0 && (
          <div
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}
          >
            <TrendingUp className="w-5 h-5 flex-shrink-0" style={{ color: '#7C3AED' }} />
            <p className="text-sm font-body text-gray-400">
              Всего потрачено на игры:{' '}
              <span className="font-heading font-bold text-white">{formatPrice(user.totalSpent)}</span>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
