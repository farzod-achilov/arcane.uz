import { NextResponse } from 'next/server';
import { getProducts, isDigisellerEnabled } from '@/lib/digiseller';

/* ─────────────────────────────────────────────────────────
   GET /api/digiseller/products
   Returns full product list (real or mock, with cache)
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search    = searchParams.get('q')        ?? '';
  const category  = searchParams.get('category') ?? '';
  const platform  = searchParams.get('platform') ?? '';
  const sort      = searchParams.get('sort')      ?? 'default';

  try {
    let products = await getProducts();

    // Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      products = products.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some(t => t.includes(q)),
      );
    }
    if (category) {
      products = products.filter(p => p.category === category);
    }
    if (platform) {
      products = products.filter(p =>
        p.platform.some(pl => pl.toLowerCase() === platform.toLowerCase()),
      );
    }

    // Sort
    if (sort === 'price_asc')  products = [...products].sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') products = [...products].sort((a, b) => b.price - a.price);
    if (sort === 'rating')     products = [...products].sort((a, b) => b.rating - a.rating);
    if (sort === 'newest')     products = [...products].sort((a, b) =>
      new Date(b.releaseDate ?? 0).getTime() - new Date(a.releaseDate ?? 0).getTime(),
    );

    return NextResponse.json({
      ok: true,
      source: isDigisellerEnabled() ? 'digiseller' : 'mock',
      total: products.length,
      products,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Digiseller] /api/digiseller/products error:', message);

    // Graceful fallback — return mock data
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
