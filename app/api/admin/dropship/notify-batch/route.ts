import { NextResponse } from 'next/server';
import { requireAdminOrSyncSecret } from '@/lib/apiGuard';
import { notifyAdminBulkAddSummary } from '@/lib/adminTelegram';

/* ─────────────────────────────────────────────────────────
   POST /api/admin/dropship/notify-batch
   Body: { created, duplicates, failed, titles }

   Fired by BulkAddFlow.tsx once a bulk/quick-add batch finishes —
   sends a single Telegram summary instead of the admin having to
   keep the tab open and watch every row settle.
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

interface Body {
  created?:    unknown;
  duplicates?: unknown;
  failed?:     unknown;
  titles?:     unknown;
}

export async function POST(req: Request) {
  const guard = await requireAdminOrSyncSecret(req);
  if (guard) return guard;

  const body = await req.json().catch(() => ({})) as Body;

  await notifyAdminBulkAddSummary({
    created:    Number(body.created) || 0,
    duplicates: Number(body.duplicates) || 0,
    failed:     Number(body.failed) || 0,
    titles:     Array.isArray(body.titles) ? body.titles.filter((t): t is string => typeof t === 'string') : [],
  });

  return NextResponse.json({ ok: true });
}
