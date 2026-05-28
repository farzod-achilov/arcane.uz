import { createHash, createHmac } from 'crypto';

export interface TelegramAuthData {
  id:         string | number;
  first_name: string;
  last_name?: string;
  username?:  string;
  photo_url?: string;
  auth_date:  string | number;
  hash:       string;
}

export function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  const { hash, ...fields } = data;

  const checkString = (Object.keys(fields) as (keyof typeof fields)[])
    .filter(k => fields[k] !== undefined && fields[k] !== null && fields[k] !== '')
    .sort()
    .map(k => `${k}=${fields[k]}`)
    .join('\n');

  const secretKey    = createHash('sha256').update(botToken).digest();
  const computedHash = createHmac('sha256', secretKey).update(checkString).digest('hex');

  return computedHash === hash;
}

// Verify using ALL fields from a raw key-value map (used when tgAuthResult has unknown extra fields)
export function verifyTelegramRaw(raw: Record<string, string>, botToken: string): boolean {
  const { hash, ...fields } = raw;
  if (!hash) return false;

  const checkString = Object.keys(fields)
    .filter(k => fields[k] !== undefined && fields[k] !== null && fields[k] !== '')
    .sort()
    .map(k => `${k}=${fields[k]}`)
    .join('\n');

  const secretKey    = createHash('sha256').update(botToken).digest();
  const computedHash = createHmac('sha256', secretKey).update(checkString).digest('hex');

  return computedHash === hash;
}

export function decodeTgAuthResult(tgAuthResult: string): Record<string, string> {
  const base64 = tgAuthResult.replace(/-/g, '+').replace(/_/g, '/');
  const pad    = (4 - base64.length % 4) % 4;
  const json   = Buffer.from(base64 + '='.repeat(pad), 'base64').toString('utf-8');
  const parsed = JSON.parse(json) as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed)) result[k] = String(v);
  return result;
}

export function isTelegramAuthFresh(authDate: string | number, maxAgeSeconds = 86400): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now - Number(authDate) <= maxAgeSeconds;
}
