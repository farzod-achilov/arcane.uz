import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const ticket = await prisma.support_tickets.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (ticket.status === 'RESOLVED')
    return NextResponse.json({ error: 'Тикет закрыт' }, { status: 400 });

  const body = await req.json() as { message?: string };
  const text = (body.message ?? '').trim();
  if (!text || text.length < 2)
    return NextResponse.json({ error: 'Сообщение слишком короткое' }, { status: 400 });

  const [message] = await prisma.$transaction([
    prisma.support_messages.create({
      data: {
        ticketId: params.id,
        authorId: session.user.id,
        isAdmin:  false,
        body:     text,
      },
      include: { author: { select: { username: true, avatar: true } } },
    }),
    prisma.support_tickets.update({
      where: { id: params.id },
      data:  { status: 'IN_PROGRESS', updatedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ message });
}
