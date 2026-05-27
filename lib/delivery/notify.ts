import { formatPrice } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { sendKeyDeliveryEmail, sendPriceDropEmail } from '@/lib/email';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDB = any;

const BOT  = process.env.TELEGRAM_BOT_TOKEN ?? '';
const CHAT = process.env.TELEGRAM_CHAT_ID   ?? '';
const API  = `https://api.telegram.org/bot${BOT}`;

async function tg(chatId: string | number, text: string) {
  if (!BOT) return;
  try {
    await fetch(`${API}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
  } catch { /* non-fatal */ }
}

async function tgAdmin(text: string) {
  if (CHAT) await tg(CHAT, text);
}

async function tgUser(userId: string, text: string) {
  if (!BOT) return;
  const linked = await prisma.telegram_users.findUnique({
    where:  { userId },
    select: { telegramId: true, prefsOrders: true },
  });
  if (linked?.prefsOrders) await tg(linked.telegramId.toString(), text);
}

// Notify user that their order is complete and key is ready
export async function notifyUserOrderComplete(params: {
  userId:    string;
  orderId:   string;
  gameTitle: string;
  keyValue?: string;
  userEmail?: string;
  username?:  string;
}) {
  await tgUser(params.userId, [
    `✅ <b>Ваш заказ выполнен!</b>`,
    ``,
    `🕹 <b>${params.gameTitle}</b>`,
    params.keyValue ? `🔑 Ключ: <code>${params.keyValue}</code>` : `🔑 Ключ доступен в личном кабинете`,
    ``,
    `📦 Проверьте <a href="https://arcane.com.uz/library">Мою библиотеку</a>`,
  ].join('\n'));

  if (params.userEmail) {
    sendKeyDeliveryEmail({
      to:        params.userEmail,
      username:  params.username ?? params.userEmail,
      orderId:   params.orderId,
      gameTitle: params.gameTitle,
      keyValue:  params.keyValue,
    }).catch(() => {});
  }
}

// Notify wishlist users when a game price drops
export async function notifyWishlistPriceDrop(params: {
  gameId:    string;
  gameTitle: string;
  gameSlug:  string;
  oldPrice:  number;
  newPrice:  number;
}) {
  const { gameId, gameTitle, gameSlug, oldPrice, newPrice } = params;
  const savePct = Math.round(((oldPrice - newPrice) / oldPrice) * 100);

  // Fetch wishlist entries that haven't been notified at or below this price
  const wishlists = await (prisma.wishlists.findMany as AnyDB)({
    where: {
      gameId,
      OR: [
        { notifiedPrice: null },
        { notifiedPrice: { gt: newPrice } },
      ],
    },
    select: {
      id:     true,
      userId: true,
      user:   { select: { email: true, username: true } },
    },
  }) as { id: string; userId: string; user: { email: string; username: string } }[];

  if (wishlists.length === 0) return;

  const userIds = wishlists.map(w => w.userId);

  // Telegram: only users who linked and enabled wishlist prefs
  const telegramLinks = await prisma.telegram_users.findMany({
    where:  { userId: { in: userIds }, prefsWishlist: true },
    select: { userId: true, telegramId: true },
  });

  const tgUserIds = new Set(telegramLinks.map(t => t.userId));

  const tgText = [
    `📉 <b>Снижение цены!</b>`,
    ``,
    `🕹 <b>${gameTitle}</b>`,
    `💰 ${formatPrice(oldPrice)} → <b>${formatPrice(newPrice)}</b> (−${savePct}%)`,
    ``,
    `👉 <a href="https://arcane.com.uz/games/${gameSlug}">Купить сейчас</a>`,
  ].join('\n');

  await Promise.all([
    // Telegram notifications
    ...telegramLinks.map(u => tg(u.telegramId.toString(), tgText)),
    // Email notifications for users without Telegram wishlist prefs
    ...wishlists
      .filter(w => !tgUserIds.has(w.userId))
      .map(w => sendPriceDropEmail({
        to:        w.user.email,
        username:  w.user.username,
        gameTitle,
        gameSlug,
        oldPrice,
        newPrice,
        savePct,
      }).catch(() => {})),
  ]);

  // Mark all notified with the new price
  await (prisma.wishlists.updateMany as AnyDB)({
    where: { id: { in: wishlists.map(w => w.id) } },
    data:  { notifiedPrice: newPrice },
  });
}

export async function notifyNewManualOrder(params: {
  orderId:    string;
  username:   string;
  email:      string;
  gameTitle:  string;
  totalPrice: number;
}) {
  await tgAdmin([
    `📦 <b>РУЧНАЯ ДОСТАВКА — новый заказ</b>`,
    ``,
    `🕹 <b>${params.gameTitle}</b>`,
    `💰 ${formatPrice(params.totalPrice)}`,
    ``,
    `👤 ${params.username} · ${params.email}`,
    `🆔 Заказ: <code>${params.orderId}</code>`,
    ``,
    `⚡ Перейди в /admin/deliveries и завершите доставку`,
  ].join('\n'));
}

export async function notifyOrderCompleted(params: {
  orderId:   string;
  username:  string;
  email:     string;
  gameTitle: string;
  method:    'AUTO' | 'MANUAL';
  actorName?: string;
}) {
  const who = params.method === 'AUTO' ? '🤖 Автоматически' : `👤 Оператор: ${params.actorName}`;
  await tgAdmin([
    `✅ <b>ЗАКАЗ ВЫПОЛНЕН</b>`,
    ``,
    `🕹 ${params.gameTitle}`,
    `👤 ${params.username} (${params.email})`,
    `🆔 <code>${params.orderId}</code>`,
    `📬 ${who}`,
  ].join('\n'));
}

export async function notifyLowStock(gameTitle: string, stock: number) {
  await tgAdmin(`⚠️ <b>Низкий сток:</b> ${gameTitle} — осталось <b>${stock}</b> ключей`);
}
