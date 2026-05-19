/**
 * All bot message templates.
 * Uses Telegram HTML parse mode.
 * Keep messages short, punchy, gaming-flavoured.
 */

import type { TelegramUser, Order } from '../types/index';
import { config } from '../config/index';

const LINE = '─────────────────────';

const LEVEL_EMOJI: Record<string, string> = {
  Rookie:  '🔰',
  Player:  '⚡',
  Elite:   '💎',
  Phantom: '👻',
  Arcane:  '⚔️',
};

function coins(n: number) { return n.toLocaleString('ru'); }
function price(n: number) { return `${n.toLocaleString('ru')} сум`; }

/* ════════════════════════════════════════════════
   AUTH / LINKING
════════════════════════════════════════════════ */

export const tplWelcomeNew = (firstName: string) => `\
🎮 <b>ARCANE.UZ</b>
${LINE}

Привет, <b>${firstName}</b>!

Добро пожаловать в премиальный игровой магазин Узбекистана.

Чтобы получить уведомления о заказах, монетах и акциях — подключи свой аккаунт ARCANE.UZ.

<i>Нажми кнопку ниже и следуй инструкции на сайте.</i>

${LINE}
<code>t.me/${config.bot.username}</code>`;

export const tplWelcomeBack = (user: TelegramUser) => `\
🎮 <b>ARCANE.UZ</b>
${LINE}

С возвращением, <b>${user.userName}</b>!

${LEVEL_EMOJI[user.userName] ?? '💎'} <b>Уровень:</b> Elite
🪙 <b>Монеты:</b> <code>${coins(user.totalCoinsEarned)}</code>

Выбери раздел ниже:`;

export const tplLinkedSuccess = (userName: string) => `\
✅ <b>АККАУНТ ПОДКЛЮЧЁН</b>
${LINE}

Твой ARCANE.UZ аккаунт успешно привязан!

👤 <b>${userName}</b>

Теперь ты будешь получать:
• 📦 Статус заказов
• 🪙 Начисления монет
• 🔥 Горячие скидки
• 🎁 Ежедневные награды

${LINE}
<i>Добро пожаловать в экосистему ARCANE</i> 🚀`;

export const tplLinkError = () => `\
❌ <b>ОШИБКА ПРИВЯЗКИ</b>
${LINE}

Токен недействителен или истёк.

Пожалуйста, сгенерируй новую ссылку на сайте ARCANE.UZ в разделе <b>Настройки → Telegram</b>.

${LINE}
<a href="https://arcane.uz/settings">Перейти в настройки</a>`;

export const tplAlreadyLinked = (user: TelegramUser) => `\
ℹ️ <b>УЖЕ ПОДКЛЮЧЕНО</b>
${LINE}

Этот Telegram уже привязан к аккаунту <b>${user.userName}</b>.

Привязан: <code>${user.linkedAt.toLocaleDateString('ru')}</code>`;

/* ════════════════════════════════════════════════
   PROFILE
════════════════════════════════════════════════ */

export const tplProfile = (user: TelegramUser, orderCount: number, level: string) => `\
👤 <b>ПРОФИЛЬ ИГРОКА</b>
${LINE}

🏷 <b>Имя:</b> ${user.userName}
${LEVEL_EMOJI[level] ?? '💎'} <b>Уровень:</b> ${level}

📦 <b>Заказов:</b> ${orderCount}
🪙 <b>Монет заработано:</b> <code>${coins(user.totalCoinsEarned)}</code>
👥 <b>Приглашено игроков:</b> ${user.totalReferrals}
🔥 <b>Серия наград:</b> ${user.rewardStreak} дней

${LINE}
📅 С нами с <code>${user.linkedAt.toLocaleDateString('ru')}</code>`;

/* ════════════════════════════════════════════════
   ORDERS
════════════════════════════════════════════════ */

const STATUS_LABEL: Record<Order['status'], string> = {
  pending:    '⏳ Ожидание',
  processing: '⚙️ Обработка',
  delivered:  '⚡ Доставлено',
  completed:  '✅ Завершён',
};

