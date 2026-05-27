import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ticket = await prisma.support_tickets.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { username: true, avatar: true } } },
      },
    },
  });

  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ ticket });
}
