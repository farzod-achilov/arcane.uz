import type {
  AdminOrder, AdminUser, SupportTicket,
  AdminProduct, DiscountItem, CaseItem, AnalyticsDay,
} from './adminTypes';
import { products } from '@/lib/mockData';

/* ── Admin Orders ────────────────────────────────────── */
export const ADMIN_ORDERS: AdminOrder[] = [
  { id: 'ARC-45231', productId: 'cyberpunk-2077', productTitle: 'Cyberpunk 2077', productImage: 'https://picsum.photos/seed/cyber2077/400/550', userId: 'u1', userName: 'Бобур Хасанов',   userEmail: 'bobur@mail.uz',   userTelegram: '@bobur_uz',    platform: 'Steam',      price: 249000, status: 'completed',  paymentMethod: 'Payme',  deliveryType: 'instant',            coinsEarned: 249, createdAt: '2025-05-10 14:23' },
  { id: 'ARC-45230', productId: 'elden-ring',     productTitle: 'Elden Ring',     productImage: 'https://picsum.photos/seed/eldenring/400/550', userId: 'u2', userName: 'Камила Юсупова',  userEmail: 'kamila@mail.ru',  userTelegram: '@kamila_k',    platform: 'Steam',      price: 299000, status: 'completed',  paymentMethod: 'Click',  deliveryType: 'instant',            coinsEarned: 299, createdAt: '2025-05-10 11:05' },
  { id: 'ARC-45229', productId: 'gta-v',          productTitle: 'GTA V',          productImage: 'https://picsum.photos/seed/gtav_cover/400/550', userId: 'u3', userName: 'Алишер Каримов', userEmail: 'alisher@gmail.com', userTelegram: '@alisher_kz',  platform: 'Steam',     price: 149000, status: 'processing', paymentMethod: 'UzCard', deliveryType: 'steam_gift',         coinsEarned: 149, createdAt: '2025-05-10 09:44' },
  { id: 'ARC-45228', productId: 'black-myth-wukong', productTitle: 'Black Myth: Wukong', productImage: 'https://picsum.photos/seed/wukong_cover/400/550', userId: 'u4', userName: 'Нилуфар Рашидова', userEmail: 'nilufar@inbox.uz', platform: 'Steam', price: 359000, status: 'delivered', paymentMethod: 'HUMO', deliveryType: 'instant', coinsEarned: 359, createdAt: '2025-05-09 18:12' },
  { id: 'ARC-45227', productId: 'fc-26',          productTitle: 'FC 26',           productImage: 'https://picsum.photos/seed/fc26_cover/400/550',  userId: 'u5', userName: 'Жавлон Мирзаев',  userEmail: 'javlon@yandex.ru', userTelegram: '@javlon_m',   platform: 'EA App',    price: 399000, status: 'pending',    paymentMethod: 'Uzum',   deliveryType: 'telegram_activation', coinsEarned: 0,   createdAt: '2025-05-09 15:33' },
  { id: 'ARC-45226', productId: 'gta-vi',         productTitle: 'GTA VI',          productImage: 'https://picsum.photos/seed/gtavi/400/550',        userId: 'u6', userName: 'Дилноза Турсунова',userEmail: 'dilnoza@mail.uz',  userTelegram: '@dilnoza_t',  platform: 'PS5',       price: 479000, status: 'paid',       paymentMethod: 'Payme',  deliveryType: 'manual_delivery',    coinsEarned: 0,   createdAt: '2025-05-09 12:20' },
  { id: 'ARC-45225', productId: 'rdr2',           productTitle: 'Red Dead 2',      productImage: 'https://picsum.photos/seed/rdr2_cover/400/550',   userId: 'u7', userName: 'Санжар Бекмуратов', userEmail: 'sanjarbek@gmail.com',                          platform: 'Steam',     price: 219000, status: 'completed',  paymentMethod: 'Click',  deliveryType: 'steam_gift',         coinsEarned: 219, createdAt: '2025-05-08 20:45' },
  { id: 'ARC-45224', productId: 'baldurs-gate-3', productTitle: "Baldur's Gate 3", productImage: 'https://picsum.photos/seed/bg3/400/550',          userId: 'u8', userName: 'Малика Холматова',  userEmail: 'malika@inbox.ru',  userTelegram: '@malika_ho',  platform: 'PS5',       price: 279000, status: 'completed',  paymentMethod: 'UzCard', deliveryType: 'instant',            coinsEarned: 279, createdAt: '2025-05-08 16:10' },
  { id: 'ARC-45223', productId: 'resident-evil-4',productTitle: 'Resident Evil 4', productImage: 'https://picsum.photos/seed/re4/400/550',          userId: 'u9', userName: 'Темур Абдуллаев',  userEmail: 'temur@mail.uz',    userTelegram: '@temur_abdullayev', platform: 'Steam',  price: 199000, status: 'completed',  paymentMethod: 'HUMO',   deliveryType: 'instant',            coinsEarned: 199, createdAt: '2025-05-07 10:30' },
  { id: 'ARC-45222', productId: 'forza-horizon-5',productTitle: 'Forza Horizon 5', productImage: 'https://picsum.photos/seed/forza5/400/550',       userId: 'u10',userName: 'Озода Юнусова',    userEmail: 'ozoda@gmail.com',                               platform: 'Steam',     price: 229000, status: 'refunded',   paymentMethod: 'Payme',  deliveryType: 'instant',            coinsEarned: 0,   createdAt: '2025-05-06 08:55' },
  { id: 'ARC-45221', productId: 'cod-mw3',        productTitle: 'CoD MW3',         productImage: 'https://picsum.photos/seed/codmw3/400/550',       userId: 'u1', userName: 'Бобур Хасанов',   userEmail: 'bobur@mail.uz',    userTelegram: '@bobur_uz',   platform: 'Steam',     price: 189000, status: 'completed',  paymentMethod: 'Click',  deliveryType: 'instant',            coinsEarned: 189, createdAt: '2025-05-05 19:00' },
  { id: 'ARC-45220', productId: 'fc-25',          productTitle: 'FC 25',           productImage: 'https://picsum.photos/seed/fc25_cover/400/550',   userId: 'u11',userName: 'Шахло Назарова',   userEmail: 'shahlo@yandex.uz',                              platform: 'PS5',       price: 219000, status: 'delivered',  paymentMethod: 'Uzum',   deliveryType: 'instant',            coinsEarned: 219, createdAt: '2025-05-04 14:40' },
];

