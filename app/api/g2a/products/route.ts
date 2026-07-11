import { NextResponse } from 'next/server';
import { getProducts, isG2aEnabled } from '@/lib/g2a';

/* ─────────────────────────────────────────────────────────
   GET /api/g2a/products — ⚠ UNVERIFIED integration, see lib/g2a/config.ts
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const platform = searchParams.get('platform') ?? '';
  const sort = searchParams.get('sort') ?? 'default';

  try {
    let products = await getProducts();

    if (search.trim()) {
      const q = search.toLowerCase();
      products = products.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some(t => t.includes(q)),
      );
    }
    if (category) products = products.filter(p => p.category === category);
    if (platform) {
      products = products.filter(p =>
        p.platform.some(pl => pl.toLowerCase() === platform.toLowerCase()),
      );
    }

    if (sort === 'price_asc') products = [...products].sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') products = [...products].sort((a, b) => b.price - a.price);
    if (sort === 'rating') products = [...products].sort((a, b) => b.rating - a.rating);

    return NextResponse.json({
      ok: true,
      source: isG2aEnabled() ? 'g2a' : 'mock',
      total: products.length,
      products,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[G2A] /api/g2a/products error:', message);

    const { products: mock } = await import('@/lib/mockData');
    return NextResponse.json({
      ok: false,
      source: 'mock_fallback',
      error: message,
      total: mock.length,
      products: mock,
    });
  }
}
