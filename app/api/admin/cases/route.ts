import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const cases = await prisma.drop_machines.findMany({
    orderBy: [{ featuredOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id:           true,
      name:         true,
      slug:         true,
      theme:        true,
      price:        true,
      description:  true,
      imageUrl:     true,
      isActive:     true,
      totalOpened:  true,
      featuredOrder:true,
      drop_rewards: {
        where:   { isActive: true },
        select:  { id: true, name: true, rarity: true, dropChance: true, type: true },
        orderBy: { dropChance: 'desc' },
      },
    },
  });

  return NextResponse.json({ cases });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as {
    name?: string; slug?: string; theme?: string;
    price?: number; description?: string; imageUrl?: string;
  };

  const name  = body.name?.trim();
  const slug  = body.slug?.trim().toLowerCase().replace(/\s+/g, '-');
  const theme = body.theme?.trim() || 'silver';
  const price = Math.round(body.price ?? 0);

  if (!name)  return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
  if (!slug)  return NextResponse.json({ error: 'Slug обязателен' }, { status: 400 });
  if (price <= 0) return NextResponse.json({ error: 'Цена должна быть больше 0' }, { status: 400 });

  const now = new Date();
  try {
    const machine = await prisma.drop_machines.create({
      data: {
        id:          nanoid(),
        name,
        slug,
        theme,
        price,
        description: body.description?.trim() || null,
        imageUrl:    body.imageUrl?.trim()    || null,
        isActive:    false,
        totalOpened: 0,
        updatedAt:   now,
      },
      select: {
        id: true, name: true, slug: true, theme: true, price: true,
        description: true, imageUrl: true, isActive: true, totalOpened: true,
        featuredOrder: true, drop_rewards: true,
      },
    });
    return NextResponse.json({ ok: true, case: machine }, { status: 201 });
  } catch (err) {
    // Unique constraint on slug — two concurrent creates raced the pre-check
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return NextResponse.json({ error: 'Кейс с таким slug уже существует' }, { status: 409 });
    }
    throw err;
  }
}