/* ── Admin Users ─────────────────────────────────────── */
export const ADMIN_USERS: AdminUser[] = [
  { id: 'u1',  name: 'Бобур Хасанов',      email: 'bobur@mail.uz',         avatar: 'https://picsum.photos/seed/u1/80/80',  level: 'Elite',   xp: 8750,  coins: 1250, telegram: '@bobur_uz',    steamUsername: 'bobur_steam', totalOrders: 12, totalSpent: 2840000, joinDate: '2025-01-15', lastActive: '2025-05-10' },
  { id: 'u2',  name: 'Камила Юсупова',     email: 'kamila@mail.ru',         avatar: 'https://picsum.photos/seed/u2/80/80',  level: 'Player',  xp: 2100,  coins: 430,  telegram: '@kamila_k',                          totalOrders: 4,  totalSpent: 1160000, joinDate: '2025-02-20', lastActive: '2025-05-10' },
  { id: 'u3',  name: 'Алишер Каримов',     email: 'alisher@gmail.com',      avatar: 'https://picsum.photos/seed/u3/80/80',  level: 'Phantom', xp: 22400, coins: 3600, telegram: '@alisher_kz',                         totalOrders: 28, totalSpent: 7200000, joinDate: '2024-12-01', lastActive: '2025-05-09' },
  { id: 'u4',  name: 'Нилуфар Рашидова',   email: 'nilufar@inbox.uz',       avatar: 'https://picsum.photos/seed/u4/80/80',  level: 'Player',  xp: 1800,  coins: 290,                                                   totalOrders: 3,  totalSpent: 840000,  joinDate: '2025-03-10', lastActive: '2025-05-09' },
  { id: 'u5',  name: 'Жавлон Мирзаев',     email: 'javlon@yandex.ru',       avatar: 'https://picsum.photos/seed/u5/80/80',  level: 'Elite',   xp: 7200,  coins: 980,  telegram: '@javlon_m',    steamUsername: 'javlon_m',   totalOrders: 9,  totalSpent: 2100000, joinDate: '2025-01-28', lastActive: '2025-05-09' },
  { id: 'u6',  name: 'Дилноза Турсунова',  email: 'dilnoza@mail.uz',        avatar: 'https://picsum.photos/seed/u6/80/80',  level: 'Rookie',  xp: 479,   coins: 50,   telegram: '@dilnoza_t',                          totalOrders: 1,  totalSpent: 479000,  joinDate: '2025-05-09', lastActive: '2025-05-09' },
  { id: 'u7',  name: 'Санжар Бекмуратов',  email: 'sanjarbek@gmail.com',    avatar: 'https://picsum.photos/seed/u7/80/80',  level: 'Player',  xp: 3100,  coins: 540,                                                   totalOrders: 5,  totalSpent: 1340000, joinDate: '2025-02-14', lastActive: '2025-05-08' },
  { id: 'u8',  name: 'Малика Холматова',   email: 'malika@inbox.ru',        avatar: 'https://picsum.photos/seed/u8/80/80',  level: 'Elite',   xp: 9400,  coins: 1650, telegram: '@malika_ho',                          totalOrders: 14, totalSpent: 3200000, joinDate: '2024-11-20', lastActive: '2025-05-08' },
  { id: 'u9',  name: 'Темур Абдуллаев',    email: 'temur@mail.uz',          avatar: 'https://picsum.photos/seed/u9/80/80',  level: 'Arcane',  xp: 63000, coins: 8200, telegram: '@temur_abdullayev', steamUsername: 'temur_uz', totalOrders: 47, totalSpent: 15800000, joinDate: '2024-09-01', lastActive: '2025-05-07' },
  { id: 'u10', name: 'Озода Юнусова',      email: 'ozoda@gmail.com',        avatar: 'https://picsum.photos/seed/u10/80/80', level: 'Rookie',  xp: 229,   coins: 0,                                                     totalOrders: 1,  totalSpent: 229000,  joinDate: '2025-04-30', lastActive: '2025-05-06' },
  { id: 'u11', name: 'Шахло Назарова',     email: 'shahlo@yandex.uz',       avatar: 'https://picsum.photos/seed/u11/80/80', level: 'Player',  xp: 2800,  coins: 370,                                                   totalOrders: 4,  totalSpent: 910000,  joinDate: '2025-03-05', lastActive: '2025-05-04' },
];

