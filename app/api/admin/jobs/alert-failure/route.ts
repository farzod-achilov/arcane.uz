import { NextResponse } from 'next/server';
import { notifyAdminJobFailure } from '@/lib/adminTelegram';
import { requireAdmin } from '@/lib/apiGuard';
import { TtlCache } from '@/lib/shared/ttlCache';

/* ─────────────────────────────────────────────────────────
   POST /api/admin/jobs/alert-failure

   Generic Telegram alert for any arcane-api cron job that fails
   several times in a row — arcane-api/src/jobs/scheduler.ts calls
   this once a job's consecutiveFailures count crosses its threshold,
   for ANY of its 14 registered jobs (games sync, key inventory,
   supplier catalog sync, pricing, balance-check itself). Without
   this, a job silently failing every cycle (e.g. RAWG_API_KEY
   expired, a supplier endpoint changed shape) would only show up in
   `pm2 logs`, which nobody watches proactively.

   De-dup per job name, same cooldown pattern as
   /api/admin/kinguin/balance-check — avoids re-alerting every cron
   tick while a job stays broken. Resets once the job succeeds again
   (arcane-api resets its own consecutiveFailures counter on success;
   this route's cooldown independently expires after ALERT_COOLDOWN_SECONDS).
───────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

const ALERT_COOLDOWN_SECONDS = 6 * 60 * 60; // 6h
const jobAlertCache = new TtlCache();

interface Body {
  jobName?:             string;
  error?:                string;
  consecutiveFailures?: number;
}

export async function POST(request: Request) {
  const secret   = request.headers.get('x-sync-secret');
  const expected = process.env.SYNC_SECRET;
  const secretOk = expected && secret === expected;
  if (!secretOk) {
    const guard = await requireAdmin();
    if (guard) return guard;
  }

  const body = await request.json() as Body;
  const jobName = body.jobName?.trim();
  const error = body.error?.trim();
  const consecutiveFailures = Number(body.consecutiveFailures ?? 0);

  if (!jobName || !error) {
    return NextResponse.json({ ok: false, error: 'jobName and error are required' }, { status: 400 });
  }

  const cacheKey = `job-alert-sent:${jobName}`;
  if (jobAlertCache.get<boolean>(cacheKey)) {
    return NextResponse.json({ ok: true, alerted: false, note: 'already alerted, in cooldown' });
  }

  await notifyAdminJobFailure({ jobName, error, consecutiveFailures });
  jobAlertCache.set(cacheKey, true, ALERT_COOLDOWN_SECONDS);

  return NextResponse.json({ ok: true, alerted: true });
}
