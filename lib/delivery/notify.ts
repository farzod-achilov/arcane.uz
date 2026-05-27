import { formatPrice } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { sendKeyDeliveryEmail } from '@/lib/email';

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
  gameId:   string;
  gameTitle: string;
  gameSlug: string;
  oldPrice: number;
  newPrice: number;
}) {
  if (!BOT) return;
  const wishlistUsers = await prisma.wishlists.findMany({
    where:   { gameId: params.gameId },
    include: {
      user: {
        include: { sessions: false },
        select:  { id: true },
      },
    },
  });

  const telegramLinks = await prisma.telegram_users.findMany({
    where: {
      userId:       { in: wishlistUsers.map(w => w.userId) },
      prefsWishlist: true,
    },
    select: { telegramId: true },
  });

  const text = [
    `📉 <b>Снижение цены!</b>`,
    ``,
    `🕹 <b>${params.gameTitle}</b>`,
    `💰 ${formatPrice(params.oldPrice)} → <b>${formatPrice(params.newPrice)}</b>`,
    ``,
    `👉 <a href="https://arcane.com.uz/games/${params.gameSlug}">Купить сейчас</a>`,
  ].join('\n');

  await Promise.all(telegramLinks.map(u => tg(u.telegramId.toString(), text)));
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