/* ── Support Tickets ─────────────────────────────────── */
export const ADMIN_TICKETS: SupportTicket[] = [
  { id: 'TKT-001', userId: 'u6', userName: 'Дилноза Турсунова',  userEmail: 'dilnoza@mail.uz',    userTelegram: '@dilnoza_t',         subject: 'Ключ не активируется',       message: 'Купила GTA VI предзаказ, оплата прошла но ключа нет. Заказ #ARC-45226',  status: 'open',    priority: 'urgent', orderNumber: 'ARC-45226', category: 'activation', createdAt: '2025-05-09 13:00', updatedAt: '2025-05-09 13:00' },
  { id: 'TKT-002', userId: 'u5', userName: 'Жавлон Мирзаев',     userEmail: 'javlon@yandex.ru',   userTelegram: '@javlon_m',          subject: 'Когда Telegram-активация FC 26?', message: 'Оплатил FC 26, жду менеджера в Telegram уже 40 минут',               status: 'pending', priority: 'high',   orderNumber: 'ARC-45227', category: 'delivery',   createdAt: '2025-05-09 16:00', updatedAt: '2025-05-09 16:15' },
  { id: 'TKT-003', userId: 'u10', userName: 'Озода Юнусова',      userEmail: 'ozoda@gmail.com',                                        subject: 'Возврат средств за Forza',    message: 'Купила Forza Horizon 5, ключ не работает на моём аккаунте Xbox. Прошу возврат.', status: 'open', priority: 'high', orderNumber: 'ARC-45222', category: 'refund',   createdAt: '2025-05-06 09:30', updatedAt: '2025-05-06 09:30' },
  { id: 'TKT-004', userId: 'u4', userName: 'Нилуфар Рашидова',   userEmail: 'nilufar@inbox.uz',                                       subject: 'Вопрос по Arcane Coins',     message: 'Купила Black Myth но монеты не начислились. Заказ ARC-45228.',          status: 'open',    priority: 'medium', orderNumber: 'ARC-45228', category: 'coins',      createdAt: '2025-05-09 19:00', updatedAt: '2025-05-09 19:00' },
  { id: 'TKT-005', userId: 'u3', userName: 'Алишер Каримов',     userEmail: 'alisher@gmail.com',  userTelegram: '@alisher_kz',        subject: 'Ошибка при оплате Click',    message: 'Попытался оплатить через Click, ошибка транзакции. Деньги списались.',  status: 'pending', priority: 'urgent', category: 'payment',    createdAt: '2025-05-09 10:00', updatedAt: '2025-05-09 10:30' },
  { id: 'TKT-006', userId: 'u2', userName: 'Камила Юсупова',     userEmail: 'kamila@mail.ru',     userTelegram: '@kamila_k',          subject: 'Как получить Steam Gift?',   message: 'Купила GTA V — написано Steam Gift. Как добавить вас в друзья?',        status: 'resolved', priority: 'low',   orderNumber: 'ARC-45229', category: 'delivery',   createdAt: '2025-05-10 11:30', updatedAt: '2025-05-10 11:45' },
  { id: 'TKT-007', userId: 'u7', userName: 'Санжар Бекмуратов',  userEmail: 'sanjarbek@gmail.com',                                    subject: 'RDR2 Steam Gift принято',    message: 'Спасибо! Получил подарок в Steam, игра в библиотеке.',                  status: 'resolved', priority: 'low',  orderNumber: 'ARC-45225', category: 'other',      createdAt: '2025-05-08 21:00', updatedAt: '2025-05-08 21:10' },
];

