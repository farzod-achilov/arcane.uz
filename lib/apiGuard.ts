import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

/** Returns a 403 NextResponse if the request has no valid admin session, otherwise null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

/** Returns a 401 NextResponse if there is no active session, otherwise the session. */
export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { guard: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  }
  return { guard: null, session };
}

/**
 * Admin session OR the shared server-to-server secret (same SYNC_SECRET
 * already used by /api/kinguin/sync and /api/admin/pricing/dropship-reprice)
 * via the `x-sync-secret` header. Lets cron jobs and scripted catalog
 * operations call admin-only endpoints without a browser session, without
 * opening them up to the public.
 */
export async function requireAdminOrSyncSecret(req: Request): Promise<NextResponse | null> {
  const provided = req.headers.get('x-sync-secret');
  const expected = process.env.SYNC_SECRET;
  if (expected && provided === expected) return null;
  return requireAdmin();
}
