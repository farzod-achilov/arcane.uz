import { getServerSession } from 'next-auth';
import { NextResponse }     from 'next/server';
import { authOptions }      from '@/lib/auth';
import { prisma }           from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/wishlist/notify?gameId=xxx → { notifying: boolean, notifiedPrice: number | null }
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ notifying: false, notifiedPrice: null });

  const gameId = new URL(req.url).searchParams.get('gameId');
  if (!gameId) return NextResponse.json({ error: 'gameId required' }, { status: 400 });

  const row = await prisma.wishlists.findUnique({
    where:  { userId_gameId: { userId: session.user.id, gameId } },
    select: { notifiedPrice: true },
  });

  return NextResponse.json({
    notifying:     !!row?.notifiedPrice,
    notifiedPrice: row?.notifiedPrice ?? null,
  });
}

// POST /api/wishlist/notify — { gameId, priceUzs } → enables notification
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { gameId, priceUzs } = await req.json() as { gameId?: string; priceUzs?: number };
  if (!gameId)   return NextResponse.json({ error: 'gameId required' },   { status: 400 });
  if (!priceUzs) return NextResponse.json({ error: 'priceUzs required' }, { status: 400 });

  await prisma.wishlists.upsert({
    where:  { userId_gameId: { userId: session.user.id, gameId } },
    create: { userId: session.user.id, gameId, notifiedPrice: priceUzs },
    update: { notifiedPrice: priceUzs },
  });

  return NextResponse.json({ ok: true, notifying: true, notifiedPrice: priceUzs });
}

// DELETE /api/wishlist/notify — { gameId } → disables notification
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { gameId } = await req.json() as { gameId?: string };
  if (!gameId) return NextResponse.json({ error: 'gameId required' }, { status: 400 });

  await prisma.wishlists.updateMany({
    where: { userId: session.user.id, gameId },
    data:  { notifiedPrice: null },
  });

  return NextResponse.json({ ok: true, notifying: false });
}
