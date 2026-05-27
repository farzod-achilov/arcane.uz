import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const rows = await prisma.games.findMany({
    where: {
      isActive: true,
      OR: [
        { title:       { contains: q, mode: 'insensitive' } },
        { developer:   { contains: q, mode: 'insensitive' } },
        { publisher:   { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    },
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
    orderBy: [
      { title: 'asc' },
    ],
    take: 8,
  });

  const results = rows.map(g => ({
    id:          g.id,
    title:       g.title,
    slug:        g.slug,
    cover:       g.cover,
    priceUzs:    g.priceUzs ?? 0,
    platforms:   g.platforms,
    instant:     g.deliveryType === 'AUTO' && g.stockStore > 0,
  }));

  return NextResponse.json({ results });
}