export const tplOrders = (orders: Order[]) => {
  if (orders.length === 0) {
    return `📦 <b>МОИ ЗАКАЗЫ</b>\n${LINE}\n\nЗаказов пока нет.\n\nПерейди в каталог и выбери игру! 🎮`;
  }
  const lines = orders.map(o =>
    `📦 <b>#${o.id}</b>\n` +
    `🎮 ${o.gameTitle} · <code>${o.platform}</code>\n` +
    `${STATUS_LABEL[o.status]}  · ${price(o.price)}\n` +
    `🪙 +${coins(o.coinsEarned)} монет · ${o.date}`,
  ).join(`\n${LINE}\n`);

  return `📦 <b>МОИ ЗАКАЗЫ</b>\n${LINE}\n\n${lines}`;
};

/* ════════════════════════════════════════════════
   COINS
════════════════════════════════════════════════ */

export const tplCoins = (balance: number, earned: number, level: string) => {
  const multiplier: Record<string, string> = {
    Rookie: '1×', Player: '1.5×', Elite: '2×', Phantom: '2.5×', Arcane: '3×',
  };
  return `\
🪙 <b>ARCANE COINS</b>
${LINE}

💰 <b>Баланс:</b> <code>${coins(balance)}</code>
📈 <b>Всего заработано:</b> <code>${coins(earned)}</code>

${LEVEL_EMOJI[level] ?? '💎'} <b>Уровень ${level}</b>
⚡ <b>Множитель:</b> ${multiplier[level] ?? '1×'}

${LINE}
Монеты начисляются автоматически с каждой покупки.
Использовать как скидку можно на сайте при оформлении заказа.`;
};

/* ════════════════════════════════════════════════
   WISHLIST
════════════════════════════════════════════════ */

export const tplWishlist = (items: Array<{ title: string; price: number; discount?: number }>) => {
  if (items.length === 0) {
    return `❤️ <b>ВИШЛИСТ</b>\n${LINE}\n\nВишлист пуст.\n\nДобавляй игры на сайте нажатием ❤️`;
  }
  const lines = items.map((g, i) => {
    const discountStr = g.discount ? `  🔥 <b>-${g.discount}%</b>` : '';
    return `${i + 1}. 🎮 <b>${g.title}</b>\n   ${price(g.price)}${discountStr}`;
  }).join('\n\n');

  return `❤️ <b>ВИШЛИСТ</b> (${items.length})\n${LINE}\n\n${lines}\n\n${LINE}\n<i>Ты получишь уведомление при снижении цены</i>`;
};

/* ════════════════════════════════════════════════
   REWARDS
════════════════════════════════════════════════ */

const DAY_REWARDS = [50, 75, 100, 125, 150, 175, 300];

export const tplRewards = (streak: number, canClaim: boolean, lastClaim: Date | null) => {
  const dayIdx = Math.min(streak % 7, 6);
  const todayReward = DAY_REWARDS[dayIdx];
  const nextReset = lastClaim
    ? new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
    : null;

  const calendar = DAY_REWARDS.map((r, i) => {
    const done = i < streak % 7;
    const today = i === dayIdx;
    if (done)  return `✅ День ${i + 1}: +${r}`;
    if (today) return `🎁 <b>День ${i + 1}: +${r}</b> ← сегодня`;
    return `⬜ День ${i + 1}: +${r}`;
  }).join('\n');

  const status = canClaim
    ? `\n🎁 <b>Награда готова! Нажми кнопку ниже.</b>`
    : `\n⏳ Следующая награда в ${nextReset ?? '24:00'}`;

  return `\
🎁 <b>ЕЖЕДНЕВНЫЕ НАГРАДЫ</b>
${LINE}

🔥 <b>Серия:</b> ${streak} дней

${calendar}

${LINE}
${status}`;
};

export const tplRewardClaimed = (amount: number, streak: number) => `\
🎁 <b>НАГРАДА ПОЛУЧЕНА!</b>
${LINE}

🪙 <b>+${amount} Arcane Coins</b>

🔥 Серия: <b>${streak} дней</b>
${streak % 7 === 0 ? '\n🏆 <b>БОНУС ЗА НЕДЕЛЮ!</b>\n' : ''}
${LINE}
Возвращайся завтра за следующей наградой!`;

/* ════════════════════════════════════════════════
   SUPPORT
════════════════════════════════════════════════ */

