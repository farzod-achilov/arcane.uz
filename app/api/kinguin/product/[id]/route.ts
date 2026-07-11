import { NextResponse } from 'next/server';
import { getProduct, isKinguinEnabled } from '@/lib/kinguin';

/* ─────────────────────────────────────────────────────────
   GET /api/kinguin/product/[id]
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    const product = await getProduct(id);
    if (!product) {
      return NextResponse.json({ ok: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      source: isKinguinEnabled() ? 'kinguin' : 'mock',
      product,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Kinguin] /api/kinguin/product/${id} error:`, message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
