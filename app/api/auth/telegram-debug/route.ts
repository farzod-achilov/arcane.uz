import { NextResponse } from 'next/server';
import { createHash, createHmac } from 'crypto';

export const dynamic = 'force-dynamic';

// POST /api/auth/telegram-debug — shows exactly what happens during hash verification
export async function POST(req: Request) {
  const { tgAuthResult } = await req.json() as { tgAuthResult?: string };
  if (!tgAuthResult) return NextResponse.json({ error: 'no tgAuthResult' });

  const botToken = process.env.TELEGRAM_BOT_TOKEN ?? '';

  // Decode
  let raw: Record<string, string> = {};
  let decodeError = '';
  try {
    const base64 = tgAuthResult.replace(/-/g, '+').replace(/_/g, '/');
    const pad    = (4 - base64.length % 4) % 4;
    const json   = Buffer.from(base64 + '='.repeat(pad), 'base64').toString('utf-8');
    const parsed = JSON.parse(json) as Record<string, unknown>;
    for (const [k, v] of Object.entries(parsed)) raw[k] = String(v);
  } catch (e) {
    decodeError = String(e);
  }

  const { hash: receivedHash, ...fields } = raw;

  const checkString = Object.keys(fields)
    .filter(k => fields[k] !== undefined && fields[k] !== '')
    .sort()
    .map(k => `${k}=${fields[k]}`)
    .join('\n');

  const secretKey    = createHash('sha256').update(botToken).digest();
  const computedHash = createHmac('sha256', secretKey).update(checkString).digest('hex');

  const now       = Math.floor(Date.now() / 1000);
  const authDate  = Number(raw.auth_date ?? 0);
  const ageSec    = now - authDate;

  return NextResponse.json({
    decodeError:    decodeError || null,
    allFields:      Object.keys(raw),
    checkString,
    receivedHash,
    computedHash,
    hashMatch:      computedHash === receivedHash,
    authDateAge:    `${ageSec}s ago`,
    fresh:          ageSec <= 86400,
    botTokenSet:    !!botToken,
    botTokenPrefix: botToken.slice(0, 10) + '…',
  });
}
