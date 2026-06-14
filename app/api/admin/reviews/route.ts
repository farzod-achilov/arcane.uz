import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/apiGuard';

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWhere = any;

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'pending';
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit  = 20;

  const where: AnyWhere =
    status === 'pending'  ? { isApproved: false } :
    status === 'approved' ? { isApproved: true  } :
    {};

  const [rows, total] = await Promise.all([
    (prisma.reviews.findMany as AnyWhere)({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        game: { select: { id: true, title: true, slug: true, cover: true } },
        user: { select: { username: true, email: true } },
      },
    }),
    prisma.reviews.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: rows, total, page, pages: Math.ceil(total / limit) });
}
