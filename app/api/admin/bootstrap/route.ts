import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * One-time bootstrap: sets isAdmin=true for the target user.
 * Permanently disabled once any admin exists.
 * Requires BOOTSTRAP_SECRET header to prevent unauthorized calls.
 */
export async function GET(req: Request) {
  // Require secret to prevent unauthorized bootstrap
  const secret = process.env.BOOTSTRAP_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'BOOTSTRAP_SECRET env var is not set — bootstrap is disabled' },
      { status: 403 },
    );
  }
  if (req.headers.get('x-bootstrap-secret') !== secret) {
    return NextResponse.json({ error: 'Invalid bootstrap secret' }, { status: 403 });
  }

  const adminCount = await prisma.users.count({ where: { isAdmin: true } });
  if (adminCount > 0) {
    return NextResponse.json({ error: 'Bootstrap already done — admin exists' }, { status: 403 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return NextResponse.json({ error: 'ADMIN_EMAIL env var is not set' }, { status: 500 });
  }

  const updated = await prisma.users.updateMany({
    where: { email: adminEmail.toLowerCase().trim() },
    data:  { isAdmin: true, updatedAt: new Date() },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: `User ${adminEmail} not found. Register first.` }, { status: 404 });
  }

  return NextResponse.json({ ok: true, message: 'Admin access granted. Re-login to apply.' });
}
