import { products } from './mockData';

/* ── Levels ──────────────────────────────────────────── */
export type LevelName = 'Rookie' | 'Player' | 'Elite' | 'Phantom' | 'Arcane';

export const LEVELS: Record<LevelName, {
  xpMin: number; xpMax: number;
  color: string; bg: string; border: string; glow: string;
  multiplier: string; perks: string[];
}> = {
  Rookie:  {
    xpMin: 0,     xpMax: 999,
    color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.22)', glow: 'rgba(156,163,175,0.15)',
    multiplier: '1×', perks: ['Базовый кэшбэк 1%', 'Доступ к каталогу'],
  },
  Player:  {
    xpMin: 1000,  xpMax: 4999,
    color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', glow: 'rgba(59,130,246,0.18)',
    multiplier: '1.5×', perks: ['Кэшбэк 1.5%', 'Ранний доступ к продажам'],
  },
  Elite:   {
    xpMin: 5000,  xpMax: 14999,
    color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.28)', glow: 'rgba(124,58,237,0.2)',
    multiplier: '2×', perks: ['Кэшбэк 2%', 'Приоритетная поддержка', 'Эксклюзивные скидки'],
  },
  Phantom: {
    xpMin: 15000, xpMax: 49999,
    color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.28)', glow: 'rgba(6,182,212,0.2)',
    multiplier: '2.5×', perks: ['Кэшбэк 2.5%', 'Mystery Box каждый месяц', 'VIP поддержка 24/7'],
  },
  Arcane:  {
    xpMin: 50000, xpMax: 999999,
    color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', glow: 'rgba(245,158,11,0.22)',
    multiplier: '3×', perks: ['Кэшбэк 3%', 'Эксклюзивные ивенты', 'Личный менеджер', 'Ранний доступ'],
  },
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
export type NotifType = 'order' | 'coins' | 'wishlist' | 'event' | 'level' | 'system' | 'preorder';

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
    body: 'Elden Ring теперь со скидкой 15% — сэкономьте 44 850 сум',
    time: Date.now() - 1000 * 60 * 60 * 3,
    read: false, href: '/wishlist',
  },
  {
    id: 'n4', type: 'preorder',
    title: 'GTA VI — предзаказ открыт!',
    body: 'Откройте предзаказ до 30 мая и получите +500 монет',
    time: Date.now() - 1000 * 60 * 60 * 5,
    read: false, href: '/product/gta-vi',
  },
  {
    id: 'n5', type: 'level',
    title: 'Повышение уровня!',
    body: 'Вы достигли уровня Elite. Кэшбэк увеличен до 2×',
    time: Date.now() - 1000 * 60 * 60 * 24,
    read: true, href: '/dashboard',
  },
  {
    id: 'n6', type: 'event',
    title: 'Летняя распродажа началась 🔥',
    body: 'Скидки до 80% на топовые игры. Только 3 дня!',
    time: Date.now() - 1000 * 60 * 60 * 48,
    read: true, href: '/deals',
  },
  {
    id: 'n7', type: 'coins',
    title: 'Сезонный бонус 2×',
    body: 'Все покупки в мае дают двойные Arcane Coins',
    time: Date.now() - 1000 * 60 * 60 * 72,
    read: true, href: '/dashboard',
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
  { id: 'c1', type: 'earned', amount:  249, desc: 'Кэшбэк: Cyberpunk 2077',       date: '2025-05-10' },
  { id: 'c2', type: 'bonus',  amount:  500, desc: 'Сезонный бонус × 2 (Май)',      date: '2025-05-08' },
  { id: 'c3', type: 'earned', amount:  189, desc: 'Кэшбэк: Call of Duty MW3',      date: '2025-05-06' },
  { id: 'c4', type: 'spent',  amount: -500, desc: 'Скидка на заказ #ARC-42890',    date: '2025-05-05' },
  { id: 'c5', type: 'bonus',  amount:  200, desc: 'Бонус за привязку Telegram',    date: '2025-05-03' },
  { id: 'c6', type: 'earned', amount:   75, desc: 'Кэшбэк: Forza Horizon 5',       date: '2025-04-28' },
  { id: 'c7', type: 'bonus',  amount:  150, desc: 'Бонус за отзыв',                date: '2025-04-20' },
  { id: 'c8', type: 'earned', amount:  299, desc: "Кэшбэк: Baldur's Gate 3",       date: '2025-03-12' },
  { id: 'c9', type: 'spent',  amount: -200, desc: 'Скидка на заказ #ARC-39114',    date: '2025-03-10' },
  { id: 'c10',type: 'bonus',  amount:  500, desc: 'Приветственный бонус',           date: '2025-01-15' },
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
  progress?: number;
  progressMax?: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_buy',    title: 'Первая покупка',   desc: 'Купил первую игру',              icon: '🛒', earned: true,  earnedDate: '2025-01-20', rarity: 'common'    },
  { id: 'coin_100',     title: '100 монет',         desc: 'Накопил 100 Arcane Coins',       icon: '⚡', earned: true,  earnedDate: '2025-02-01', rarity: 'common'    },
  { id: 'elite_rank',   title: 'Элита',             desc: 'Достиг уровня Elite',            icon: '💎', earned: true,  earnedDate: '2025-03-15', rarity: 'rare'      },
  { id: 'mystery_open', title: 'Открыватель',       desc: 'Открыл Mystery Case',            icon: '🎁', earned: true,  earnedDate: '2025-04-10', rarity: 'rare'      },
  { id: 'tg_linked',    title: 'Telegram Pro',      desc: 'Привязал Telegram к аккаунту',   icon: '📱', earned: true,  earnedDate: '2025-05-03', rarity: 'common'    },
  { id: 'wishlist_5',   title: 'Коллекционер',      desc: '5 игр в вишлисте',               icon: '❤️', earned: true,  earnedDate: '2025-05-06', rarity: 'common'    },
  { id: 'big_spender',  title: 'Большой игрок',     desc: 'Потратил 1 000 000 сум',         icon: '💰', earned: false, rarity: 'epic',     progress: 737000, progressMax: 1000000 },
  { id: 'wishlist_10',  title: 'Список желаний',    desc: '10 игр в вишлисте',              icon: '💜', earned: false, rarity: 'common',   progress: 6, progressMax: 10 },
  { id: 'phantom_rank', title: 'Призрак',           desc: 'Достиг уровня Phantom',          icon: '👻', earned: false, rarity: 'epic',     progress: 8750, progressMax: 15000 },
  { id: 'coin_5000',    title: 'Копилка',           desc: 'Накопил 5 000 Arcane Coins',     icon: '🪙', earned: false, rarity: 'rare',     progress: 1250, progressMax: 5000 },
  { id: 'arcane_rank',  title: 'Легенда ARCANE',    desc: 'Достиг уровня Arcane',           icon: '⚔️', earned: false, rarity: 'legendary', progress: 8750, progressMax: 50000 },
  { id: 'preorder_pro', title: 'Провидец',          desc: 'Купил 3 предзаказа',             icon: '🔮', earned: false, rarity: 'rare',     progress: 1, progressMax: 3 },
];

