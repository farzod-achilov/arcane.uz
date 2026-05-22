import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND   = process.env.ARCANE_API_URL ?? 'http://localhost:4000';
const SVC_TOKEN = process.env.ARCANE_SERVICE_TOKEN ?? '';

function backendHeaders(isAdmin = false) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (SVC_TOKEN && isAdmin) h['Authorization'] = `Bearer ${SVC_TOKEN}`;
  return h;
}

// ── GET /api/arcane/games ─────────────────────────────────────────────────────
// Proxy to GET /api/games on arcane-api, with graceful fallback to mock data.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const qs = new URLSearchParams({
      ...(searchParams.get('search')   ? { search:   searchParams.get('search')!   } : {}),
      ...(searchParams.get('genre')    ? { genre:    searchParams.get('genre')!    } : {}),
      ...(searchParams.get('platform') ? { platform: searchParams.get('platform')! } : {}),
      page:  searchParams.get('page')  ?? '1',
      limit: searchParams.get('limit') ?? '100',
    });

    const res = await fetch(`${BACKEND}/api/games?${qs}`, {
      headers: backendHeaders(),
      next: { revalidate: 60 },        // ISR — revalidate every 60s
    });

    if (!res.ok) throw new Error(`Backend ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);

  } catch (err) {
    // Fallback: return mock data so storefront never breaks
    console.warn('[arcane-proxy] games GET failed, using mock fallback:', (err as Error).message);
    const { products } = await import('@/lib/mockData');
    return NextResponse.json({
      success: false,
      source: 'mock_fallback',
      data: [],
      mockProducts: products,
      pagination: { total: 0, page: 1, limit: 100, pages: 0 },
    });
  }
}

// ── POST /api/arcane/games ────────────────────────────────────────────────────
// Admin: create a new game. Forwards to POST /api/games/admin on arcane-api.

export async function POST(request: Request) {
  if (!SVC_TOKEN) {
    return NextResponse.json(
      { success: false, error: 'ARCANE_SERVICE_TOKEN not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND}/api/games`, {
      method: 'POST',
      headers: backendHeaders(true),
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 201 : res.status });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[arcane-proxy] games POST error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
