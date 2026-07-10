import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { issueVerificationEmail } from '@/lib/emailVerification';

export const dynamic = 'force-dynamic';

// POST /api/auth/resend-verification — resend the link to the logged-in user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limited = rateLimit(req, { limit: 3, windowSec: 900, key: `resend-verify:${session.user.id}` });
  if (limited) return limited;

  const user = await prisma.users.findUnique({
    where:  { id: session.user.id },
    select: { id: true, email: true, username: true, emailVerified: true },
  });
  if (!user) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ success: true, alreadyVerified: true });

  await issueVerificationEmail(user.id, user.email, user.username);
  return NextResponse.json({ success: true });
}
