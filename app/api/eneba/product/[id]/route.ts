import { NextResponse } from 'next/server';
import { getProduct, isEnebaEnabled } from '@/lib/eneba';

/* ─────────────────────────────────────────────────────────
   GET /api/eneba/product/[id]
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
      source: isEnebaEnabled() ? 'eneba' : 'mock',
      product,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Eneba] /api/eneba/product/${id} error:`, message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
