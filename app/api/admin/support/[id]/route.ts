import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

// PATCH /api/admin/support/[id] — change status or priority
export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as { status?: string; priority?: string };

  const validStatuses  = ['OPEN', 'IN_PROGRESS', 'RESOLVED'] as const;
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (body.status   && validStatuses.includes(body.status as never))   data.status   = body.status;
  if (body.priority && validPriorities.includes(body.priority as never)) data.priority = body.priority;

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: 'Нечего обновлять' }, { status: 400 });

  const ticket = await prisma.support_tickets.update({
    where: { id: params.id },
    data,
    select: { id: true, status: true, priority: true },
  });

  return NextResponse.json({ ok: true, ticket });
}

// POST /api/admin/support/[id] — add admin reply message
export async function POST(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as { body?: string };
  const text = (body.body ?? '').trim();
  if (!text) return NextResponse.json({ error: 'Пустое сообщение' }, { status: 400 });

  const [message] = await prisma.$transaction([
    prisma.support_messages.create({
      data: {
        ticketId: params.id,
        authorId: session.user.id,
        isAdmin:  true,
        body:     text,
      },
      include: { author: { select: { username: true } } },
    }),
    prisma.support_tickets.update({
      where: { id: params.id },
      data:  { status: 'IN_PROGRESS' },
    }),
  ]);

  return NextResponse.json({ ok: true, message });
}