/* ── Order history ───────────────────────────────────── */
export type OrderStatus = 'completed' | 'pending' | 'processing' | 'delivered';

export interface Order {
  id: string;
  productId: string;
  platform: string;
  price: number;
  date: string;
  status: OrderStatus;
  coinsEarned: number;
  deliveryType: 'instant' | 'email';
}

export const ORDER_HISTORY: Order[] = [
  { id: 'ARC-45231', productId: products[0].id, platform: 'Steam',   price: 249000, date: '10 мая 2025',     status: 'completed',  coinsEarned: 249, deliveryType: 'instant' },
  { id: 'ARC-44712', productId: products[4].id, platform: 'Steam',   price: 279000, date: '28 апр. 2025',    status: 'completed',  coinsEarned: 279, deliveryType: 'instant' },
  { id: 'ARC-42890', productId: products[2].id, platform: 'Steam',   price: 149000, date: '25 апр. 2025',    status: 'completed',  coinsEarned: 149, deliveryType: 'instant' },
  { id: 'ARC-41055', productId: products[7].id, platform: 'Steam',   price: 189000, date: '10 апр. 2025',    status: 'delivered',  coinsEarned: 189, deliveryType: 'email'   },
  { id: 'ARC-39114', productId: products[1].id, platform: 'PS5',     price: 299000, date: '12 мар. 2025',    status: 'completed',  coinsEarned: 299, deliveryType: 'instant' },
  { id: 'ARC-37801', productId: products[11].id,platform: 'Steam',   price: 229000, date: '28 янв. 2025',    status: 'completed',  coinsEarned: 229, deliveryType: 'instant' },
];

export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; border: string }> = {
  pending:    { label: 'Ожидание',  color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.22)'  },
  processing: { label: 'Обработка', color: '#06B6D4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.22)'   },
  delivered:  { label: 'Доставлен', color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',  border: 'rgba(124,58,237,0.22)'  },
  completed:  { label: 'Выполнен',  color: '#22C55E', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)'    },
};

/* ── Activity feed ───────────────────────────────────── */
export interface ActivityItem {
  id: string;
  type: 'purchase' | 'wishlist' | 'level' | 'coins' | 'achievement';
  title: string;
  desc: string;
  icon: string;
  time: number;
  color: string;
}

export const ACTIVITY_FEED: ActivityItem[] = [
  { id: 'a1', type: 'purchase',    title: 'Куплен Cyberpunk 2077',       desc: 'Steam · 249 000 сум',           icon: '🛒', time: Date.now() - 1000 * 60 * 25,        color: '#7C3AED' },
  { id: 'a2', type: 'coins',       title: '+249 Arcane Coins',            desc: 'Кэшбэк за покупку',             icon: '⚡', time: Date.now() - 1000 * 60 * 26,        color: '#F59E0B' },
  { id: 'a3', type: 'wishlist',    title: "Добавлен в вишлист",           desc: "Baldur's Gate 3",               icon: '❤️', time: Date.now() - 1000 * 60 * 60 * 2,   color: '#EF4444' },
  { id: 'a4', type: 'achievement', title: 'Достижение разблокировано',    desc: 'Telegram Pro',                  icon: '🏆', time: Date.now() - 1000 * 60 * 60 * 5,   color: '#06B6D4' },
  { id: 'a5', type: 'purchase',    title: "Куплен Baldur's Gate 3",       desc: 'Steam · 279 000 сум',           icon: '🛒', time: Date.now() - 1000 * 60 * 60 * 24,  color: '#7C3AED' },
  { id: 'a6', type: 'level',       title: 'Повышение уровня — Elite',     desc: '8 750 XP получено',             icon: '💎', time: Date.now() - 1000 * 60 * 60 * 48,  color: '#7C3AED' },
  { id: 'a7', type: 'coins',       title: '+500 Бонус Telegram',          desc: 'За привязку аккаунта',          icon: '⚡', time: Date.now() - 1000 * 60 * 60 * 50,  color: '#F59E0B' },
  { id: 'a8', type: 'purchase',    title: 'Куплен GTA V',                 desc: 'Steam · 149 000 сум',           icon: '🛒', time: Date.now() - 1000 * 60 * 60 * 72,  color: '#7C3AED' },
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
