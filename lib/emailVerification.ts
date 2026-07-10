import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';

const TTL_HOURS = 24;

/** Issue (or reissue) a verification token and email the confirmation link. */
export async function issueVerificationEmail(
  userId: string,
  email: string,
  username: string,
): Promise<void> {
  // Telegram/Steam accounts carry synthetic addresses — never mail them
  if (email.endsWith('@arcane.internal')) return;

  // One active token per user
  await prisma.email_verification_tokens.deleteMany({ where: { userId } });

  const token = crypto.randomBytes(32).toString('hex');
  await prisma.email_verification_tokens.create({
    data: { userId, token, expiresAt: new Date(Date.now() + TTL_HOURS * 3600_000) },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://arcane.com.uz';
  await sendVerificationEmail({
    to:        email,
    username,
    verifyUrl: `${baseUrl}/verify-email?token=${token}`,
  });
}
