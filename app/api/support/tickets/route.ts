import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyAdminNewTicket } from '@/lib/adminTelegram';

export const dynamic = 'force-dynamic';

const CATEGORIES = ['activation', 'payment', 'delivery', 'refund', 'coins', 'other'];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { subject?: string; category?: string; message?: string };
  const subject  = (body.subject  ?? '').trim();
  const category = CATEGORIES.includes(body.category ?? '') ? body.category! : 'other';
  const message  = (body.message  ?? '').trim();

  if (!subject || subject.length < 3)
    return NextResponse.json({ error: 'Укажите тему обращения' }, { status: 400 });
  if (!message || message.length < 10)
    return NextResponse.json({ error: 'Сообщение слишком короткое' }, { status: 400 });

  const ticket = await prisma.support_tickets.create({
    data: {
      userId:   session.user.id,
      subject,
      category,
      messages: {
        create: {
          authorId: session.user.id,
          isAdmin:  false,
          body:     message,
        },
      },
    },
    include: {
      messages: true,
      user:     { select: { username: true, email: true } },
    },
  });

  notifyAdminNewTicket({
    ticketId: ticket.id,
    subject,
    category,
    userName:  ticket.user.username,
    userEmail: ticket.user.email,
  }).catch(() => {});

  return NextResponse.json({ ok: true, ticket });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tickets = await prisma.support_tickets.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, subject: true, category: true, status: true, createdAt: true,
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({ tickets });
}
