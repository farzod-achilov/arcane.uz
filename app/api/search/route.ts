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
      genres:       true,
      rating:       true,
      deliveryType: true,
      stockStore:   true,
      salesCount:   true,
    },
    take: 20,
  });

  const qLower = q.toLowerCase();

  // Sort: exact title start > title contains > rest; then by salesCount
  const sorted = rows.sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();
    const aExact = aTitle.startsWith(qLower) ? 0 : aTitle.includes(qLower) ? 1 : 2;
    const bExact = bTitle.startsWith(qLower) ? 0 : bTitle.includes(qLower) ? 1 : 2;
    if (aExact !== bExact) return aExact - bExact;
    return b.salesCount - a.salesCount;
  }).slice(0, 8);

  const results = sorted.map(g => ({
    id:        g.id,
    title:     g.title,
    slug:      g.slug,
    cover:     g.cover,
    priceUzs:  g.priceUzs ?? 0,
    platforms: g.platforms,
    genres:    g.genres.slice(0, 2),
    rating:    g.rating,
    instant:   g.deliveryType === 'AUTO' && g.stockStore > 0,
  }));

  return NextResponse.json({ results });
}