export const tplSupport = () => `\
🆘 <b>ПОДДЕРЖКА ARCANE.UZ</b>
${LINE}

Чем можем помочь?

Среднее время ответа: <b>&lt; 5 минут</b>
Режим работы: <b>24/7</b>

${LINE}
Выбери категорию обращения:`;

export const tplSupportTicket = (category: string, userName: string) => `\
🎫 <b>ОБРАЩЕНИЕ СОЗДАНО</b>
${LINE}

Категория: <b>${category}</b>
Клиент: <b>${userName}</b>

Менеджер ответит в этом чате в течение 5 минут.

${LINE}
<i>Опиши проблему следующим сообщением</i> 👇`;

/* ════════════════════════════════════════════════
   REFERRAL
════════════════════════════════════════════════ */

export const tplReferral = (user: TelegramUser) => `\
👥 <b>РЕФЕРАЛЬНАЯ ПРОГРАММА</b>
${LINE}

Твоя ссылка:
<code>t.me/${config.bot.username}?start=ref_${user.referralCode}</code>

🎁 <b>За каждого друга:</b>
• Ты получаешь: <b>+500 монет</b>
• Друг получает: <b>+200 монет</b>

📊 Приглашено: <b>${user.totalReferrals}</b>

${LINE}
Поделись ссылкой:`;

/* ════════════════════════════════════════════════
   NOTIFICATIONS (sent by website → bot service)
════════════════════════════════════════════════ */

export const tplOrderConfirmed = (orderId: string, game: string, platform: string, price_: number) => `\
🎮 <b>ЗАКАЗ ПОДТВЕРЖДЁН</b>
${LINE}

📦 Заказ <code>#${orderId}</code>
🎮 <b>${game}</b> · <code>${platform}</code>
💰 ${price(price_)}

⚡ <b>Мгновенная доставка</b>
<i>Ключ активации будет отправлен на email.</i>`;

export const tplOrderDelivered = (orderId: string, game: string, email: string) => `\
⚡ <b>КЛЮЧ ГОТОВ!</b>
${LINE}

📦 Заказ <code>#${orderId}</code>
🎮 <b>${game}</b>

✉️ Ключ отправлен на: <code>${email}</code>

${LINE}
<i>Не получил? Напиши в поддержку.</i>`;

export const tplCoinsEarned = (amount: number, reason: string) => `\
🪙 <b>+${coins(amount)} ARCANE COINS</b>
${LINE}

${reason}

${LINE}
<a href="https://arcane.uz/dashboard">Смотреть баланс</a>`;

export const tplLevelUp = (newLevel: string) => `\
🚀 <b>УРОВЕНЬ ПОВЫШЕН!</b>
${LINE}

${LEVEL_EMOJI[newLevel] ?? '💎'} <b>Ты достиг уровня ${newLevel.toUpperCase()}!</b>

Новые привилегии разблокированы.
Множитель монет увеличен!

${LINE}
<a href="https://arcane.uz/dashboard">Смотреть профиль</a>`;

export const tplPriceDrop = (game: string, oldPrice: number, newPrice: number, discount: number) => `\
🔥 <b>СНИЖЕНИЕ ЦЕНЫ!</b>
${LINE}

❤️ <b>${game}</b>

💰 <s>${price(oldPrice)}</s>  →  <b>${price(newPrice)}</b>
🏷 <b>-${discount}%</b>

${LINE}
<a href="https://arcane.uz/catalog">Купить сейчас</a>`;

/* ════════════════════════════════════════════════
   ADMIN
════════════════════════════════════════════════ */

export const tplAdminNewOrder = (orderId: string, userName: string, game: string, price_: number) => `\
🔔 <b>[ADMIN] Новый заказ</b>

👤 ${userName}
📦 #${orderId}
🎮 ${game}
💰 ${price(price_)}`;

export const tplAdminFailedPayment = (userId: string, amount: number) => `\
⚠️ <b>[ADMIN] Ошибка оплаты</b>

👤 User ID: <code>${userId}</code>
💰 Сумма: ${price(amount)}`;

export const tplAdminSupportRequest = (userName: string, category: string) => `\
🆘 <b>[ADMIN] Тикет поддержки</b>

👤 ${userName}
📋 Категория: ${category}`;
