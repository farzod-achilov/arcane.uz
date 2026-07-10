import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const banners = await prisma.banners.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
  return NextResponse.json({ banners });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const banner = await prisma.banners.create({
    data: {
      title:      body.title      ?? 'Новый баннер',
      subtitle:   body.subtitle   ?? null,
      buttonText: body.buttonText ?? null,
      buttonLink: body.buttonLink ?? null,
      imageUrl:   body.imageUrl   ?? null,
      badgeText:  body.badgeText  ?? null,
      colorFrom:  body.colorFrom  ?? '#7C3AED',
      colorTo:    body.colorTo    ?? '#06B6D4',
      isActive:   body.isActive   ?? true,
      sortOrder:  body.sortOrder  ?? 0,
    },
  });
  return NextResponse.json({ ok: true, banner });
}
