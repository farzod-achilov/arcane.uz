import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuard';
import { upsertGamePricing } from '@/lib/smartPricing/repository';

export const dynamic = 'force-dynamic';

/* ─────────────────────────────────────────────────────────
   PATCH /api/admin/game/[id]/steam-price

   Steam's reference price is a property of the GAME — Steam sells one
   canonical version regardless of which Kinguin delivery-format variant
   a customer buys from us — so unlike PATCH /api/admin/game/[id]/pricing
   (which recalculates games.priceUzs, a value with no defined meaning
   once a game has multiple variant SKUs, and is blocked with 409 for
   exactly that reason), editing just the Steam figure doesn't need to
   touch games.priceUzs at all and stays open for variant-games too.
───────────────────────────────────────────────────────── */

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json() as { steamPriceUsd?: number | null };
  if (body.steamPriceUsd != null && (typeof body.steamPriceUsd !== 'number' || body.steamPriceUsd <= 0)) {
    return NextResponse.json({ ok: false, error: 'steamPriceUsd должен быть больше 0' }, { status: 400 });
  }

  const saved = await upsertGamePricing(params.id, { steamPriceUsd: body.steamPriceUsd ?? null });

  return NextResponse.json({ ok: true, steamPriceUsd: saved.steamPriceUsd != null ? Number(saved.steamPriceUsd) : null });
}