/* ── Admin Products ──────────────────────────────────── */
export const ADMIN_PRODUCTS: AdminProduct[] = products.map((p, i) => ({
  id: p.id,
  title: p.title,
  subtitle: p.subtitle,
  image: p.image,
  category: p.category,
  platform: p.platform,
  price: p.price,
  originalPrice: p.originalPrice,
  discount: p.discount,
  deliveryType: p.deliveryType,
  featured: p.featured ?? false,
  preorder: p.preorder ?? false,
  inStock: p.inStock,
  badge: p.badge,
  totalSales: Math.floor(Math.random() * 200 + 10),
  totalRevenue: Math.floor(Math.random() * 20000000 + 1000000),
  rating: p.rating,
}));

/* ── Discounts ───────────────────────────────────────── */
export const ADMIN_DISCOUNTS: DiscountItem[] = [
  { id: 'd1', productId: 'cyberpunk-2077', productTitle: 'Cyberpunk 2077', originalPrice: 349000, discountPct: 29, active: true,  featured: true,  startsAt: '2025-05-01', endsAt: '2025-05-15', type: 'seasonal' },
  { id: 'd2', productId: 'cod-mw3',        productTitle: 'Call of Duty MW3', originalPrice: 249000, discountPct: 24, active: true,  featured: false, startsAt: '2025-05-01', endsAt: '2025-05-20', type: 'flash'    },
  { id: 'd3', productId: 'gta-v',          productTitle: 'Grand Theft Auto V', originalPrice: 189000, discountPct: 21, active: true,  featured: true,  startsAt: '2025-05-05', endsAt: '2025-05-31', type: 'seasonal' },
  { id: 'd4', productId: 'resident-evil-4',productTitle: 'Resident Evil 4',  originalPrice: 249000, discountPct: 20, active: true,  featured: false, startsAt: '2025-05-01', endsAt: '2025-05-25', type: 'scheduled'},
  { id: 'd5', productId: 'baldurs-gate-3', productTitle: "Baldur's Gate 3", originalPrice: 329000, discountPct: 15, active: true,  featured: false, startsAt: '2025-05-01', endsAt: '2025-05-30', type: 'scheduled'},
  { id: 'd6', productId: 'elden-ring',     productTitle: 'Elden Ring',      originalPrice: 349000, discountPct: 15, active: false, featured: false,                                                  type: 'flash'    },
];

