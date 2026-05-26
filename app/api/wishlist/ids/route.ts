import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/wishlist/ids — just game IDs, fast lookup for heart buttons
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([]);

  const rows = await prisma.wishlists.findMany({
    where: { userId: session.user.id },
    select: { gameId: true },
  });

  return NextResponse.json(rows.map(r => r.gameId));
}
