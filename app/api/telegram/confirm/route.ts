/**
 * POST /api/telegram/confirm
 * Called by the bot service after verifying a token.
 * Updates the user's Telegram connection in the user store.
 *
 * In production this would write to a database.
 * For the demo we just return 200 — the bot already has the mapping in memory.
 */

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  const secret = req.headers.get('x-api-secret');
  if (secret !== (process.env.TELEGRAM_API_SECRET ?? 'dev-secret')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as {
    userId?:     string;
    telegramId?: number;
    username?:   string;
  };

  if (!body.userId || !body.telegramId) {
    return Response.json({ error: 'userId and telegramId required' }, { status: 400 });
  }

  /**
   * TODO (production):
   *   await db.users.update({
   *     where: { id: body.userId },
   *     data: {
   *       telegramId:       body.telegramId,
   *       telegramUsername: body.username ?? null,
   *       telegramLinkedAt: new Date(),
   *     },
   *   });
   */

  console.log(`[API] Telegram linked: userId=${body.userId} → telegramId=${body.telegramId}`);
  return Response.json({ ok: true });
}
