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

type InlineKeyboard = { inline_keyboard: { text: string; callback_data: string }[][] };

async function sendMessage(chatId: string, text: string, replyMarkup?: InlineKeyboard): Promise<boolean> {
  if (!BOT_TOKEN || !chatId) return false;
  try {
    const res = await fetch(`${TG_API}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId, text, parse_mode: 'HTML',
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
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

const fmtSum = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + ' сум';

/** Notify admin about a new P2P deposit request (card + unique amount) */
export async function notifyAdminNewDeposit(params: {
  depositId:    string;
  userId:       string;
  userName:     string;
  userEmail:    string;
  amount:       number;
  uniqueAmount: number;
  cardNumber:   string;
  ttlMinutes:   number;
}): Promise<void> {
  const { depositId, userName, userEmail, amount, uniqueAmount, cardNumber, ttlMinutes } = params;

  const text = [
    `💳 <b>НОВАЯ ЗАЯВКА НА ДЕПОЗИТ</b>`,
    ``,
    `💰 Запрошено: <b>${fmtSum(amount)}</b>`,
    `🔑 Ожидаем перевод: <b>${fmtSum(uniqueAmount)}</b>`,
    `🏦 Карта: <code>${cardNumber}</code>`,
    `⏱ Таймер: ${ttlMinutes} мин`,
    ``,
    `👤 Пользователь: ${userName || '—'}`,
    `📧 Email: ${userEmail || '—'}`,
    ``,
    `🆔 ID заявки: <code>${depositId}</code>`,
    `⚡ Придёт уведомление с точной суммой — зачислится автоматически.`,
    `Кнопки ниже — для ручного решения спорных случаев.`,
  ].join('\n');

  await sendMessage(ADMIN_CHAT, text, {
    inline_keyboard: [[
      { text: '✅ Зачислить', callback_data: `dep:approve:${depositId}` },
      { text: '❌ Отклонить', callback_data: `dep:reject:${depositId}` },
    ]],
  });
}

/** Deposit auto-confirmed by SMS hook */
export async function notifyAdminDepositAutoConfirmed(params: {
  depositId:  string;
  userName:   string;
  userEmail:  string;
  credit:     number;
  cardNumber: string;
}): Promise<void> {
  const { depositId, userName, userEmail, credit, cardNumber } = params;
  const text = [
    `✅ <b>ДЕПОЗИТ ЗАЧИСЛЕН АВТОМАТИЧЕСКИ</b>`,
    ``,
    `💰 Сумма: <b>${fmtSum(credit)}</b>`,
    `🏦 Карта: <code>${cardNumber}</code>`,
    `👤 ${userName || '—'} (${userEmail || '—'})`,
    `🆔 <code>${depositId}</code>`,
  ].join('\n');
  await sendMessage(ADMIN_CHAT, text);
}

/** Income-looking SMS arrived but no deposit matched — needs a human look */
export async function notifyAdminSmsUnmatched(smsText: string, sender: string | null): Promise<void> {
  const text = [
    `⚠️ <b>SMS О ПОСТУПЛЕНИИ БЕЗ ЗАЯВКИ</b>`,
    ``,
    sender ? `Отправитель: ${sender}` : '',
    `<pre>${smsText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
    ``,
    `Проверь вручную: Admin → /admin/deposits`,
  ].filter(Boolean).join('\n');
  await sendMessage(ADMIN_CHAT, text);
}

/** Notify admin that a dropship supplier's balance is running low */
export async function notifyAdminLowSupplierBalance(params: {
  supplier:     string;
  balanceUsd:   number;
  thresholdUsd: number;
  topUpUrl:     string;
}): Promise<void> {
  const text = [
    `🪫 <b>НИЗКИЙ БАЛАНС: ${params.supplier.toUpperCase()}</b>`,
    ``,
    `Остаток: <b>$${params.balanceUsd.toFixed(2)}</b> (порог: $${params.thresholdUsd.toFixed(2)})`,
    ``,
    `Новые dropship-заказы будут уходить в ручную доставку, пока баланс не пополнят.`,
    ``,
    `🔗 Пополнить: ${params.topUpUrl}`,
  ].join('\n');
  await sendMessage(ADMIN_CHAT, text);
}

