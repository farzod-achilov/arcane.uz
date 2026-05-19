/**
 * POST /api/telegram/notify
 * Internal route — called server-side (e.g. after checkout) to
 * send a Telegram notification to a user.
 *
 * Usage example (server action or API route):
 *   await fetch('/api/telegram/notify', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       userId: 'usr_001',
 *       event: 'ORDER_CONFIRMED',
 *       data: { orderId: 'ARC-123', game: 'GTA V', platform: 'PC', price: 89000 },
 *     }),
 *   });
 */

import { sendTelegramNotif } from '@/lib/telegramService';

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as {
    userId?: string;
    event?:  string;
    data?:   Record<string, string | number | boolean>;
  };

  if (!body.userId || !body.event) {
    return Response.json({ error: 'userId and event required' }, { status: 400 });
  }

  const sent = await sendTelegramNotif(
    body.userId,
    body.event as Parameters<typeof sendTelegramNotif>[1],
    body.data ?? {},
  );

  return Response.json({ sent });
}
