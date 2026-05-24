import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface TgRow {
  telegramUsername: string | null;
  firstName: string;
}

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return Response.json({ linked: false });

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
