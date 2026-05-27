import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows: Array<{
    id: string; type: string; title: string; body: string;
    href: string | null; isRead: boolean; createdAt: Date;
  }> = await db.notifications.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take:    30,
  });

  const unread = rows.filter(n => !n.isRead).length;

  return NextResponse.json({
    notifications: rows.map(n => ({
      id:    n.id,
      type:  n.type,
      title: n.title,
      body:  n.body,
      href:  n.href,
      read:  n.isRead,
      time:  n.createdAt.getTime(),
    })),
    unread,
  });
}

// PATCH: mark one or all as read
// Body: { id?: string } — omit id to mark all
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { id?: string };

  if (body.id) {
    await db.notifications.updateMany({
      where: { id: body.id, userId: session.user.id },
      data:  { isRead: true },
    });
  } else {
    await db.notifications.updateMany({
      where: { userId: session.user.id, isRead: false },
      data:  { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}

// DELETE: remove a single notification
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json().catch(() => ({})) as { id?: string };
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await db.notifications.deleteMany({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
