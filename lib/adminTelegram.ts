/* ─────────────────────────────────────────────────────────
   Direct Telegram notifications to the ADMIN chat.
   Uses BOT_TOKEN + ADMIN_CHAT_ID from .env.local
   No bot service needed — direct Telegram Bot API call.
───────────────────────────────────────────────────────── */

const BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN ?? '';
const ADMIN_CHAT   = process.env.TELEGRAM_CHAT_ID   ?? '';
const TG_API       = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface NewOrderNotification {
  id:                string;
  productTitle:      string;
  price:             number;
  customerName:      string;
  customerEmail:     string;
  customerTelegram?: string;
}

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
export async function notifyAdminNewOrder(order: NewOrderNotification): Promise<void> {
  const price = new Intl.NumberFormat('uz-UZ').format(order.price) + ' сум';
  const tg    = order.customerTelegram ? `\nTelegram: ${order.customerTelegram}` : '';

  const text = [
    `🎮 <b>НОВЫЙ ЗАКАЗ</b> #${order.id}`,
    ``,
    `🕹 <b>${order.productTitle}</b>`,
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

