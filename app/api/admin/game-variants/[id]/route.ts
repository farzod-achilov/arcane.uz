import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/apiGuard';
import { syncGameFromVariants } from '@/lib/db/gameVariants';
import type { PricingStrategy } from '@/lib/smartPricing/types';

export const dynamic = 'force-dynamic';

/* ─────────────────────────────────────────────────────────
   PATCH /api/admin/game-variants/[id]

   isActive/priceUzs/pricingStrategy are editable — label/dropship SKU are
   set once at creation. No DELETE route exists for variants on purpose:
   retiring one is always isActive=false, so order_items.variantId never
   dangles for historical orders. See lib/db/gameVariants.ts.

   pricingStrategy only takes effect the next time refresh-price runs
   (POST /api/admin/game-variants/[id]/refresh-price reads it) — changing
   it here does not itself recompute priceUzs.
───────────────────────────────────────────────────────── */

const STRATEGIES: PricingStrategy[] = ['GLOBAL', 'AGGRESSIVE', 'COMPETITIVE', 'HIGH_PROFIT', 'MANUAL'];

interface Body {
  isActive?:        boolean;
  priceUzs?:        number;
  pricingStrategy?: PricingStrategy;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json() as Body;
  const data: { isActive?: boolean; priceUzs?: number; pricingStrategy?: PricingStrategy } = {};
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
  if (typeof body.priceUzs === 'number' && body.priceUzs > 0) data.priceUzs = Math.round(body.priceUzs);
  if (body.pricingStrategy && STRATEGIES.includes(body.pricingStrategy)) data.pricingStrategy = body.pricingStrategy;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: 'Нечего сохранять' }, { status: 400 });
  }

  const variant = await prisma.$transaction(async tx => {
    const existing = await tx.game_variants.findUnique({ where: { id: params.id } });
    if (!existing) throw new Error('NOT_FOUND');

    const updated = await tx.game_variants.update({ where: { id: params.id }, data });
    await syncGameFromVariants(tx, existing.gameId);
    return updated;
  }).catch(err => {
    if (err instanceof Error && err.message === 'NOT_FOUND') return null;
    throw err;
  });

  if (!variant) {
    return NextResponse.json({ ok: false, error: 'Вариант не найден' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, variant });
}
