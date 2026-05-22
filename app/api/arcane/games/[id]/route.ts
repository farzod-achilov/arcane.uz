import { NextResponse } from 'next/server';

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
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const res = await fetch(`${BACKEND}/api/games/${params.id}`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 120 },
    });
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    return NextResponse.json(await res.json());
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 502 }
    );
  }
}

// ── PATCH /api/arcane/games/[id] ──────────────────────────────────────────────
// Admin: update game (isActive, price, etc.)

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
