import { NextResponse } from 'next/server';
import { getProduct, isG2aEnabled } from '@/lib/g2a';

/* GET /api/g2a/product/[id] — ⚠ UNVERIFIED integration, see lib/g2a/config.ts */

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
      source: isG2aEnabled() ? 'g2a' : 'mock',
      product,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[G2A] /api/g2a/product/${id} error:`, message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
