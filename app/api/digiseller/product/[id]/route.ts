import { NextResponse } from 'next/server';
import { getProduct, isDigisellerEnabled } from '@/lib/digiseller';

/* ─────────────────────────────────────────────────────────
   GET /api/digiseller/product/[id]
   Returns a single product by Digiseller good_id or ARCANE slug
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
      return NextResponse.json(
        { ok: false, error: 'Product not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      source: isDigisellerEnabled() ? 'digiseller' : 'mock',
      product,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Digiseller] /api/digiseller/product/${id} error:`, message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 502 },
    );
  }
}
