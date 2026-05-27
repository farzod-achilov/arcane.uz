import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('ids') ?? '';
  const ids = raw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 50);

  if (!ids.length) return NextResponse.json({ items: [] });

  const games = await prisma.games.findMany({
    where:  { id: { in: ids }, isActive: true },
    select: {
      id:           true,
      title:        true,
      slug:         true,
      cover:        true,
      priceUzs:     true,
      platforms:    true,
      deliveryType: true,
      stockStore:   true,
    },
  });

  // Preserve original order from ids array
  const map = new Map(games.map(g => [g.id, g]));
  const items = ids.map(id => map.get(id)).filter(Boolean);

  return NextResponse.json({ items });
}
