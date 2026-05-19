/**
 * Next.js → Telegram Bot Service client.
 *
 * Calls the bot's internal Express API to:
 *  - Generate a linking token (account connection flow)
 *  - Send notifications to users
 */

type NotifEventType =
  | 'ORDER_CONFIRMED' | 'ORDER_PROCESSING'
  | 'ORDER_DELIVERED' | 'ORDER_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'COINS_EARNED'    | 'COINS_SPENT'
  | 'LEVEL_UP'
  | 'WISHLIST_PRICE_DROP' | 'WISHLIST_IN_STOCK'
  | 'DEAL_ALERT'
  | 'REWARD_AVAILABLE'
  | 'REFERRAL_JOINED';

const BOT_URL    = process.env.TELEGRAM_BOT_URL    ?? 'http://localhost:3001';
const API_SECRET = process.env.TELEGRAM_API_SECRET ?? 'dev-secret';

async function callBot<T = unknown>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${BOT_URL}${path}`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'x-api-secret':  API_SECRET,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`[TelegramService] ${path} → ${res.status}`);
      return null;
    }
    return res.json() as Promise<T>;
  } catch (err) {
    // Bot service might not be running — fail silently in development
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[TelegramService] Bot service unreachable (${path})`);
      return null;
    }
    throw err;
  }
}

/* ── Request a linking token ─────────────────────────── */
export async function requestTelegramToken(
  userId: string,
  userName: string,
): Promise<{ token: string; link: string } | null> {
  return callBot<{ token: string; link: string }>('/api/request-token', {
    userId,
    userName,
  });
}

/* ── Send a notification to a user ───────────────────── */
export async function sendTelegramNotif(
  userId: string,
  event: NotifEventType,
  data: Record<string, string | number | boolean>,
): Promise<boolean> {
  const result = await callBot<{ sent: boolean }>('/api/notify', {
    userId,
    event,
    data,
  });
  return result?.sent ?? false;
}

/* ── Convenience wrappers ────────────────────────────── */

export const TelegramNotif = {
  orderConfirmed: (userId: string, orderId: string, game: string, platform: string, price: number) =>
    sendTelegramNotif(userId, 'ORDER_CONFIRMED', { orderId, game, platform, price }),

  orderDelivered: (userId: string, orderId: string, game: string, email: string) =>
    sendTelegramNotif(userId, 'ORDER_DELIVERED', { orderId, game, email }),

  coinsEarned: (userId: string, amount: number, reason: string) =>
    sendTelegramNotif(userId, 'COINS_EARNED', { amount, reason }),

  levelUp: (userId: string, level: string) =>
    sendTelegramNotif(userId, 'LEVEL_UP', { level }),

  priceDrop: (userId: string, game: string, oldPrice: number, newPrice: number, discount: number) =>
    sendTelegramNotif(userId, 'WISHLIST_PRICE_DROP', { game, oldPrice, newPrice, discount }),

  paymentFailed: (userId: string, amount: number) =>
    sendTelegramNotif(userId, 'PAYMENT_FAILED', { amount }),
};
