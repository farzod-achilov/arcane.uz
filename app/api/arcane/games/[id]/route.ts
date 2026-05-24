import { NextResponse } from 'next/server';
import { gameStore } from '@/lib/gameStore';

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
