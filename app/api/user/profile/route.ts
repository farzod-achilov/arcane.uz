import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json() as { name?: string };
  const username = name?.trim();

  if (!username || username.length < 2) {
    return NextResponse.json({ error: 'Имя должно содержать минимум 2 символа' }, { status: 400 });
  }

  await prisma.users.update({
    where: { id: session.user.id },
    data:  { username, updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
