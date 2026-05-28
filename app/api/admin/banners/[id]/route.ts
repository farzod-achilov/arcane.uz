import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const banner = await prisma.banners.update({
    where: { id: params.id },
    data: {
      ...(body.title      !== undefined && { title:      body.title      }),
      ...(body.subtitle   !== undefined && { subtitle:   body.subtitle   }),
      ...(body.buttonText !== undefined && { buttonText: body.buttonText }),
      ...(body.buttonLink !== undefined && { buttonLink: body.buttonLink }),
      ...(body.imageUrl   !== undefined && { imageUrl:   body.imageUrl   }),
      ...(body.badgeText  !== undefined && { badgeText:  body.badgeText  }),
      ...(body.colorFrom  !== undefined && { colorFrom:  body.colorFrom  }),
      ...(body.colorTo    !== undefined && { colorTo:    body.colorTo    }),
      ...(body.isActive   !== undefined && { isActive:   body.isActive   }),
      ...(body.sortOrder  !== undefined && { sortOrder:  body.sortOrder  }),
    },
  });
  return NextResponse.json({ ok: true, banner });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.banners.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
