import { formatPrice } from '@/lib/utils';

const BOT   = process.env.TELEGRAM_BOT_TOKEN ?? '';
const CHAT  = process.env.TELEGRAM_CHAT_ID   ?? '';
const API   = `https://api.telegram.org/bot${BOT}`;

async function tg(text: string) {
  if (!BOT || !CHAT) return;
  try {
    await fetch(`${API}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: CHAT, text, parse_mode: 'HTML' }),
    });
  } catch { /* non-fatal */ }
}

export async function notifyNewManualOrder(params: {
  orderId:    string;
  username:   string;
  email:      string;
  gameTitle:  string;
  totalPrice: number;
}) {
  await tg([
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
  await tg([
    `✅ <b>ЗАКАЗ ВЫПОЛНЕН</b>`,
    ``,
    `🕹 ${params.gameTitle}`,
    `👤 ${params.username} (${params.email})`,
    `🆔 <code>${params.orderId}</code>`,
    `📬 ${who}`,
  ].join('\n'));
}

export async function notifyLowStock(gameTitle: string, stock: number) {
  await tg(`⚠️ <b>Низкий сток:</b> ${gameTitle} — осталось <b>${stock}</b> ключей`);
}
