import { NextResponse } from 'next/server';
import { gameStore } from '@/lib/gameStore';
import { requireAdmin } from '@/lib/apiGuard';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const BACKEND   = process.env.ARCANE_API_URL ?? 'http://localhost:4000';
const SVC_TOKEN = process.env.ARCANE_SERVICE_TOKEN ?? '';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(SVC_TOKEN ? { Authorization: `Bearer ${SVC_TOKEN}` } : {}),
  };
}

// ── GET /api/arcane/games/[id] ────────────────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // A ?variantId= request always resolves locally — arcane-api (a separate
  // backend/schema) has no concept of game_variants, so proxying there
  // would silently ignore the variant and return the game's base price.
  // This is what checkout uses to charge the price the customer actually
  // picked (e.g. "Аккаунт" instead of the cheaper "Ключ"), not the
  // synced-to-minimum games.priceUzs.
  const variantId = new URL(req.url).searchParams.get('variantId');
  if (variantId) {
    const variant = await prisma.game_variants.findUnique({ where: { id: variantId } });
    if (!variant || variant.gameId !== params.id || !variant.isActive) {
      return NextResponse.json({ success: false, error: 'Variant not found' }, { status: 404 });
    }
    const game = await gameStore.getById(params.id);
    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: {
        ...game,
        priceUzs:     variant.priceUzs,
        priceUsd:     variant.priceUsd ?? game.priceUsd,
        deliveryType: variant.deliveryType,
        variantId:    variant.id,
        variantLabel: variant.label,
      },
    });
  }

  // 1. Try arcane-api backend first
  try {
    const res = await fetch(`${BACKEND}/api/games/${params.id}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return NextResponse.json(await res.json());
  } catch {
    // backend offline — fall through to DB
  }

  // 2. Fallback: query PostgreSQL directly
  const game = await gameStore.getById(params.id);
  if (!game) {
    return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: game });
}

// ── DELETE /api/arcane/games/[id] ─────────────────────────────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  // 1. Try arcane-api backend first
  try {
    const res = await fetch(`${BACKEND}/api/games/admin/${params.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return NextResponse.json({ success: true });
  } catch {
    // backend offline — fall through to DB
  }

  // 2. Fallback: delete from PostgreSQL directly
  try {
    await gameStore.deleteById(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }
}

// ── PATCH /api/arcane/games/[id] ──────────────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/api/games/admin/${params.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 502 }
    );
  }
}
