import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as { isBanned?: boolean; isAdmin?: boolean; banReason?: string };

  const data: Record<string, unknown> = {};
  if (typeof body.isBanned === 'boolean') data.isBanned  = body.isBanned;
  if (typeof body.isAdmin  === 'boolean') data.isAdmin   = body.isAdmin;
  if (body.banReason !== undefined)       data.banReason = body.banReason ?? null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const isSelf = params.id === session.user.id;

  // Revoking your own admin rights, or the last remaining admin's, would
  // lock the panel and require the (secret-gated) bootstrap flow to recover.
  if (data.isAdmin === false) {
    if (isSelf) {
      return NextResponse.json({ error: 'Нельзя снять права администратора с себя' }, { status: 400 });
    }
    const otherAdmins = await prisma.users.count({ where: { isAdmin: true, id: { not: params.id } } });
    if (otherAdmins === 0) {
      return NextResponse.json({ error: 'Нельзя убрать последнего администратора' }, { status: 400 });
    }
  }
  // Self-ban would lock the admin out of their own account with no recovery path.
  if (data.isBanned === true && isSelf) {
    return NextResponse.json({ error: 'Нельзя заблокировать собственный аккаунт' }, { status: 400 });
  }

  const user = await prisma.users.update({
    where:  { id: params.id },
    data,
    select: { id: true, isBanned: true, isAdmin: true, banReason: true },
  });

  return NextResponse.json({ ok: true, user });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Prevent self-deletion
  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'Нельзя удалить собственный аккаунт' }, { status: 400 });
  }

  try {
    await prisma.$transaction([
      prisma.telegram_users.deleteMany({ where: { userId: params.id } }),
      prisma.steam_users.deleteMany(   { where: { userId: params.id } }),
      prisma.wishlists.deleteMany(     { where: { userId: params.id } }),
      prisma.notifications.deleteMany( { where: { userId: params.id } }),
      prisma.transactions.deleteMany(  { where: { userId: params.id } }),
      prisma.sessions.deleteMany(      { where: { userId: params.id } }),
      prisma.users.delete(             { where: { id: params.id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Не удалось удалить: ${msg}` }, { status: 409 });
  }
}
