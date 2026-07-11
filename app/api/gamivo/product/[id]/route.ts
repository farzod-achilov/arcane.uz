import { NextResponse } from 'next/server';
import { getProduct, isGamivoEnabled } from '@/lib/gamivo';

/* GET /api/gamivo/product/[id] — ⚠ UNVERIFIED integration, see lib/gamivo/config.ts */

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
      source: isGamivoEnabled() ? 'gamivo' : 'mock',
      product,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Gamivo] /api/gamivo/product/${id} error:`, message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
