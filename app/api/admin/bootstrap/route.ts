import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// One-time bootstrap: sets isAdmin=true for the first user in DB.
// Permanently disabled once any admin exists.
export async function GET() {
  const adminCount = await prisma.users.count({ where: { isAdmin: true } });
  if (adminCount > 0) {
    return NextResponse.json({ error: 'Bootstrap already done — admin exists' }, { status: 403 });
  }

  const updated = await prisma.users.updateMany({
    where: { email: 'farzodachilov27@gmail.com' },
    data:  { isAdmin: true, updatedAt: new Date() },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: 'User not found. Register first.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, message: 'Admin access granted. Re-login to apply.' });
}
