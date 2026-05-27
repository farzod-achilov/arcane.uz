import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWhere = any;

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { isApproved } = await req.json() as { isApproved: boolean };

    const review = await (prisma.reviews.update as AnyWhere)({
      where:   { id: params.id },
      data:    { isApproved },
      include: { game: { select: { id: true } } },
    }) as AnyWhere;

    if (isApproved) {
      const where: AnyWhere = { gameId: review.game.id, isApproved: true };
      const agg = await prisma.reviews.aggregate({
        where,
        _avg: { rating: true },
      });
      if (agg._avg?.rating != null) {
        await prisma.games.update({
          where: { id: review.game.id },
          data:  { rating: Math.round(agg._avg.rating * 10) / 10 },
        });
      }
    }

    return NextResponse.json({ success: true, data: review });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await prisma.reviews.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