/* ── Mystery Cases ───────────────────────────────────── */
export const ADMIN_CASES: CaseItem[] = [
  { id: 'silver', title: 'Серебряный Кейс', price: 49000,  rarity: 'silver', totalOpened: 842,  totalRevenue: 41258000, featured: false, rewards: ['Случайная игра', 'Скидка 20%', 'Arcane Coins x50'],  dropChance: { game: 30, discount: 50, coins: 20 } },
  { id: 'gold',   title: 'Золотой Кейс',    price: 99000,  rarity: 'gold',   totalOpened: 421,  totalRevenue: 41679000, featured: true,  rewards: ['AAA игра', 'DLC бонус', 'Arcane Coins x150'],        dropChance: { game: 45, dlc: 35, coins: 20 } },
  { id: 'arcane', title: 'Arcane Кейс',     price: 199000, rarity: 'arcane', totalOpened: 128,  totalRevenue: 25472000, featured: true,  rewards: ['Эксклюзивная игра', 'Годовой пропуск', 'Arcane Coins x500'], dropChance: { exclusive: 25, pass: 45, coins: 30 } },
];

/* ── Analytics Data ──────────────────────────────────── */
export const ANALYTICS_DAILY: AnalyticsDay[] = [
  { date: '04 мая', revenue: 2140000, orders: 8,  newUsers: 3,  coinsEarned: 2140 },
  { date: '05 мая', revenue: 1890000, orders: 6,  newUsers: 2,  coinsEarned: 1890 },
  { date: '06 мая', revenue: 3250000, orders: 11, newUsers: 5,  coinsEarned: 3250 },
  { date: '07 мая', revenue: 2760000, orders: 9,  newUsers: 4,  coinsEarned: 2760 },
  { date: '08 мая', revenue: 4120000, orders: 14, newUsers: 7,  coinsEarned: 4120 },
  { date: '09 мая', revenue: 5480000, orders: 18, newUsers: 9,  coinsEarned: 5480 },
  { date: '10 мая', revenue: 6390000, orders: 22, newUsers: 12, coinsEarned: 6390 },
];

/* ── Summary Stats ───────────────────────────────────── */
export const ADMIN_STATS = {
  totalRevenue:    26030000,
  totalOrders:     88,
  totalUsers:      11,
  activeProducts:  12,
  openTickets:     4,
  totalCoinsEarned: 28750,
  weekRevenueDelta: 18.4,
  weekOrdersDelta:  22.1,
  weekUsersDelta:   9.6,
};

/* ── Coins config ────────────────────────────────────── */
export const COINS_CONFIG = {
  cashbackByLevel: { Rookie: 1, Player: 1.5, Elite: 2, Phantom: 2.5, Arcane: 3 },
  multiplierByLevel: { Rookie: 1, Player: 1.5, Elite: 2, Phantom: 2.5, Arcane: 3 },
  seasonalBonus: true,
  seasonalMultiplier: 2,
  welcomeBonus: 500,
  referralBonus: 250,
};
