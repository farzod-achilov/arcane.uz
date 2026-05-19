import { products } from './mockData';

/* ── Levels ──────────────────────────────────────────── */
export type LevelName = 'Rookie' | 'Player' | 'Elite' | 'Phantom' | 'Arcane';

export const LEVELS: Record<LevelName, { xpMin: number; xpMax: number; color: string; bg: string; border: string; glow: string }> = {
  Rookie:  { xpMin: 0,     xpMax: 999,   color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.22)', glow: 'rgba(156,163,175,0.15)' },
  Player:  { xpMin: 1000,  xpMax: 4999,  color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  glow: 'rgba(59,130,246,0.18)'  },
  Elite:   { xpMin: 5000,  xpMax: 14999, color: '#7C3AED', bg: 'rgba(124,58,237,0.1)',  border: 'rgba(124,58,237,0.28)',  glow: 'rgba(124,58,237,0.2)'   },
  Phantom: { xpMin: 15000, xpMax: 49999, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.28)',   glow: 'rgba(6,182,212,0.2)'    },
  Arcane:  { xpMin: 50000, xpMax: 999999,color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)',   glow: 'rgba(245,158,11,0.22)'  },
};

export function getLevelFromXp(xp: number): LevelName {
  if (xp >= 50000) return 'Arcane';
  if (xp >= 15000) return 'Phantom';
  if (xp >= 5000)  return 'Elite';
  if (xp >= 1000)  return 'Player';
  return 'Rookie';
}

export function getXpProgress(xp: number) {
  const level    = getLevelFromXp(xp);
  const levelCfg = LEVELS[level];
  const range    = levelCfg.xpMax - levelCfg.xpMin + 1;
  const progress = Math.min(100, Math.round(((xp - levelCfg.xpMin) / range) * 100));
  const xpToNext = levelCfg.xpMax + 1 - xp;
  return { level, progress, xpToNext, levelCfg };
}

/* ── Notification types ──────────────────────────────── */
export type NotifType = 'order' | 'coins' | 'wishlist' | 'event' | 'level' | 'system';

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: number;
  read: boolean;
  href?: string;
}

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1', type: 'order',
    title: 'Заказ #ARC-45231 выполнен',
    body: 'Cyberpunk 2077 — ключ активации отправлен на email',
    time: Date.now() - 1000 * 60 * 25,
    read: false, href: '/dashboard',
  },
  {
    id: 'n2', type: 'coins',
    title: '+249 Arcane Coins',
    body: 'Кэшбэк 1% за покупку Cyberpunk 2077',
    time: Date.now() - 1000 * 60 * 26,
    read: false, href: '/dashboard',
  },
  {
    id: 'n3', type: 'wishlist',
    title: 'Снижение цены в вишлисте',
    body: 'Elden Ring теперь со скидкой 15%',
    time: Date.now() - 1000 * 60 * 60 * 3,
    read: false, href: '/wishlist',
  },
  {
    id: 'n4', type: 'level',
    title: 'Повышение уровня!',
    body: 'Вы достигли уровня Elite. Новые привилегии разблокированы.',
    time: Date.now() - 1000 * 60 * 60 * 24,
    read: true, href: '/dashboard',
  },
  {
    id: 'n5', type: 'event',
    title: 'Летняя распродажа',
    body: 'Скидки до 80% на хиты. Только 3 дня!',
    time: Date.now() - 1000 * 60 * 60 * 48,
    read: true, href: '/deals',
  },
];

/* ── Coins history ───────────────────────────────────── */
export interface CoinsTransaction {
  id: string;
  type: 'earned' | 'spent' | 'bonus';
  amount: number;
  desc: string;
  date: string;
}

export const COINS_HISTORY: CoinsTransaction[] = [
  { id: 'c1', type: 'earned', amount:  249, desc: 'Кэшбэк: Cyberpunk 2077',   date: '2025-05-10' },
  { id: 'c2', type: 'earned', amount:  150, desc: 'Кэшбэк: Call of Duty',     date: '2025-05-06' },
  { id: 'c3', type: 'spent',  amount: -500, desc: 'Скидка на заказ',           date: '2025-05-05' },
  { id: 'c4', type: 'bonus',  amount:  200, desc: 'Бонус ко дню рождения',     date: '2025-05-01' },
  { id: 'c5', type: 'earned', amount:   75, desc: 'Кэшбэк: Forza Horizon',     date: '2025-04-28' },
  { id: 'c6', type: 'bonus',  amount:  500, desc: 'Приветственный бонус',      date: '2025-01-15' },
];

/* ── Achievements ────────────────────────────────────── */
export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_buy',    title: 'Первая покупка',  desc: 'Купил первую игру',        icon: '🛒', earned: true,  earnedDate: '2025-01-20', rarity: 'common' },
  { id: 'coin_100',     title: '100 монет',        desc: 'Накопил 100 Arcane Coins', icon: '⚡', earned: true,  earnedDate: '2025-02-01', rarity: 'common' },
  { id: 'elite_rank',   title: 'Элита',            desc: 'Достиг уровня Elite',      icon: '💎', earned: true,  earnedDate: '2025-03-15', rarity: 'rare'   },
  { id: 'mystery_open', title: 'Открыватель',      desc: 'Открыл Mystery Case',      icon: '🎁', earned: true,  earnedDate: '2025-04-10', rarity: 'rare'   },
  { id: 'big_spender',  title: 'Большой игрок',    desc: 'Потратил 1 000 000 сум',   icon: '💰', earned: false, rarity: 'epic'    },
  { id: 'wishlist_10',  title: 'Список желаний',   desc: '10 игр в вишлисте',        icon: '❤️', earned: false, rarity: 'common'  },
  { id: 'phantom_rank', title: 'Призрак',          desc: 'Достиг уровня Phantom',    icon: '👻', earned: false, rarity: 'epic'    },
  { id: 'arcane_rank',  title: 'Легенда ARCANE',   desc: 'Достиг уровня Arcane',     icon: '⚔️', earned: false, rarity: 'legendary' },
];

/* ── Order history ───────────────────────────────────── */
export interface Order {
  id: string;
  productId: string;
  platform: string;
  price: number;
  date: string;
  status: 'completed' | 'pending' | 'refunded';
  coinsEarned: number;
}

export const ORDER_HISTORY: Order[] = [
  { id: 'ARC-45231', productId: products[0].id, platform: 'PC',  price: 249000, date: '2025-05-10', status: 'completed', coinsEarned: 249 },
  { id: 'ARC-42890', productId: products[2].id, platform: 'PC',  price: 189000, date: '2025-04-25', status: 'completed', coinsEarned: 189 },
  { id: 'ARC-39114', productId: products[4]?.id ?? products[1].id, platform: 'PS5', price: 299000, date: '2025-03-12', status: 'completed', coinsEarned: 299 },
];

/* ── Demo user ───────────────────────────────────────── */
export const DEMO_USER = {
  id: 'usr_001',
  name: 'Алишер К.',
  email: 'demo@arcane.uz',
  telegram: '@alisher_uz' as string | null,
  steamId: null as string | null,
  steamUsername: null as string | null,
  steamAvatar: null as string | null,
  xp: 8750,
  coins: 1250,
  avatar: 'https://picsum.photos/seed/arcaneuser001/200/200',
  joinDate: '2025-01-15',
};
