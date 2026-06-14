/**
 * POST /api/telegram/confirm
 * Called by the Telegram bot after the user completes the /start verify_TOKEN flow.
 * Creates a telegram_users record linking the Telegram account to the site account.
 */

import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

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
    firstName?:  string;
  };

  if (!body.userId || !body.telegramId) {
    return Response.json({ error: 'userId and telegramId required' }, { status: 400 });
  }

  const telegramId = BigInt(body.telegramId);

  // Check if this Telegram ID is already linked
  const existing = await prisma.telegram_users.findUnique({ where: { telegramId } });
  if (existing) {
    if (existing.userId === body.userId) {
      return Response.json({ ok: true, alreadyLinked: true });
    }
    return Response.json(
      { error: 'Telegram account already linked to another user' },
      { status: 409 },
    );
  }

  // Look up the site user to get their username for the userName field
  const user = await prisma.users.findUnique({
    where:  { id: body.userId },
    select: { username: true },
  });
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  await prisma.telegram_users.create({
    data: {
      userId:           body.userId,
      telegramId,
      telegramUsername: body.username ?? null,
      firstName:        body.firstName ?? body.username ?? user.username,
      userName:         user.username,
      referralCode:     randomBytes(4).toString('hex').toUpperCase(),
    },
  });

  return Response.json({ ok: true });
}
