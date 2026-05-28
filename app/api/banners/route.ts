import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const banners = await prisma.banners.findMany({
    where:   { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, title: true, subtitle: true, buttonText: true,
      buttonLink: true, imageUrl: true, badgeText: true,
      colorFrom: true, colorTo: true,
    },
  });
  return NextResponse.json({ banners });
}
