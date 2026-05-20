/**
 * POST /api/telegram/connect
 * Called from the website Settings / Dashboard page.
 * Requests a linking token from the bot service and returns the link.
 */

export const dynamic = 'force-dynamic';

import { requestTelegramToken } from '@/lib/telegramService';

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as { userId?: string; userName?: string };

  if (!body.userId || !body.userName) {
    return Response.json({ error: 'userId and userName required' }, { status: 400 });
  }

  const result = await requestTelegramToken(body.userId, body.userName);

  if (!result) {
    return Response.json(
      {
        error:   'Bot service unavailable',
        fallback: 'https://t.me/arcaneuz_support',
      },
      { status: 503 },
    );
  }

  return Response.json(result);
}
