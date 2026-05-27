/* ─────────────────────────────────────────────────────────
   Direct Telegram notifications to the ADMIN chat.
   Uses BOT_TOKEN + ADMIN_CHAT_ID from .env.local
   No bot service needed — direct Telegram Bot API call.
───────────────────────────────────────────────────────── */

import type { ArcaneOrder } from './orders';

const BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN ?? '';
const ADMIN_CHAT   = process.env.TELEGRAM_CHAT_ID   ?? '';
const TG_API       = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendMessage(chatId: string, text: string): Promise<boolean> {
  if (!BOT_TOKEN || !chatId) return false;
  try {
    const res = await fetch(`${TG_API}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Notify admin about a new paid order */
export async function notifyAdminNewOrder(order: ArcaneOrder): Promise<void> {
  const price = new Intl.NumberFormat('uz-UZ').format(order.price) + ' сум';
  const tg    = order.customerTelegram ? `\nTelegram: ${order.customerTelegram}` : '';

  const text = [
    `🎮 <b>НОВЫЙ ЗАКАЗ</b> #${order.id}`,
    ``,
    `🕹 <b>${order.productTitle}</b>`,
    `🖥 Платформа: ${order.platform}`,
    `💰 Сумма: <b>${price}</b>`,
    ``,
    `👤 Покупатель: ${order.customerName}`,
    `📧 Email: ${order.customerEmail}${tg}`,
    ``,
    `⚡ <b>Действие:</b> Купи ключ и добавь в админ панели`,
    `🔗 Admin → /admin/orders → ${order.id}`,
  ].join('\n');

  await sendMessage(ADMIN_CHAT, text);
}

/** Notify admin that key was sent to customer */
export async function notifyAdminDelivered(order: ArcaneOrder): Promise<void> {
  const text = [
    `✅ <b>КЛЮЧ ОТПРАВЛЕН</b> #${order.id}`,
    `🕹 ${order.productTitle}`,
    `👤 ${order.customerName} (${order.customerEmail})`,
  ].join('\n');

  await sendMessage(ADMIN_CHAT, text);
}

/** Notify admin about a new support ticket */
export async function notifyAdminNewTicket(params: {
  ticketId:  string;
  subject:   string;
  category:  string;
  userName:  string;
  userEmail: string;
}): Promise<void> {
  const { ticketId, subject, category, userName, userEmail } = params;
  const text = [
    `🎫 <b>НОВЫЙ ТИКЕТ ПОДДЕРЖКИ</b>`,
    ``,
    `📝 Тема: <b>${subject}</b>`,
    `🏷 Категория: ${category}`,
    ``,
    `👤 ${userName} (${userEmail})`,
    `🆔 ID: <code>${ticketId}</code>`,
    `🔗 Admin → /admin/support`,
  ].join('\n');
  await sendMessage(ADMIN_CHAT, text);
}

/** Notify admin about a new deposit request */
export async function notifyAdminNewDeposit(params: {
  depositId: string;
  userId:    string;
  userName:  string;
  userEmail: string;
  amount:    number;
  method:    string;
}): Promise<void> {
  const { depositId, userName, userEmail, amount, method } = params;
  const sum = new Intl.NumberFormat('uz-UZ').format(amount) + ' сум';
  const methodLabel = method === 'click' ? 'Click' : method === 'payme' ? 'Payme' : 'Карта';

  const text = [
    `💳 <b>НОВАЯ ЗАЯВКА НА ДЕПОЗИТ</b>`,
    ``,
    `💰 Сумма: <b>${sum}</b>`,
    `🏦 Метод: ${methodLabel}`,
    ``,
    `👤 Пользователь: ${userName || '—'}`,
    `📧 Email: ${userEmail || '—'}`,
    ``,
    `🆔 ID заявки: <code>${depositId}</code>`,
    `🔗 Admin → /admin/deposits`,
  ].join('\n');

  await sendMessage(ADMIN_CHAT, text);
}

/** Send game key to customer via their Telegram */
export async function sendKeyToCustomer(
  order: ArcaneOrder,
): Promise<{ sent: boolean; method: string }> {
  if (!order.gameKey) return { sent: false, method: 'no_key' };

  // Try Telegram first if customer linked their account
  if (order.customerTelegram && BOT_TOKEN) {
    // customerTelegram is like "@username" — need chat_id
    // For MVP: send to admin with instructions to forward
    const text = [
      `🔑 <b>Ключ активации для ${order.customerName}</b>`,
      ``,
      `🕹 <b>${order.productTitle}</b>`,
      `🖥 Платформа: ${order.platform}`,
      ``,
      `<code>${order.gameKey}</code>`,
      ``,
      `📋 Инструкция по активации:`,
      `1. Открой Steam → Игры → Активировать продукт в Steam`,
      `2. Введи ключ: <code>${order.gameKey}</code>`,
      `3. Игра появится в библиотеке`,
      ``,
      `Спасибо за покупку на ARCANE.UZ! 🎮`,
    ].join('\n');

    // Send to admin with customer contact — admin forwards manually for now
    await sendMessage(ADMIN_CHAT,
      `📤 <b>Отправь этот ключ покупателю ${order.customerTelegram}:</b>\n\n${text}`,
    );
    return { sent: true, method: 'telegram_admin_forward' };
  }

  // Fallback: notify admin to send via email
  await sendMessage(ADMIN_CHAT, [
    `📧 <b>Отправь ключ по email</b> покупателю ${order.customerName}`,
    `Email: ${order.customerEmail}`,
    `Ключ: <code>${order.gameKey}</code>`,
    `Заказ: #${order.id} — ${order.productTitle}`,
  ].join('\n'));

  return { sent: true, method: 'email_manual' };
}
