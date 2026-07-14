import { NextResponse } from 'next/server';
import { requireAdminOrSyncSecret } from '@/lib/apiGuard';
import { createDropshipGame, type CreateDropshipGameInput } from '@/lib/dropship/createDropshipGame';

/* ─────────────────────────────────────────────────────────
   POST /api/admin/dropship/create

   Thin HTTP wrapper around lib/dropship/createDropshipGame.ts —
   the actual pricing/dedup/slug logic is shared with the
   unattended /api/admin/dropship/auto-import job, so both stay
   in lockstep instead of drifting into two copies of the same rules.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const guard = await requireAdminOrSyncSecret(req);
  if (guard) return guard;

  const body = await req.json() as CreateDropshipGameInput;
  const result = await createDropshipGame(body);

  return NextResponse.json(result, { status: result.status });
}
