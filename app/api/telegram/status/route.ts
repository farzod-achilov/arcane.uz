import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/apiGuard';

export const dynamic = 'force-dynamic';

interface TgRow {
  telegramUsername: string | null;
  firstName: string;
}

export async function GET(req: Request): Promise<Response> {
  const { guard, session } = await requireSession();
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return Response.json({ linked: false });

  if (userId !== session!.user.id && !session!.user.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const rows = await prisma.$queryRaw<TgRow[]>`
      SELECT "telegramUsername", "firstName"
      FROM telegram_users
      WHERE "userId" = ${userId}
      LIMIT 1
    `;
    if (rows.length === 0) return Response.json({ linked: false });
    const row = rows[0];
    return Response.json({
      linked:    true,
      username:  row.telegramUsername ?? undefined,
      firstName: row.firstName,
    });
  } catch {
    return Response.json({ linked: false });
  }
}
